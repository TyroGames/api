/**
 * Modelo para gestionar los arqueos de efectivo
 * @module models/Contabilidad/Tesoreria/cashReconciliationModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const CashAccount = require('./cashAccountModel');

/**
 * Clase para gestionar los arqueos de efectivo en el sistema de tesorería
 */
class CashReconciliation {
  /**
   * Obtener todas las conciliaciones de efectivo con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de conciliaciones de efectivo
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT cr.*, 
               ca.code as cash_account_code, ca.name as cash_account_name,
               ca.location as cash_account_location,
               c.symbol as currency_symbol,
               u.username as created_by_name,
               u2.username as reconciled_by_name
        FROM cash_reconciliations cr
        LEFT JOIN cash_accounts ca ON cr.cash_account_id = ca.id
        LEFT JOIN currencies c ON ca.currency_id = c.id
        LEFT JOIN users u ON cr.created_by = u.id
        LEFT JOIN users u2 ON cr.reconciled_by = u2.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.cash_account_id) {
        conditions.push("cr.cash_account_id = ?");
        queryParams.push(filters.cash_account_id);
      }

      if (filters.status) {
        conditions.push("cr.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.difference_type) {
        conditions.push("cr.difference_type = ?");
        queryParams.push(filters.difference_type);
      }

      if (filters.date_from) {
        conditions.push("cr.reconciliation_date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("cr.reconciliation_date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.reconciled_by) {
        conditions.push("cr.reconciled_by = ?");
        queryParams.push(filters.reconciled_by);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY cr.reconciliation_date DESC, cr.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener conciliaciones de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una conciliación de efectivo por ID
   * @param {number} id - ID de la conciliación de efectivo
   * @returns {Promise<Object>} Conciliación de efectivo con detalles
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT cr.*, 
                ca.code as cash_account_code, ca.name as cash_account_name,
                ca.location as cash_account_location, ca.responsible_user_id,
                c.name as currency_name, c.symbol as currency_symbol,
                u.username as created_by_name,
                u2.username as reconciled_by_name,
                ur.username as responsible_user_name
         FROM cash_reconciliations cr
         LEFT JOIN cash_accounts ca ON cr.cash_account_id = ca.id
         LEFT JOIN currencies c ON ca.currency_id = c.id
         LEFT JOIN users u ON cr.created_by = u.id
         LEFT JOIN users u2 ON cr.reconciled_by = u2.id
         LEFT JOIN users ur ON ca.responsible_user_id = ur.id
         WHERE cr.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener conciliación de efectivo con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo arqueo de efectivo
   * @param {Object} reconciliationData - Datos del arqueo de efectivo
   * @returns {Promise<Object>} Arqueo de efectivo creado
   */
  static async create(reconciliationData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que la cuenta de efectivo exista y esté activa
      const [cashAccount] = await connection.query(
        `SELECT id, current_balance, name, is_active FROM cash_accounts WHERE id = ?`,
        [reconciliationData.cash_account_id]
      );

      if (!cashAccount.length) {
        throw new Error('La cuenta de efectivo especificada no existe');
      }

      if (!cashAccount[0].is_active) {
        throw new Error('No se pueden crear arqueos para cuentas de efectivo inactivas');
      }

      // Obtener saldo actual del sistema
      const systemBalance = parseFloat(cashAccount[0].current_balance);
      const physicalCount = parseFloat(reconciliationData.physical_count);
      const differenceAmount = physicalCount - systemBalance;

      // Determinar tipo de diferencia
      let differenceType;
      if (differenceAmount > 0) {
        differenceType = 'overage'; // Sobrante
      } else if (differenceAmount < 0) {
        differenceType = 'shortage'; // Faltante
      } else {
        differenceType = 'balanced'; // Cuadrado
      }

      // Validar que no exista otro arqueo pendiente para la misma cuenta en la misma fecha
      const [existingReconciliation] = await connection.query(
        `SELECT id FROM cash_reconciliations 
         WHERE cash_account_id = ? AND reconciliation_date = ? AND status = 'pending'`,
        [reconciliationData.cash_account_id, reconciliationData.reconciliation_date]
      );

      if (existingReconciliation.length > 0) {
        throw new Error('Ya existe un arqueo pendiente para esta cuenta en la fecha especificada');
      }

      // Insertar el arqueo de efectivo
      const [result] = await connection.query(
        `INSERT INTO cash_reconciliations 
        (cash_account_id, reconciliation_date, system_balance, physical_count, 
         difference_amount, difference_type, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reconciliationData.cash_account_id,
          reconciliationData.reconciliation_date,
          systemBalance,
          physicalCount,
          Math.abs(differenceAmount), // Almacenar siempre positivo
          differenceType,
          reconciliationData.notes || null,
          'pending', // Siempre inicia como pendiente
          reconciliationData.created_by
        ]
      );

      await connection.commit();
      
      return { 
        id: result.insertId, 
        system_balance: systemBalance,
        physical_count: physicalCount,
        difference_amount: differenceAmount,
        difference_type: differenceType,
        status: 'pending',
        ...reconciliationData 
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear arqueo de efectivo: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Aprobar un arqueo de efectivo
   * @param {number} id - ID del arqueo
   * @param {number} userId - ID del usuario que aprueba
   * @param {boolean} createAdjustment - Si crear asiento de ajuste automáticamente
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async approve(id, userId, createAdjustment = false) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos del arqueo
      const [reconciliation] = await connection.query(
        `SELECT cr.*, ca.current_balance as actual_balance 
         FROM cash_reconciliations cr
         JOIN cash_accounts ca ON cr.cash_account_id = ca.id
         WHERE cr.id = ?`,
        [id]
      );

      if (!reconciliation.length) {
        throw new Error(`El arqueo de efectivo con ID ${id} no existe`);
      }

      const recon = reconciliation[0];

      if (recon.status !== 'pending') {
        throw new Error(`El arqueo ya está en estado ${recon.status} y no puede ser aprobado`);
      }

      // Actualizar estado del arqueo
      await connection.query(
        `UPDATE cash_reconciliations 
         SET status = 'approved', reconciled_at = NOW(), reconciled_by = ?
         WHERE id = ?`,
        [userId, id]
      );

      let adjustmentResult = null;

      // Si hay diferencia y se solicita crear ajuste automático
      if (recon.difference_type !== 'balanced' && createAdjustment) {
        // Calcular monto del ajuste con signo
        let adjustmentAmount = parseFloat(recon.difference_amount);
        if (recon.difference_type === 'shortage') {
          adjustmentAmount = -adjustmentAmount; // Faltante = ajuste negativo
        }

        // Actualizar saldo de la cuenta de efectivo
        await CashAccount.updateBalance(recon.cash_account_id, adjustmentAmount, connection);

        // Registrar el ajuste como movimiento
        const CashMovement = require('./cashMovementModel');
        const movementData = {
          cash_account_id: recon.cash_account_id,
          movement_type: recon.difference_type === 'overage' ? 'income' : 'expense',
          date: recon.reconciliation_date,
          description: `Ajuste por arqueo de efectivo ${recon.difference_type === 'overage' ? '(sobrante)' : '(faltante)'}`,
          amount: Math.abs(adjustmentAmount),
          document_type: 'arqueo',
          document_id: id,
          auto_confirm: true,
          created_by: userId
        };

        adjustmentResult = await CashMovement.create(movementData);

        // Actualizar el arqueo con el ID del asiento de ajuste si se genera
        await connection.query(
          `UPDATE cash_reconciliations SET status = 'adjusted' WHERE id = ?`,
          [id]
        );
      }

      await connection.commit();

      return {
        reconciliation_id: id,
        previous_status: 'pending',
        new_status: createAdjustment && recon.difference_type !== 'balanced' ? 'adjusted' : 'approved',
        approved_by: userId,
        approved_at: new Date(),
        adjustment_created: adjustmentResult !== null,
        adjustment_movement_id: adjustmentResult ? adjustmentResult.id : null
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al aprobar arqueo de efectivo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener arqueos por cuenta de efectivo
   * @param {number} cashAccountId - ID de la cuenta de efectivo
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Lista de arqueos
   */
  static async getByCashAccount(cashAccountId, filters = {}) {
    try {
      let query = `
        SELECT cr.*, 
               u.username as created_by_name,
               u2.username as reconciled_by_name
        FROM cash_reconciliations cr
        LEFT JOIN users u ON cr.created_by = u.id
        LEFT JOIN users u2 ON cr.reconciled_by = u2.id
        WHERE cr.cash_account_id = ?
      `;

      const queryParams = [cashAccountId];

      // Aplicar filtros adicionales
      if (filters.status) {
        query += " AND cr.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.difference_type) {
        query += " AND cr.difference_type = ?";
        queryParams.push(filters.difference_type);
      }

      if (filters.date_from) {
        query += " AND cr.reconciliation_date >= ?";
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += " AND cr.reconciliation_date <= ?";
        queryParams.push(filters.date_to);
      }

      query += " ORDER BY cr.reconciliation_date DESC, cr.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener arqueos por cuenta de efectivo ${cashAccountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de arqueos por período
   * @param {number} cashAccountId - ID de la cuenta de efectivo (opcional)
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @returns {Promise<Object>} Resumen de arqueos
   */
  static async getSummaryByPeriod(cashAccountId = null, dateFrom, dateTo) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_reconciliations,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reconciliations,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reconciliations,
          COUNT(CASE WHEN status = 'adjusted' THEN 1 END) as adjusted_reconciliations,
          COUNT(CASE WHEN difference_type = 'balanced' THEN 1 END) as balanced_reconciliations,
          COUNT(CASE WHEN difference_type = 'overage' THEN 1 END) as overage_reconciliations,
          COUNT(CASE WHEN difference_type = 'shortage' THEN 1 END) as shortage_reconciliations,
          SUM(CASE WHEN difference_type = 'overage' THEN difference_amount ELSE 0 END) as total_overage,
          SUM(CASE WHEN difference_type = 'shortage' THEN difference_amount ELSE 0 END) as total_shortage
        FROM cash_reconciliations
        WHERE reconciliation_date BETWEEN ? AND ?
      `;

      const queryParams = [dateFrom, dateTo];

      if (cashAccountId) {
        query += " AND cash_account_id = ?";
        queryParams.push(cashAccountId);
      }

      const [rows] = await pool.query(query, queryParams);
      const summary = rows[0];

      // Calcular diferencia neta
      summary.net_difference = parseFloat(summary.total_overage || 0) - parseFloat(summary.total_shortage || 0);

      return summary;
    } catch (error) {
      logger.error(`Error al obtener resumen de arqueos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar arqueos de efectivo por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de arqueos que coinciden
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT cr.id, cr.reconciliation_date, cr.difference_amount, cr.difference_type, cr.status,
                ca.code as cash_account_code, ca.name as cash_account_name,
                ca.location as cash_account_location
         FROM cash_reconciliations cr
         LEFT JOIN cash_accounts ca ON cr.cash_account_id = ca.id
         WHERE ca.code LIKE ? 
         OR ca.name LIKE ?
         OR ca.location LIKE ?
         OR cr.notes LIKE ?
         ORDER BY cr.reconciliation_date DESC
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar arqueos de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener arqueos pendientes que requieren atención
   * @param {number} daysThreshold - Días de antigüedad para considerar crítico
   * @returns {Promise<Array>} Lista de arqueos pendientes críticos
   */
  static async getPendingCritical(daysThreshold = 3) {
    try {
      const [rows] = await pool.query(
        `SELECT cr.*, 
                ca.code as cash_account_code, ca.name as cash_account_name,
                ca.location as cash_account_location,
                DATEDIFF(CURDATE(), cr.reconciliation_date) as days_pending
         FROM cash_reconciliations cr
         LEFT JOIN cash_accounts ca ON cr.cash_account_id = ca.id
         WHERE cr.status = 'pending' 
         AND DATEDIFF(CURDATE(), cr.reconciliation_date) >= ?
         ORDER BY cr.reconciliation_date ASC`,
        [daysThreshold]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al obtener arqueos críticos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de arqueos por cuenta
   * @param {number} cashAccountId - ID de la cuenta de efectivo
   * @param {number} lastMonths - Número de meses hacia atrás para análisis
   * @returns {Promise<Object>} Estadísticas de arqueos
   */
  static async getAccountStatistics(cashAccountId, lastMonths = 6) {
    try {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) as total_reconciliations,
           AVG(ABS(difference_amount)) as avg_difference,
           MAX(ABS(difference_amount)) as max_difference,
           COUNT(CASE WHEN difference_type = 'balanced' THEN 1 END) as balanced_count,
           COUNT(CASE WHEN difference_type = 'overage' THEN 1 END) as overage_count,
           COUNT(CASE WHEN difference_type = 'shortage' THEN 1 END) as shortage_count,
           ROUND((COUNT(CASE WHEN difference_type = 'balanced' THEN 1 END) * 100.0 / COUNT(*)), 2) as accuracy_percentage
         FROM cash_reconciliations
         WHERE cash_account_id = ? 
         AND reconciliation_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`,
        [cashAccountId, lastMonths]
      );

      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener estadísticas de arqueos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CashReconciliation;