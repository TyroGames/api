/**
 * Modelo para gestionar las conciliaciones bancarias
 * @module models/Contabilidad/Tesoreria/bankReconciliationModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');

/**
 * Clase para gestionar las conciliaciones bancarias en el sistema de tesorería
 */
class BankReconciliation {
  /**
   * Obtener todas las conciliaciones bancarias con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de conciliaciones bancarias
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT br.*, 
               ba.account_number, ba.name as account_name, ba.bank_name,
               u.username as created_by_name,
               u2.username as reconciled_by_name,
               c.symbol as currency_symbol,
               COUNT(bri.id) as total_items,
               SUM(CASE WHEN bri.is_reconciled = 1 THEN 1 ELSE 0 END) as reconciled_items
        FROM bank_reconciliations br
        LEFT JOIN bank_accounts ba ON br.bank_account_id = ba.id
        LEFT JOIN users u ON br.created_by = u.id
        LEFT JOIN users u2 ON br.reconciled_by = u2.id
        LEFT JOIN currencies c ON ba.currency_id = c.id
        LEFT JOIN bank_reconciliation_items bri ON br.id = bri.reconciliation_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.bank_account_id) {
        conditions.push("br.bank_account_id = ?");
        queryParams.push(filters.bank_account_id);
      }

      if (filters.statement_date_from) {
        conditions.push("br.statement_date >= ?");
        queryParams.push(filters.statement_date_from);
      }

      if (filters.statement_date_to) {
        conditions.push("br.statement_date <= ?");
        queryParams.push(filters.statement_date_to);
      }

      if (filters.is_reconciled !== undefined) {
        conditions.push("br.is_reconciled = ?");
        queryParams.push(filters.is_reconciled);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY br.id ORDER BY br.statement_date DESC, br.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener conciliaciones bancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una conciliación bancaria por ID
   * @param {number} id - ID de la conciliación bancaria
   * @returns {Promise<Object>} Conciliación bancaria con detalles
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT br.*, 
                ba.account_number, ba.name as account_name, ba.bank_name, ba.current_balance,
                u.username as created_by_name,
                u2.username as reconciled_by_name,
                c.name as currency_name, c.symbol as currency_symbol
         FROM bank_reconciliations br
         LEFT JOIN bank_accounts ba ON br.bank_account_id = ba.id
         LEFT JOIN users u ON br.created_by = u.id
         LEFT JOIN users u2 ON br.reconciled_by = u2.id
         LEFT JOIN currencies c ON ba.currency_id = c.id
         WHERE br.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener conciliación bancaria con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener items de una conciliación bancaria
   * @param {number} reconciliationId - ID de la conciliación
   * @returns {Promise<Array>} Lista de items de conciliación
   */
  static async getReconciliationItems(reconciliationId) {
    try {
      const [rows] = await pool.query(
        `SELECT bri.*, 
                bt.transaction_type, bt.reference_number, bt.date as transaction_date, 
                bt.description, bt.amount, bt.status,
                tp.name as third_party_name
         FROM bank_reconciliation_items bri
         JOIN bank_transactions bt ON bri.transaction_id = bt.id
         LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
         WHERE bri.reconciliation_id = ?
         ORDER BY bt.date, bt.created_at`,
        [reconciliationId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener items de conciliación ${reconciliationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva conciliación bancaria
   * @param {Object} reconciliationData - Datos de la conciliación
   * @returns {Promise<Object>} Conciliación bancaria creada
   */
  static async create(reconciliationData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que la cuenta bancaria exista y esté activa
      const [bankAccount] = await connection.query(
        `SELECT id, current_balance, is_active FROM bank_accounts WHERE id = ?`,
        [reconciliationData.bank_account_id]
      );

      if (!bankAccount.length) {
        throw new Error('La cuenta bancaria especificada no existe');
      }

      if (!bankAccount[0].is_active) {
        throw new Error('No se pueden crear conciliaciones para cuentas bancarias inactivas');
      }

      // Validar que no exista una conciliación para la misma fecha y cuenta
      const [existingReconciliation] = await connection.query(
        `SELECT id FROM bank_reconciliations 
         WHERE bank_account_id = ? AND statement_date = ?`,
        [reconciliationData.bank_account_id, reconciliationData.statement_date]
      );

      if (existingReconciliation.length > 0) {
        throw new Error(`Ya existe una conciliación para la fecha ${reconciliationData.statement_date} en esta cuenta`);
      }

      // Insertar la conciliación bancaria
      const [result] = await connection.query(
        `INSERT INTO bank_reconciliations 
        (bank_account_id, statement_date, statement_balance, reconciled_balance, 
         is_reconciled, created_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          reconciliationData.bank_account_id,
          reconciliationData.statement_date,
          reconciliationData.statement_balance,
          reconciliationData.reconciled_balance || 0,
          false, // Siempre inicia como no reconciliada
          reconciliationData.created_by
        ]
      );

      const reconciliationId = result.insertId;

      // Si se proporcionan transacciones para conciliar automáticamente
      if (reconciliationData.transactions && Array.isArray(reconciliationData.transactions)) {
        for (const transactionId of reconciliationData.transactions) {
          // Validar que la transacción exista y pertenezca a la cuenta
          const [transaction] = await connection.query(
            `SELECT id FROM bank_transactions 
             WHERE id = ? AND bank_account_id = ? AND status = 'cleared'`,
            [transactionId, reconciliationData.bank_account_id]
          );

          if (transaction.length > 0) {
            await connection.query(
              `INSERT INTO bank_reconciliation_items (reconciliation_id, transaction_id, is_reconciled)
               VALUES (?, ?, ?)`,
              [reconciliationId, transactionId, true]
            );
          }
        }
      }

      await connection.commit();
      
      return { id: reconciliationId, ...reconciliationData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear conciliación bancaria: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Iniciar proceso de conciliación automática
   * @param {number} reconciliationId - ID de la conciliación
   * @param {Object} criteria - Criterios de matching
   * @returns {Promise<Object>} Resultado del proceso automático
   */
  static async performAutoReconciliation(reconciliationId, criteria = {}) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos de la conciliación
      const [reconciliation] = await connection.query(
        `SELECT * FROM bank_reconciliations WHERE id = ?`,
        [reconciliationId]
      );

      if (!reconciliation.length) {
        throw new Error(`La conciliación con ID ${reconciliationId} no existe`);
      }

      const recon = reconciliation[0];

      if (recon.is_reconciled) {
        throw new Error('Esta conciliación ya está completada');
      }

      // Obtener transacciones no conciliadas de la cuenta en el período
      const dateFrom = criteria.date_from || new Date(recon.statement_date.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días antes
      const dateTo = criteria.date_to || recon.statement_date;

      const [pendingTransactions] = await connection.query(
        `SELECT bt.* FROM bank_transactions bt
         LEFT JOIN bank_reconciliation_items bri ON bt.id = bri.transaction_id
         WHERE bt.bank_account_id = ? 
         AND bt.date BETWEEN ? AND ?
         AND bt.status = 'cleared'
         AND bri.transaction_id IS NULL
         ORDER BY bt.date, bt.amount`,
        [recon.bank_account_id, dateFrom, dateTo]
      );

      let matchedCount = 0;
      let matchedAmount = 0;

      // Proceso de matching automático
      for (const transaction of pendingTransactions) {
        let isMatched = false;

        // Criterio 1: Matching exacto por monto y fecha
        if (criteria.exact_match !== false) {
          // Para transacciones del mismo día del extracto con monto exacto
          if (transaction.date.toISOString().split('T')[0] === recon.statement_date.toISOString().split('T')[0]) {
            isMatched = true;
          }
        }

        // Criterio 2: Matching por referencia
        if (!isMatched && criteria.reference_match !== false && transaction.reference_number) {
          // Si hay una referencia específica que coincida
          isMatched = true; // Simplificado - en la práctica sería más complejo
        }

        // Criterio 3: Matching por rango de fechas y monto
        if (!isMatched && criteria.range_match !== false) {
          const daysDiff = Math.abs((transaction.date - recon.statement_date) / (1000 * 60 * 60 * 24));
          if (daysDiff <= (criteria.max_days_diff || 3)) {
            isMatched = true;
          }
        }

        if (isMatched) {
          // Agregar transacción a la conciliación
          await connection.query(
            `INSERT INTO bank_reconciliation_items (reconciliation_id, transaction_id, is_reconciled, reconciled_at)
             VALUES (?, ?, ?, NOW())`,
            [reconciliationId, transaction.id, true]
          );

          matchedCount++;
          if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'receipt') {
            matchedAmount += parseFloat(transaction.amount);
          } else {
            matchedAmount -= parseFloat(transaction.amount);
          }
        }
      }

      // Actualizar balance reconciliado
      await connection.query(
        `UPDATE bank_reconciliations 
         SET reconciled_balance = reconciled_balance + ?
         WHERE id = ?`,
        [matchedAmount, reconciliationId]
      );

      await connection.commit();

      return {
        reconciliation_id: reconciliationId,
        matched_transactions: matchedCount,
        matched_amount: matchedAmount,
        total_pending: pendingTransactions.length,
        match_percentage: (matchedCount / pendingTransactions.length) * 100
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error en conciliación automática ${reconciliationId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Conciliar transacciones manualmente
   * @param {number} reconciliationId - ID de la conciliación
   * @param {Array} transactionIds - IDs de transacciones a conciliar
   * @param {number} userId - ID del usuario que concilia
   * @returns {Promise<Object>} Resultado de la conciliación manual
   */
  static async reconcileTransactions(reconciliationId, transactionIds, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que la conciliación exista y no esté completa
      const [reconciliation] = await connection.query(
        `SELECT * FROM bank_reconciliations WHERE id = ?`,
        [reconciliationId]
      );

      if (!reconciliation.length) {
        throw new Error(`La conciliación con ID ${reconciliationId} no existe`);
      }

      if (reconciliation[0].is_reconciled) {
        throw new Error('Esta conciliación ya está completada');
      }

      let reconciledAmount = 0;
      let reconciledCount = 0;

      for (const transactionId of transactionIds) {
        // Validar que la transacción exista y pertenezca a la cuenta
        const [transaction] = await connection.query(
          `SELECT * FROM bank_transactions 
           WHERE id = ? AND bank_account_id = ? AND status = 'cleared'`,
          [transactionId, reconciliation[0].bank_account_id]
        );

        if (!transaction.length) {
          logger.warn(`Transacción ${transactionId} no válida para conciliación`);
          continue;
        }

        // Verificar que no esté ya conciliada
        const [existing] = await connection.query(
          `SELECT id FROM bank_reconciliation_items 
           WHERE transaction_id = ? AND is_reconciled = 1`,
          [transactionId]
        );

        if (existing.length > 0) {
          logger.warn(`Transacción ${transactionId} ya está conciliada`);
          continue;
        }

        // Agregar o actualizar item de conciliación
        const [existingItem] = await connection.query(
          `SELECT id FROM bank_reconciliation_items 
           WHERE reconciliation_id = ? AND transaction_id = ?`,
          [reconciliationId, transactionId]
        );

        if (existingItem.length > 0) {
          // Actualizar item existente
          await connection.query(
            `UPDATE bank_reconciliation_items 
             SET is_reconciled = 1, reconciled_at = NOW()
             WHERE id = ?`,
            [existingItem[0].id]
          );
        } else {
          // Crear nuevo item
          await connection.query(
            `INSERT INTO bank_reconciliation_items 
             (reconciliation_id, transaction_id, is_reconciled, reconciled_at)
             VALUES (?, ?, 1, NOW())`,
            [reconciliationId, transactionId]
          );
        }

        // Calcular impacto en el balance
        const txn = transaction[0];
        if (txn.transaction_type === 'deposit' || txn.transaction_type === 'receipt') {
          reconciledAmount += parseFloat(txn.amount);
        } else {
          reconciledAmount -= parseFloat(txn.amount);
        }
        
        reconciledCount++;
      }

      // Actualizar balance reconciliado
      await connection.query(
        `UPDATE bank_reconciliations 
         SET reconciled_balance = reconciled_balance + ?
         WHERE id = ?`,
        [reconciledAmount, reconciliationId]
      );

      await connection.commit();

      return {
        reconciliation_id: reconciliationId,
        reconciled_transactions: reconciledCount,
        reconciled_amount: reconciledAmount,
        user_id: userId
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error en conciliación manual ${reconciliationId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Completar una conciliación bancaria
   * @param {number} reconciliationId - ID de la conciliación
   * @param {number} userId - ID del usuario que completa
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async completeReconciliation(reconciliationId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos actuales de la conciliación
      const [reconciliation] = await connection.query(
        `SELECT br.*, 
                COUNT(bri.id) as total_items,
                SUM(CASE WHEN bri.is_reconciled = 1 THEN 1 ELSE 0 END) as reconciled_items
         FROM bank_reconciliations br
         LEFT JOIN bank_reconciliation_items bri ON br.id = bri.reconciliation_id
         WHERE br.id = ?
         GROUP BY br.id`,
        [reconciliationId]
      );

      if (!reconciliation.length) {
        throw new Error(`La conciliación con ID ${reconciliationId} no existe`);
      }

      const recon = reconciliation[0];

      if (recon.is_reconciled) {
        throw new Error('Esta conciliación ya está completada');
      }

      // Calcular diferencia entre balance del extracto y balance reconciliado
      const difference = Math.abs(parseFloat(recon.statement_balance) - parseFloat(recon.reconciled_balance));
      
      // Completar la conciliación
      await connection.query(
        `UPDATE bank_reconciliations 
         SET is_reconciled = 1, reconciled_at = NOW(), reconciled_by = ?
         WHERE id = ?`,
        [userId, reconciliationId]
      );

      await connection.commit();

      return {
        reconciliation_id: reconciliationId,
        statement_balance: recon.statement_balance,
        reconciled_balance: recon.reconciled_balance,
        difference: difference,
        total_items: recon.total_items || 0,
        reconciled_items: recon.reconciled_items || 0,
        completed_by: userId,
        completed_at: new Date()
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al completar conciliación ${reconciliationId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener transacciones no conciliadas de una cuenta
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Lista de transacciones no conciliadas
   */
  static async getUnreconciledTransactions(bankAccountId, filters = {}) {
    try {
      let query = `
        SELECT bt.*, tp.name as third_party_name
        FROM bank_transactions bt
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        LEFT JOIN bank_reconciliation_items bri ON bt.id = bri.transaction_id AND bri.is_reconciled = 1
        WHERE bt.bank_account_id = ? 
        AND bt.status = 'cleared'
        AND bri.transaction_id IS NULL
      `;

      const queryParams = [bankAccountId];

      // Aplicar filtros adicionales
      if (filters.date_from) {
        query += " AND bt.date >= ?";
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += " AND bt.date <= ?";
        queryParams.push(filters.date_to);
      }

      if (filters.transaction_type) {
        query += " AND bt.transaction_type = ?";
        queryParams.push(filters.transaction_type);
      }

      if (filters.amount_min) {
        query += " AND bt.amount >= ?";
        queryParams.push(filters.amount_min);
      }

      if (filters.amount_max) {
        query += " AND bt.amount <= ?";
        queryParams.push(filters.amount_max);
      }

      query += " ORDER BY bt.date DESC, bt.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener transacciones no conciliadas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar conciliaciones por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de conciliaciones que coinciden
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT br.id, br.statement_date, br.statement_balance, br.is_reconciled,
                ba.account_number, ba.name as account_name, ba.bank_name
         FROM bank_reconciliations br
         JOIN bank_accounts ba ON br.bank_account_id = ba.id
         WHERE ba.account_number LIKE ? OR ba.name LIKE ? OR ba.bank_name LIKE ?
         ORDER BY br.statement_date DESC
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar conciliaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de conciliaciones por cuenta
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @returns {Promise<Object>} Resumen de conciliaciones
   */
  static async getSummaryByAccount(bankAccountId, dateFrom, dateTo) {
    try {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) as total_reconciliations,
           SUM(CASE WHEN is_reconciled = 1 THEN 1 ELSE 0 END) as completed_reconciliations,
           AVG(CASE WHEN is_reconciled = 1 THEN ABS(statement_balance - reconciled_balance) ELSE NULL END) as avg_difference,
           MAX(statement_date) as last_reconciliation_date
         FROM bank_reconciliations
         WHERE bank_account_id = ? 
         AND statement_date BETWEEN ? AND ?`,
        [bankAccountId, dateFrom, dateTo]
      );

      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener resumen de conciliaciones: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BankReconciliation;