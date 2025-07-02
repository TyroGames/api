/**
 * Modelo para gestionar los asientos contables
 * @module models/Contabilidad/General/Asientos_Contables/journalEntryModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const BankTransactionIntegration = require('../../Tesoreria/bankTransactionIntegrationModel');

/**
 * Clase para gestionar los asientos contables en el sistema
 */
class JournalEntry {
  /**
   * Obtener todos los asientos contables con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de asientos contables
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT je.*, u.username as created_by_name, 
               fp.start_date as period_start, fp.end_date as period_end,
               COALESCE(tp.name, '') as third_party_name
        FROM journal_entries je
        LEFT JOIN users u ON je.created_by = u.id
        LEFT JOIN fiscal_periods fp ON je.fiscal_period_id = fp.id
        LEFT JOIN users u2 ON je.posted_by = u2.id
        LEFT JOIN third_parties tp ON je.third_party_id = tp.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.entry_number) {
        conditions.push("je.entry_number LIKE ?");
        queryParams.push(`%${filters.entry_number}%`);
      }

      if (filters.date_from) {
        conditions.push("je.date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("je.date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.status) {
        conditions.push("je.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.fiscal_period_id) {
        conditions.push("je.fiscal_period_id = ?");
        queryParams.push(filters.fiscal_period_id);
      }

      if (filters.third_party_id) {
        conditions.push("je.third_party_id = ?");
        queryParams.push(filters.third_party_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY je.date DESC, je.id DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener asientos contables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un asiento contable por ID
   * @param {number} id - ID del asiento contable
   * @returns {Promise<Object>} Asiento contable con sus líneas
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT je.*, u.username as created_by_name, 
                fp.start_date as period_start, fp.end_date as period_end,
                tp.name as third_party_name, tp.code as third_party_code
         FROM journal_entries je
         LEFT JOIN users u ON je.created_by = u.id
         LEFT JOIN fiscal_periods fp ON je.fiscal_period_id = fp.id
         LEFT JOIN third_parties tp ON je.third_party_id = tp.id
         WHERE je.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener asiento contable con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener las líneas de un asiento contable
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<Array>} Líneas del asiento contable
   */
  static async getLinesById(journalEntryId) {
    try {
      const [rows] = await pool.query(
        `SELECT jel.*, coa.name as account_name, 
                coa.code as account_code,
                coa.balance_type as account_balance_type,
                tp.name as third_party_name, tp.code as third_party_code
         FROM journal_entry_lines jel
         LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
         LEFT JOIN third_parties tp ON jel.third_party_id = tp.id
         WHERE jel.journal_entry_id = ?
         ORDER BY jel.order_number ASC`,
        [journalEntryId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener líneas del asiento contable ${journalEntryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo asiento contable
   * @param {Object} journalEntryData - Datos del asiento contable
   * @param {Array} lines - Datos de las líneas del asiento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(journalEntryData, lines) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Formatear entrada de datos
      journalEntryData.status = journalEntryData.status || 'draft';
      
      // Insertar cabecera del asiento
      const [result] = await connection.query(
        `INSERT INTO journal_entries 
        (entry_number, date, fiscal_period_id, reference, description, 
         third_party_id, status, is_adjustment, is_recurring, source_document_type, 
         source_document_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          journalEntryData.entry_number,
          journalEntryData.date,
          journalEntryData.fiscal_period_id,
          journalEntryData.reference || '',
          journalEntryData.description,
          journalEntryData.third_party_id || null,
          journalEntryData.status,
          journalEntryData.is_adjustment || false,
          journalEntryData.is_recurring || false,
          journalEntryData.source_document_type || null,
          journalEntryData.source_document_id || null,
          journalEntryData.created_by
        ]
      );
      
      const journalEntryId = result.insertId;
      
      // Insertar líneas del asiento
      let total_debit = 0;
      let total_credit = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        await connection.query(
          `INSERT INTO journal_entry_lines 
          (journal_entry_id, account_id, third_party_id, description, debit_amount, 
           credit_amount, order_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            journalEntryId,
            line.account_id,
            line.third_party_id || journalEntryData.third_party_id || null,
            line.description || '',
            line.debit_amount || 0,
            line.credit_amount || 0,
            i + 1
          ]
        );
        
        total_debit += parseFloat(line.debit_amount || 0);
        total_credit += parseFloat(line.credit_amount || 0);
      }
      
      // Actualizar totales en la cabecera
      await connection.query(
        `UPDATE journal_entries 
         SET total_debit = ?, total_credit = ?
         WHERE id = ?`,
        [total_debit, total_credit, journalEntryId]
      );
      
      await connection.commit();
      
      return { id: journalEntryId, ...journalEntryData, total_debit, total_credit };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear asiento contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un asiento contable
   * @param {number} id - ID del asiento contable
   * @param {Object} journalEntryData - Datos del asiento a actualizar
   * @param {Array} lines - Datos de las líneas del asiento
   * @returns {Promise<Object>} Resultado de la actualización
   */
  static async update(id, journalEntryData, lines) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Actualizar cabecera del asiento
      await connection.query(
        `UPDATE journal_entries SET
         entry_number = ?, date = ?, fiscal_period_id = ?, 
         reference = ?, description = ?, third_party_id = ?,
         is_adjustment = ?, is_recurring = ?,
         source_document_type = ?, source_document_id = ?
         WHERE id = ? AND status = 'draft'`,
        [
          journalEntryData.entry_number,
          journalEntryData.date,
          journalEntryData.fiscal_period_id,
          journalEntryData.reference || '',
          journalEntryData.description,
          journalEntryData.third_party_id || null,
          journalEntryData.is_adjustment || false,
          journalEntryData.is_recurring || false,
          journalEntryData.source_document_type || null,
          journalEntryData.source_document_id || null,
          id
        ]
      );
      
      // Eliminar líneas existentes
      await connection.query(
        `DELETE FROM journal_entry_lines WHERE journal_entry_id = ?`,
        [id]
      );
      
      // Insertar nuevas líneas
      let total_debit = 0;
      let total_credit = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        await connection.query(
          `INSERT INTO journal_entry_lines 
          (journal_entry_id, account_id, third_party_id, description, debit_amount, 
           credit_amount, order_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            line.account_id,
            line.third_party_id || journalEntryData.third_party_id || null,
            line.description || '',
            line.debit_amount || 0,
            line.credit_amount || 0,
            i + 1
          ]
        );
        
        total_debit += parseFloat(line.debit_amount || 0);
        total_credit += parseFloat(line.credit_amount || 0);
      }
      
      // Actualizar totales en la cabecera
      await connection.query(
        `UPDATE journal_entries 
         SET total_debit = ?, total_credit = ?
         WHERE id = ?`,
        [total_debit, total_credit, id]
      );
      
      await connection.commit();
      
      return { id, ...journalEntryData, total_debit, total_credit };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar asiento contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Aprobar un asiento contable (pasar de borrador a contabilizado)
   * @param {number} id - ID del asiento contable
   * @param {number} userId - ID del usuario que contabiliza el asiento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async post(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el asiento esté en estado borrador
      const [journalEntry] = await connection.query(
        `SELECT * FROM journal_entries WHERE id = ?`,
        [id]
      );
      
      if (!journalEntry.length || journalEntry[0].status !== 'draft') {
        throw new Error('El asiento contable no existe o no está en estado borrador');
      }
      
      // Verificar que el asiento esté balanceado (débito = crédito)
      if (Math.abs(journalEntry[0].total_debit - journalEntry[0].total_credit) > 0.01) {
        throw new Error('El asiento contable no está balanceado (débito ≠ crédito)');
      }
      
      // Actualizar estado a "posted" y registrar quién lo aprobó
      await connection.query(
        `UPDATE journal_entries 
         SET status = 'posted', posted_by = ?, posted_at = NOW()
         WHERE id = ?`,
        [userId, id]
      );
      
      // Actualizar saldos de cuentas (ejemplo simplificado)
      const [lines] = await connection.query(
        `SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?`,
        [id]
      );
      
      for (const line of lines) {
        // Aquí iría la lógica para actualizar saldos en account_balances
        // Este es un ejemplo básico, la implementación real dependería de la estructura específica
        await connection.query(
          `INSERT INTO account_balances 
           (account_id, fiscal_period_id, debit_balance, credit_balance)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           debit_balance = debit_balance + ?,
           credit_balance = credit_balance + ?`,
          [
            line.account_id,
            journalEntry[0].fiscal_period_id,
            line.debit_amount,
            line.credit_amount,
            line.debit_amount,
            line.credit_amount
          ]
        );
      }

      // *** NUEVA FUNCIONALIDAD: Crear transacciones bancarias automáticamente ***
      try {
        console.log('lines', lines);
        // Verificar si el asiento afecta cuentas bancarias
        const hasBankAccountLines = await BankTransactionIntegration.hasJournalEntryBankAccountLines(lines);
        
        if (hasBankAccountLines) {
          logger.info(`Asiento contable ${id} afecta cuentas bancarias, creando transacciones automáticamente`);
          
          // Crear transacciones bancarias automáticamente
          const createdTransactions = await BankTransactionIntegration.processJournalEntryForBankTransactions(
            id, 
            lines, 
            connection
          );
          
          if (createdTransactions.length > 0) {
            logger.info(`Se crearon ${createdTransactions.length} transacciones bancarias automáticamente para el asiento ${id}`);
          }
        }
      } catch (bankError) {
        // Log del error pero no fallar el proceso principal del asiento
        logger.error(`Error al crear transacciones bancarias automáticas para asiento ${id}: ${bankError.message}`);
        // Opcionalmente podrías decidir si esto debería hacer rollback del asiento completo
        // Para mayor seguridad, continuamos sin fallar el asiento
      }
      
      //await connection.commit();
      await connection.rollback();
      return { id, status: 'posted', posted_by: userId, posted_at: new Date() };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al aprobar asiento contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Anular un asiento contable
   * @param {number} id - ID del asiento contable
   * @param {number} userId - ID del usuario que anula el asiento
   * @param {string} reason - Motivo de la anulación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async reverse(id, userId, reason) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el asiento exista y esté aprobado
      const [journalEntry] = await connection.query(
        `SELECT * FROM journal_entries WHERE id = ?`,
        [id]
      );
      
      if (!journalEntry.length || journalEntry[0].status !== 'posted') {
        throw new Error('El asiento contable no existe o no está aprobado');
      }
      
      // Cambiar estado a "reversed"
      await connection.query(
        `UPDATE journal_entries 
         SET status = 'reversed'
         WHERE id = ?`,
        [id]
      );
      
      // Crear un nuevo asiento de reversión
      const originalEntry = journalEntry[0];
      
      const [reversalResult] = await connection.query(
        `INSERT INTO journal_entries 
        (entry_number, date, fiscal_period_id, reference, description, 
         status, is_adjustment, source_document_type, source_document_id, 
         created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `CANC-${originalEntry.entry_number}`,
          new Date(),
          originalEntry.fiscal_period_id,
          `Anulación de ${originalEntry.entry_number}`,
          reason || `Anulación del asiento ${originalEntry.entry_number}`,
          'posted',
          true,
          'reversal',
          originalEntry.id,
          userId
        ]
      );
      
      const reversalId = reversalResult.insertId;
      
      // Obtener líneas del asiento original
      const [originalLines] = await connection.query(
        `SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?`,
        [id]
      );
      
      // Crear líneas inversas para el asiento de reversión
      let total_debit = 0;
      let total_credit = 0;
      
      for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i];
        
        // Invertir débito y crédito
        await connection.query(
          `INSERT INTO journal_entry_lines 
          (journal_entry_id, account_id, description, debit_amount, 
           credit_amount, order_number)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            reversalId,
            line.account_id,
            `Anulación: ${line.description}`,
            line.credit_amount, // Invertimos débito y crédito
            line.debit_amount,  // Invertimos débito y crédito
            i + 1
          ]
        );
        
        total_debit += parseFloat(line.credit_amount || 0);
        total_credit += parseFloat(line.debit_amount || 0);
      }
      
      // Actualizar totales en la cabecera de reversión
      await connection.query(
        `UPDATE journal_entries 
         SET total_debit = ?, total_credit = ?, posted_by = ?, posted_at = NOW()
         WHERE id = ?`,
        [total_debit, total_credit, userId, reversalId]
      );
      
      // Revertir los saldos de las cuentas afectadas
      for (const line of originalLines) {
        // Actualizar saldos - también aquí sería específico a la implementación
        await connection.query(
          `UPDATE account_balances 
           SET debit_balance = debit_balance - ?,
               credit_balance = credit_balance - ?
           WHERE account_id = ? AND fiscal_period_id = ?`,
          [
            line.debit_amount,
            line.credit_amount,
            line.account_id,
            originalEntry.fiscal_period_id
          ]
        );
      }

      // *** NUEVA FUNCIONALIDAD: Anular transacciones bancarias automáticamente ***
      try {
        // Anular transacciones bancarias asociadas al asiento original
        const voidedTransactions = await BankTransactionIntegration.voidBankTransactionsByJournalEntry(
          id, 
          userId, 
          `Asiento reversado: ${reason}`
        );
        
        if (voidedTransactions.length > 0) {
          logger.info(`Se anularon ${voidedTransactions.length} transacciones bancarias por reversión del asiento ${id}`);
        }
      } catch (bankError) {
        // Log del error pero no fallar el proceso principal de reversión
        logger.error(`Error al anular transacciones bancarias del asiento ${id}: ${bankError.message}`);
        // Opcionalmente podrías decidir si esto debería hacer rollback de la reversión completa
      }
      
      await connection.commit();
      
      return { 
        original_id: id, 
        reversal_id: reversalId, 
        status: 'reversed',
        reason: reason
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al anular asiento contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un asiento contable (solo si está en borrador)
   * @param {number} id - ID del asiento contable
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el asiento esté en estado borrador
      const [journalEntry] = await connection.query(
        `SELECT * FROM journal_entries WHERE id = ?`,
        [id]
      );
      
      if (!journalEntry.length || journalEntry[0].status !== 'draft') {
        throw new Error('El asiento contable no existe o no está en estado borrador');
      }
      
      // Eliminar líneas
      await connection.query(
        `DELETE FROM journal_entry_lines WHERE journal_entry_id = ?`,
        [id]
      );
      
      // Eliminar cabecera
      await connection.query(
        `DELETE FROM journal_entries WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar asiento contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar número de asiento contable
   * @param {string} type - Tipo de asiento (opcional, por defecto 'JE')
   * @returns {Promise<string>} Número de asiento generado
   */
  static async generateEntryNumber(type = 'JE') {
    try {
      const year = new Date().getFullYear();
      
      // Obtener el último número usado para este tipo y año
      const [rows] = await pool.query(
        `SELECT MAX(CAST(SUBSTRING_INDEX(entry_number, '-', -1) AS UNSIGNED)) as last_number
         FROM journal_entries
         WHERE entry_number LIKE ?`,
        [`${type}-${year}-%`]
      );
      
      const lastNumber = rows[0].last_number || 0;
      const nextNumber = lastNumber + 1;
      
      // Formato: TIPO-AÑO-NÚMERO (ej. JE-2023-00001)
      return `${type}-${year}-${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      logger.error(`Error al generar número de asiento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener transacciones bancarias asociadas a un asiento contable
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<Array>} Lista de transacciones bancarias
   */
  static async getBankTransactions(journalEntryId) {
    try {
      return await BankTransactionIntegration.getBankTransactionsByJournalEntry(journalEntryId);
    } catch (error) {
      logger.error(`Error al obtener transacciones bancarias del asiento ${journalEntryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar sincronización entre asiento contable y transacciones bancarias
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<Object>} Resultado de la validación
   */
  static async validateBankSynchronization(journalEntryId) {
    try {
      return await BankTransactionIntegration.validateJournalEntryBankSync(journalEntryId);
    } catch (error) {
      logger.error(`Error al validar sincronización bancaria del asiento ${journalEntryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si un asiento contable afecta cuentas bancarias
   * @param {number} journalEntryId - ID del asiento contable
   * @returns {Promise<boolean>} True si afecta cuentas bancarias, false si no
   */
  static async affectsBankAccounts(journalEntryId) {
    try {
      const lines = await this.getLinesById(journalEntryId);
      return await BankTransactionIntegration.hasJournalEntryBankAccountLines(lines);
    } catch (error) {
      logger.error(`Error al verificar si el asiento ${journalEntryId} afecta cuentas bancarias: ${error.message}`);
      throw error;
    }
  }
}

module.exports = JournalEntry; 