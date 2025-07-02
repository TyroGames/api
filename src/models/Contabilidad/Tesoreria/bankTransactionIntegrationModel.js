/**
 * Modelo para gestionar la integración automática entre asientos contables y transacciones bancarias
 * @module models/Contabilidad/Tesoreria/bankTransactionIntegrationModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const BankAccount = require('./bankAccountModel');
const BankTransaction = require('./bankTransactionModel');

/**
 * Clase para gestionar la integración automática entre asientos contables y transacciones bancarias
 */
class BankTransactionIntegration {

  /**
   * Procesar un asiento contable y crear transacciones bancarias automáticamente (OPTIMIZADO)
   * @param {number} journalEntryId - ID del asiento contable
   * @param {Array} journalEntryLines - Líneas del asiento contable
   * @param {Object} connection - Conexión de base de datos activa (opcional)
   * @returns {Promise<Array>} Array de transacciones bancarias creadas
   */
  static async processJournalEntryForBankTransactions(journalEntryId, journalEntryLines, connection = null) {
    const conn = connection || await pool.getConnection();
    const shouldReleaseConnection = !connection;
    const createdTransactions = [];

    try {
      if (!connection) {
        await conn.beginTransaction();
      }

      // *** OPTIMIZACIÓN: Obtener información del asiento UNA SOLA VEZ ***
      const [journalEntry] = await conn.query(
        `SELECT je.*, fp.start_date, fp.end_date 
         FROM journal_entries je
         LEFT JOIN fiscal_periods fp ON je.fiscal_period_id = fp.id
         WHERE je.id = ?`,
        [journalEntryId]
      );

      if (!journalEntry.length) {
        throw new Error(`Asiento contable con ID ${journalEntryId} no encontrado`);
      }

      const entryData = journalEntry[0];

      // *** OPTIMIZACIÓN: Obtener TODAS las cuentas bancarias de una vez ***
      const accountIds = journalEntryLines.map(line => line.account_id);
      
      if (accountIds.length === 0) {
        logger.warn('No hay líneas para procesar en el asiento contable');
        return [];
      }

      const [bankAccounts] = await conn.query(
        `SELECT ba.*, coa.id as gl_account_id
         FROM bank_accounts ba
         JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
         WHERE coa.id IN (${accountIds.map(() => '?').join(',')}) AND ba.is_active = 1`,
        accountIds
      );

      // Crear un mapa para acceso rápido
      const bankAccountMap = {};
      bankAccounts.forEach(ba => {
        bankAccountMap[ba.gl_account_id] = ba;
      });

      // *** OPTIMIZACIÓN: Procesar líneas de manera SECUENCIAL para evitar deadlocks ***
      for (const line of journalEntryLines) {
        const bankAccount = bankAccountMap[line.account_id];
        
        if (bankAccount) {
          logger.info(`Procesando línea de asiento que afecta cuenta bancaria: ${bankAccount.account_number}`);
          
          // Determinar tipo de transacción y monto
          const transactionData = this.determineTransactionType(line, bankAccount, entryData);
          
          if (transactionData) {
            try {
              // *** OPTIMIZACIÓN: Crear transacciones una por una para evitar deadlocks ***
              const bankTransaction = await this.createBankTransactionOptimized({
                ...transactionData,
                journal_entry_id: journalEntryId,
                status: 'cleared',
                created_by: entryData.created_by || entryData.posted_by
              }, conn);

              createdTransactions.push(bankTransaction);
              logger.info(`Transacción bancaria creada automáticamente: ${bankTransaction.id} para cuenta ${bankAccount.account_number}`);
            } catch (error) {
              logger.error(`Error al crear transacción bancaria para cuenta ${bankAccount.account_number}: ${error.message}`);
              // Continuar con las demás líneas aunque una falle
            }
          }
        }
      }

      if (!connection) {
        await conn.commit();
      }

      return createdTransactions;
    } catch (error) {
      if (!connection) {
        await conn.rollback();
      }
      logger.error(`Error al procesar asiento contable ${journalEntryId} para transacciones bancarias: ${error.message}`);
      throw error;
    } finally {
      if (shouldReleaseConnection) {
        conn.release();
      }
    }
  }

  /**
   * Crear transacción bancaria optimizada para evitar deadlocks
   * @param {Object} transactionData - Datos de la transacción
   * @param {Object} connection - Conexión de BD existente
   * @returns {Promise<Object>} Transacción creada
   */
  static async createBankTransactionOptimized(transactionData, connection) {
    try {
      // *** OPTIMIZACIÓN: Usar la conexión existente sin crear nueva transacción ***
      
      // Obtener saldo actual con lock mínimo
      const [bankAccount] = await connection.query(
        `SELECT current_balance FROM bank_accounts 
         WHERE id = ? AND is_active = 1 FOR UPDATE`,
        [transactionData.bank_account_id]
      );

      if (!bankAccount.length) {
        throw new Error(`Cuenta bancaria ${transactionData.bank_account_id} no encontrada o inactiva`);
      }

      // Calcular nuevo saldo
      const currentBalance = parseFloat(bankAccount[0].current_balance);
      let newBalance;

      if (['deposit', 'receipt'].includes(transactionData.transaction_type)) {
        newBalance = currentBalance + parseFloat(transactionData.amount);
      } else if (['withdrawal', 'payment', 'transfer'].includes(transactionData.transaction_type)) {
        newBalance = currentBalance - parseFloat(transactionData.amount);
      } else {
        newBalance = currentBalance;
      }

      // Insertar transacción
      const [result] = await connection.query(
        `INSERT INTO bank_transactions 
        (bank_account_id, transaction_type, reference_number, date, description, 
         amount, running_balance, status, document_type, document_id, 
         third_party_id, journal_entry_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionData.bank_account_id,
          transactionData.transaction_type,
          transactionData.reference_number || null,
          transactionData.date,
          transactionData.description || '',
          transactionData.amount,
          newBalance,
          transactionData.status || 'cleared',
          transactionData.document_type || null,
          transactionData.document_id || null,
          transactionData.third_party_id || null,
          transactionData.journal_entry_id || null,
          transactionData.created_by
        ]
      );

      // Actualizar saldo de cuenta
      if (transactionData.status === 'cleared') {
        await connection.query(
          `UPDATE bank_accounts 
           SET current_balance = ?, updated_at = NOW() 
           WHERE id = ?`,
          [newBalance, transactionData.bank_account_id]
        );
      }

      return { 
        id: result.insertId, 
        ...transactionData, 
        running_balance: newBalance 
      };

    } catch (error) {
      logger.error(`Error en createBankTransactionOptimized: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determinar el tipo de transacción bancaria basándose en la línea del asiento
   * @param {Object} line - Línea del asiento contable
   * @param {Object} bankAccount - Cuenta bancaria asociada
   * @param {Object} entryData - Datos del asiento contable
   * @returns {Object|null} Datos de la transacción bancaria o null si no aplica
   */
  static determineTransactionType(line, bankAccount, entryData) {
    const debitAmount = parseFloat(line.debit_amount || 0);
    const creditAmount = parseFloat(line.credit_amount || 0);
    
    // Validar que solo tenga débito o crédito, no ambos
    if (debitAmount > 0 && creditAmount > 0) {
      logger.warn(`Línea de asiento tiene tanto débito como crédito: ${line.id}`);
      return null;
    }

    if (debitAmount === 0 && creditAmount === 0) {
      logger.warn(`Línea de asiento sin monto: ${line.id}`);
      return null;
    }

    let transactionType, amount, description;

    if (debitAmount > 0) {
      // Débito en cuenta bancaria = Ingreso de dinero (depósito)
      transactionType = 'deposit';
      amount = debitAmount;
      description = `Depósito por asiento contable: ${entryData.description || line.description}`;
    } else if (creditAmount > 0) {
      // Crédito en cuenta bancaria = Salida de dinero (retiro/pago)
      transactionType = 'withdrawal';
      amount = creditAmount;
      description = `Retiro por asiento contable: ${entryData.description || line.description}`;
    }

    return {
      bank_account_id: bankAccount.id,
      transaction_type: transactionType,
      reference_number: entryData.entry_number,
      date: entryData.date,
      description: description,
      amount: amount,
      document_type: 'journal_entry',
      document_id: entryData.id,
      third_party_id: line.third_party_id || entryData.third_party_id
    };
  }

  /**
   * Verificar si un asiento contable tiene líneas que afectan cuentas bancarias
   * @param {Array} journalEntryLines - Líneas del asiento contable
   * @returns {Promise<boolean>} True si afecta cuentas bancarias, false si no
   */
  static async hasJournalEntryBankAccountLines(journalEntryLines) {
    try {
      for (const line of journalEntryLines) {
        const isLinked = await BankAccount.isGLAccountLinkedToBankAccount(line.account_id);
        if (isLinked) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error(`Error al verificar líneas de asiento para cuentas bancarias: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtener transacciones bancarias generadas por un asiento contable
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<Array>} Lista de transacciones bancarias
   */
  static async getBankTransactionsByJournalEntry(journalEntryId) {
    try {
      const [rows] = await pool.query(
        `SELECT bt.*, 
                ba.account_number, ba.name as account_name, ba.bank_name,
                c.symbol as currency_symbol
         FROM bank_transactions bt
         LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
         LEFT JOIN currencies c ON ba.currency_id = c.id
         WHERE bt.journal_entry_id = ?
         ORDER BY bt.created_at`,
        [journalEntryId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener transacciones bancarias por asiento ${journalEntryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Anular transacciones bancarias asociadas a un asiento contable
   * @param {number} journalEntryId - ID del asiento contable
   * @param {number} userId - ID del usuario que anula
   * @param {string} reason - Razón de la anulación
   * @returns {Promise<Array>} Lista de transacciones anuladas
   */
  static async voidBankTransactionsByJournalEntry(journalEntryId, userId, reason = 'Asiento contable reversado') {
    const connection = await pool.getConnection();
    const voidedTransactions = [];

    try {
      await connection.beginTransaction();

      // Obtener todas las transacciones bancarias del asiento
      const bankTransactions = await this.getBankTransactionsByJournalEntry(journalEntryId);

      // Anular cada transacción
      for (const transaction of bankTransactions) {
        if (transaction.status !== 'voided') {
          const voidResult = await BankTransaction.void(transaction.id, userId, reason);
          voidedTransactions.push(voidResult);
        }
      }

      await connection.commit();
      return voidedTransactions;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al anular transacciones bancarias del asiento ${journalEntryId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Validar que las transacciones bancarias están sincronizadas con el asiento contable
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<Object>} Resultado de la validación
   */
  static async validateJournalEntryBankSync(journalEntryId) {
    try {
      // Obtener líneas del asiento que afectan cuentas bancarias
      const [journalLines] = await pool.query(
        `SELECT jel.*, ba.id as bank_account_id, ba.account_number, ba.name as account_name
         FROM journal_entry_lines jel
         JOIN bank_accounts ba ON jel.account_id = ba.gl_account_id
         WHERE jel.journal_entry_id = ? AND ba.is_active = 1`,
        [journalEntryId]
      );

      // Obtener transacciones bancarias del asiento
      const bankTransactions = await this.getBankTransactionsByJournalEntry(journalEntryId);

      const validation = {
        journal_entry_id: journalEntryId,
        expected_transactions: journalLines.length,
        actual_transactions: bankTransactions.length,
        is_synchronized: journalLines.length === bankTransactions.length,
        discrepancies: []
      };

      // Verificar discrepancias
      for (const line of journalLines) {
        const matchingTransaction = bankTransactions.find(bt => 
          bt.bank_account_id === line.bank_account_id &&
          Math.abs(parseFloat(bt.amount) - Math.abs(parseFloat(line.debit_amount || 0) - parseFloat(line.credit_amount || 0))) < 0.01
        );

        if (!matchingTransaction) {
          validation.discrepancies.push({
            type: 'missing_transaction',
            account_id: line.account_id,
            account_number: line.account_number,
            expected_amount: Math.abs(parseFloat(line.debit_amount || 0) - parseFloat(line.credit_amount || 0))
          });
        }
      }

      return validation;
    } catch (error) {
      logger.error(`Error al validar sincronización de asiento ${journalEntryId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BankTransactionIntegration; 