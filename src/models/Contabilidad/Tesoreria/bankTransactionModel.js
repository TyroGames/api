/**
 * Modelo para gestionar los movimientos bancarios
 * @module models/Contabilidad/Tesoreria/bankTransactionModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const BankAccount = require('./bankAccountModel');

/**
 * Clase para gestionar los movimientos bancarios en el sistema de tesorería
 */
class BankTransaction {
  /**
   * Obtener todos los movimientos bancarios con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de movimientos bancarios
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT bt.*, 
               ba.account_number, ba.name as account_name, ba.bank_name,
               tp.name as third_party_name,
               u.username as created_by_name,
               c.symbol as currency_symbol
        FROM bank_transactions bt
        LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        LEFT JOIN users u ON bt.created_by = u.id
        LEFT JOIN currencies c ON ba.currency_id = c.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.bank_account_id) {
        conditions.push("bt.bank_account_id = ?");
        queryParams.push(filters.bank_account_id);
      }

      if (filters.transaction_type) {
        conditions.push("bt.transaction_type = ?");
        queryParams.push(filters.transaction_type);
      }

      if (filters.status) {
        conditions.push("bt.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        conditions.push("bt.date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("bt.date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.reference_number) {
        conditions.push("bt.reference_number LIKE ?");
        queryParams.push(`%${filters.reference_number}%`);
      }

      if (filters.third_party_id) {
        conditions.push("bt.third_party_id = ?");
        queryParams.push(filters.third_party_id);
      }

      if (filters.amount_min) {
        conditions.push("bt.amount >= ?");
        queryParams.push(filters.amount_min);
      }

      if (filters.amount_max) {
        conditions.push("bt.amount <= ?");
        queryParams.push(filters.amount_max);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY bt.date DESC, bt.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener movimientos bancarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un movimiento bancario por ID
   * @param {number} id - ID del movimiento bancario
   * @returns {Promise<Object>} Movimiento bancario
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT bt.*, 
                ba.account_number, ba.name as account_name, ba.bank_name,
                tp.name as third_party_name,
                u.username as created_by_name,
                c.symbol as currency_symbol,
                je.entry_number as journal_entry_number
         FROM bank_transactions bt
         LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
         LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
         LEFT JOIN users u ON bt.created_by = u.id
         LEFT JOIN currencies c ON ba.currency_id = c.id
         LEFT JOIN journal_entries je ON bt.journal_entry_id = je.id
         WHERE bt.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener movimiento bancario con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener movimientos bancarios por cuenta bancaria
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Lista de movimientos de la cuenta
   */
  static async getByBankAccount(bankAccountId, filters = {}) {
    try {
      let query = `
        SELECT bt.*, 
               tp.name as third_party_name,
               u.username as created_by_name,
               c.symbol as currency_symbol
        FROM bank_transactions bt
        LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        LEFT JOIN users u ON bt.created_by = u.id
        LEFT JOIN currencies c ON ba.currency_id = c.id
        WHERE bt.bank_account_id = ?
      `;

      const queryParams = [bankAccountId];

      // Aplicar filtros adicionales
      if (filters.status) {
        query += " AND bt.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        query += " AND bt.date >= ?";
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += " AND bt.date <= ?";
        queryParams.push(filters.date_to);
      }

      query += " ORDER BY bt.date DESC, bt.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener movimientos de cuenta bancaria ${bankAccountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo movimiento bancario con manejo de deadlocks optimizado
   * @param {Object} transactionData - Datos del movimiento bancario
   * @returns {Promise<Object>} Movimiento bancario creado
   */
  static async create(transactionData) {
    let connection = null;
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // *** OPTIMIZACIÓN: Lock inmediato y específico de la cuenta bancaria ***
        const [bankAccount] = await connection.query(
          `SELECT id, current_balance, is_active 
           FROM bank_accounts 
           WHERE id = ? AND is_active = 1 
           FOR UPDATE`,
          [transactionData.bank_account_id]
        );

        if (!bankAccount.length) {
          throw new Error('La cuenta bancaria especificada no existe o no está activa');
        }

        // Validaciones rápidas (sin queries adicionales)
        const validTypes = ['deposit', 'withdrawal', 'transfer', 'payment', 'receipt'];
        if (!validTypes.includes(transactionData.transaction_type)) {
          throw new Error(`Tipo de transacción inválido. Tipos permitidos: ${validTypes.join(', ')}`);
        }

        if (transactionData.amount <= 0) {
          throw new Error('El monto de la transacción debe ser mayor a cero');
        }

        // Calcular nuevo saldo
        const currentBalance = parseFloat(bankAccount[0].current_balance);
        let newBalance;

        if (['deposit', 'receipt'].includes(transactionData.transaction_type)) {
          newBalance = currentBalance + parseFloat(transactionData.amount);
        } else if (['withdrawal', 'payment', 'transfer'].includes(transactionData.transaction_type)) {
          newBalance = currentBalance - parseFloat(transactionData.amount);
          
          if (newBalance < 0 && !transactionData.allow_overdraft) {
            throw new Error('Fondos insuficientes para realizar la transacción');
          }
        } else {
          newBalance = currentBalance;
        }

        // *** OPTIMIZACIÓN: Insertar transacción y actualizar saldo en una sola operación ***
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
            transactionData.status || 'pending',
            transactionData.document_type || null,
            transactionData.document_id || null,
            transactionData.third_party_id || null,
            transactionData.journal_entry_id || null,
            transactionData.created_by
          ]
        );

        const transactionId = result.insertId;

        // *** OPTIMIZACIÓN: Actualizar saldo directamente sin llamadas externas ***
        if (transactionData.status === 'cleared') {
          await connection.query(
            `UPDATE bank_accounts 
             SET current_balance = ?, updated_at = NOW() 
             WHERE id = ?`,
            [newBalance, transactionData.bank_account_id]
          );
        }

        await connection.commit();
        
        return { id: transactionId, ...transactionData, running_balance: newBalance };
        
      } catch (error) {
        await connection.rollback();
        
        // *** MANEJO DE DEADLOCKS: Retry automático ***
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 'ER_LOCK_DEADLOCK') {
          logger.warn(`Deadlock detectado en intento ${attempt}/${maxRetries} para cuenta ${transactionData.bank_account_id}: ${error.message}`);
          
          if (attempt < maxRetries) {
            // Esperar un tiempo aleatorio antes del retry (entre 100-500ms)
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
            continue;
          }
        }
        
        logger.error(`Error al crear movimiento bancario (intento ${attempt}): ${error.message}`);
        throw error;
        
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }
    
    throw new Error(`No se pudo crear la transacción bancaria después de ${maxRetries} intentos debido a deadlocks`);
  }

  /**
   * Actualizar un movimiento bancario existente
   * @param {number} id - ID del movimiento bancario
   * @param {Object} transactionData - Datos actualizados del movimiento
   * @returns {Promise<Object>} Movimiento bancario actualizado
   */
  static async update(id, transactionData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la transacción exista y esté en estado pendiente
      const [transactionCheck] = await connection.query(
        `SELECT bt.*, ba.current_balance 
         FROM bank_transactions bt
         JOIN bank_accounts ba ON bt.bank_account_id = ba.id
         WHERE bt.id = ?`,
        [id]
      );

      if (!transactionCheck.length) {
        throw new Error(`El movimiento bancario con ID ${id} no existe`);
      }

      const currentTransaction = transactionCheck[0];

      if (currentTransaction.status !== 'pending') {
        throw new Error('Solo se pueden modificar transacciones en estado pendiente');
      }

      // Validar tipos de transacción si se está cambiando
      if (transactionData.transaction_type) {
        const validTypes = ['deposit', 'withdrawal', 'transfer', 'payment', 'receipt'];
        if (!validTypes.includes(transactionData.transaction_type)) {
          throw new Error(`Tipo de transacción inválido. Tipos permitidos: ${validTypes.join(', ')}`);
        }
      }

      // Validar monto si se está cambiando
      if (transactionData.amount && transactionData.amount <= 0) {
        throw new Error('El monto de la transacción debe ser mayor a cero');
      }

      // Validar tercero si se está cambiando
      if (transactionData.third_party_id) {
        const [thirdParty] = await connection.query(
          `SELECT id FROM third_parties WHERE id = ? AND is_active = 1`,
          [transactionData.third_party_id]
        );

        if (!thirdParty.length) {
          throw new Error('El tercero especificado no existe o no está activo');
        }
      }

      // Actualizar el movimiento bancario
      await connection.query(
        `UPDATE bank_transactions SET
         transaction_type = COALESCE(?, transaction_type),
         reference_number = COALESCE(?, reference_number),
         date = COALESCE(?, date),
         description = COALESCE(?, description),
         amount = COALESCE(?, amount),
         document_type = COALESCE(?, document_type),
         document_id = COALESCE(?, document_id),
         third_party_id = COALESCE(?, third_party_id),
         updated_at = NOW()
         WHERE id = ?`,
        [
          transactionData.transaction_type,
          transactionData.reference_number,
          transactionData.date,
          transactionData.description,
          transactionData.amount,
          transactionData.document_type,
          transactionData.document_id,
          transactionData.third_party_id,
          id
        ]
      );

      await connection.commit();
      
      return { id, ...transactionData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar movimiento bancario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Confirmar un movimiento bancario (cambiar estado a 'cleared')
   * @param {number} id - ID del movimiento bancario
   * @param {number} userId - ID del usuario que confirma
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async confirm(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la transacción exista y esté pendiente
      const [transaction] = await connection.query(
        `SELECT bt.*, ba.current_balance 
         FROM bank_transactions bt
         JOIN bank_accounts ba ON bt.bank_account_id = ba.id
         WHERE bt.id = ?`,
        [id]
      );

      if (!transaction.length) {
        throw new Error(`El movimiento bancario con ID ${id} no existe`);
      }

      const txn = transaction[0];

      if (txn.status !== 'pending') {
        throw new Error('Solo se pueden confirmar transacciones en estado pendiente');
      }

      // Calcular nuevo saldo
      const currentBalance = parseFloat(txn.current_balance);
      let newBalance;

      if (['deposit', 'receipt'].includes(txn.transaction_type)) {
        newBalance = currentBalance + parseFloat(txn.amount);
      } else if (['withdrawal', 'payment', 'transfer'].includes(txn.transaction_type)) {
        newBalance = currentBalance - parseFloat(txn.amount);
        
        // Validar fondos suficientes
        if (newBalance < 0) {
          throw new Error('Fondos insuficientes para confirmar la transacción');
        }
      } else {
        newBalance = currentBalance;
      }

      // Actualizar estado de la transacción y saldo corriente
      await connection.query(
        `UPDATE bank_transactions 
         SET status = 'cleared', running_balance = ?, cleared_date = ?, updated_at = NOW()
         WHERE id = ?`,
        [newBalance, new Date().toISOString().split('T')[0], id]
      );

      // Actualizar saldo de la cuenta bancaria
      await BankAccount.updateBalance(txn.bank_account_id, newBalance, connection);

      await connection.commit();
      
      return { 
        id, 
        previous_status: 'pending', 
        new_status: 'cleared',
        new_balance: newBalance,
        confirmed_by: userId,
        confirmed_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al confirmar movimiento bancario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Anular un movimiento bancario
   * @param {number} id - ID del movimiento bancario
   * @param {number} userId - ID del usuario que anula
   * @param {string} reason - Razón de la anulación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async void(id, userId, reason = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la transacción exista
      const [transaction] = await connection.query(
        `SELECT bt.*, ba.current_balance 
         FROM bank_transactions bt
         JOIN bank_accounts ba ON bt.bank_account_id = ba.id
         WHERE bt.id = ?`,
        [id]
      );

      if (!transaction.length) {
        throw new Error(`El movimiento bancario con ID ${id} no existe`);
      }

      const txn = transaction[0];

      if (txn.status === 'voided') {
        throw new Error('La transacción ya está anulada');
      }

      // Si la transacción ya fue confirmada, revertir el saldo
      if (txn.status === 'cleared') {
        const currentBalance = parseFloat(txn.current_balance);
        let newBalance;

        // Revertir el efecto de la transacción
        if (['deposit', 'receipt'].includes(txn.transaction_type)) {
          newBalance = currentBalance - parseFloat(txn.amount);
        } else if (['withdrawal', 'payment', 'transfer'].includes(txn.transaction_type)) {
          newBalance = currentBalance + parseFloat(txn.amount);
        } else {
          newBalance = currentBalance;
        }

        // Actualizar saldo de la cuenta bancaria
        await BankAccount.updateBalance(txn.bank_account_id, newBalance, connection);
      }

      // Actualizar estado de la transacción
      await connection.query(
        `UPDATE bank_transactions 
         SET status = 'voided', description = CONCAT(description, ' [ANULADO: ', ?, ']'), updated_at = NOW()
         WHERE id = ?`,
        [reason, id]
      );

      await connection.commit();
      
      return { 
        id, 
        previous_status: txn.status, 
        new_status: 'voided',
        voided_by: userId,
        voided_at: new Date(),
        reason
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al anular movimiento bancario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Buscar movimientos bancarios por texto
   * @param {string} searchText - Texto a buscar
   * @param {number} bankAccountId - ID de cuenta bancaria (opcional)
   * @returns {Promise<Array>} Lista de movimientos que coinciden con la búsqueda
   */
  static async search(searchText, bankAccountId = null) {
    try {
      let query = `
        SELECT bt.id, bt.reference_number, bt.date, bt.transaction_type, bt.amount, bt.description,
               ba.account_number, ba.name as account_name, ba.bank_name,
               tp.name as third_party_name,
               c.symbol as currency_symbol
        FROM bank_transactions bt
        LEFT JOIN bank_accounts ba ON bt.bank_account_id = ba.id
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        LEFT JOIN currencies c ON ba.currency_id = c.id
        WHERE bt.status != 'voided'
        AND (bt.reference_number LIKE ? OR bt.description LIKE ? OR tp.name LIKE ?)
      `;

      const queryParams = [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`];

      if (bankAccountId) {
        query += " AND bt.bank_account_id = ?";
        queryParams.push(bankAccountId);
      }

      query += " ORDER BY bt.date DESC, bt.created_at DESC LIMIT 20";

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al buscar movimientos bancarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de movimientos por período
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @returns {Promise<Object>} Resumen de movimientos
   */
  static async getSummaryByPeriod(bankAccountId, dateFrom, dateTo) {
    try {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) as total_transactions,
           SUM(CASE WHEN transaction_type IN ('deposit', 'receipt') THEN amount ELSE 0 END) as total_inflows,
           SUM(CASE WHEN transaction_type IN ('withdrawal', 'payment', 'transfer') THEN amount ELSE 0 END) as total_outflows,
           SUM(CASE WHEN transaction_type IN ('deposit', 'receipt') THEN amount ELSE -amount END) as net_movement
         FROM bank_transactions
         WHERE bank_account_id = ? 
         AND date BETWEEN ? AND ?
         AND status = 'cleared'`,
        [bankAccountId, dateFrom, dateTo]
      );

      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener resumen de movimientos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BankTransaction; 