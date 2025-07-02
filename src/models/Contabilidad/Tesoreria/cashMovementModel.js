/**
 * Modelo para gestionar los movimientos de efectivo
 * @module models/Contabilidad/Tesoreria/cashMovementModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const CashAccount = require('./cashAccountModel');

/**
 * Clase para gestionar los movimientos de efectivo en el sistema de tesorería
 */
class CashMovement {
  /**
   * Obtener todos los movimientos de efectivo con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de movimientos de efectivo
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT cm.*, 
               ca.code as cash_account_code, ca.name as cash_account_name,
               ca.location as cash_account_location,
               tp.name as third_party_name,
               u.username as created_by_name,
               u2.username as confirmed_by_name,
               c.symbol as currency_symbol
        FROM cash_movements cm
        LEFT JOIN cash_accounts ca ON cm.cash_account_id = ca.id
        LEFT JOIN third_parties tp ON cm.third_party_id = tp.id
        LEFT JOIN users u ON cm.created_by = u.id
        LEFT JOIN users u2 ON cm.confirmed_by = u2.id
        LEFT JOIN currencies c ON ca.currency_id = c.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.cash_account_id) {
        conditions.push("cm.cash_account_id = ?");
        queryParams.push(filters.cash_account_id);
      }

      if (filters.movement_type) {
        conditions.push("cm.movement_type = ?");
        queryParams.push(filters.movement_type);
      }

      if (filters.status) {
        conditions.push("cm.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        conditions.push("cm.date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("cm.date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.amount_min) {
        conditions.push("cm.amount >= ?");
        queryParams.push(filters.amount_min);
      }

      if (filters.amount_max) {
        conditions.push("cm.amount <= ?");
        queryParams.push(filters.amount_max);
      }

      if (filters.third_party_id) {
        conditions.push("cm.third_party_id = ?");
        queryParams.push(filters.third_party_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY cm.date DESC, cm.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener movimientos de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un movimiento de efectivo por ID
   * @param {number} id - ID del movimiento de efectivo
   * @returns {Promise<Object>} Movimiento de efectivo con detalles
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT cm.*, 
                ca.code as cash_account_code, ca.name as cash_account_name,
                ca.location as cash_account_location, ca.max_amount as cash_account_max_amount,
                tp.name as third_party_name,
                u.username as created_by_name,
                u2.username as confirmed_by_name,
                c.name as currency_name, c.symbol as currency_symbol
         FROM cash_movements cm
         LEFT JOIN cash_accounts ca ON cm.cash_account_id = ca.id
         LEFT JOIN third_parties tp ON cm.third_party_id = tp.id
         LEFT JOIN users u ON cm.created_by = u.id
         LEFT JOIN users u2 ON cm.confirmed_by = u2.id
         LEFT JOIN currencies c ON ca.currency_id = c.id
         WHERE cm.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener movimiento de efectivo con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo movimiento de efectivo
   * @param {Object} movementData - Datos del movimiento de efectivo
   * @returns {Promise<Object>} Movimiento de efectivo creado
   */
  static async create(movementData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que la cuenta de efectivo exista y esté activa
      const [cashAccount] = await connection.query(
        `SELECT id, current_balance, max_amount, is_active FROM cash_accounts WHERE id = ?`,
        [movementData.cash_account_id]
      );

      if (!cashAccount.length) {
        throw new Error('La cuenta de efectivo especificada no existe');
      }

      if (!cashAccount[0].is_active) {
        throw new Error('No se pueden crear movimientos para cuentas de efectivo inactivas');
      }

      // Validar tercero si se especifica
      if (movementData.third_party_id) {
        const [thirdParty] = await connection.query(
          `SELECT id FROM third_parties WHERE id = ? AND is_active = 1`,
          [movementData.third_party_id]
        );

        if (!thirdParty.length) {
          throw new Error('El tercero especificado no existe o no está activo');
        }
      }

      // Calcular el monto con signo según el tipo de movimiento
      let amountWithSign = parseFloat(movementData.amount);
      if (movementData.movement_type === 'expense' || movementData.movement_type === 'transfer_out') {
        amountWithSign = -Math.abs(amountWithSign);
      } else {
        amountWithSign = Math.abs(amountWithSign);
      }

      // Calcular nuevo saldo corriente
      const currentBalance = parseFloat(cashAccount[0].current_balance);
      const newRunningBalance = currentBalance + amountWithSign;

      // Validar saldo suficiente para egresos
      if (newRunningBalance < 0) {
        throw new Error(`Saldo insuficiente. Saldo actual: ${currentBalance}, Intento de movimiento: ${amountWithSign}`);
      }

      // Validar límite máximo si aplica
      const maxAmount = parseFloat(cashAccount[0].max_amount);
      if (maxAmount > 0 && newRunningBalance > maxAmount) {
        throw new Error(`El nuevo saldo (${newRunningBalance}) excede el límite máximo permitido (${maxAmount})`);
      }

      // Generar número de referencia si no se proporciona
      let referenceNumber = movementData.reference_number;
      if (!referenceNumber) {
        const [lastRef] = await connection.query(
          `SELECT reference_number FROM cash_movements 
           WHERE cash_account_id = ? AND reference_number LIKE 'CM-%' 
           ORDER BY id DESC LIMIT 1`,
          [movementData.cash_account_id]
        );

        let nextNum = 1;
        if (lastRef.length && lastRef[0].reference_number) {
          const match = lastRef[0].reference_number.match(/CM-(\d+)/);
          if (match) {
            nextNum = parseInt(match[1]) + 1;
          }
        }
        referenceNumber = `CM-${nextNum.toString().padStart(6, '0')}`;
      }

      // Insertar el movimiento de efectivo
      const [result] = await connection.query(
        `INSERT INTO cash_movements 
        (cash_account_id, movement_type, reference_number, date, description, 
         amount, running_balance, document_type, document_id, third_party_id, 
         status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movementData.cash_account_id,
          movementData.movement_type,
          referenceNumber,
          movementData.date,
          movementData.description || null,
          Math.abs(parseFloat(movementData.amount)), // Almacenar siempre positivo
          newRunningBalance,
          movementData.document_type || null,
          movementData.document_id || null,
          movementData.third_party_id || null,
          'pending', // Siempre inicia como pendiente
          movementData.created_by
        ]
      );

      const movementId = result.insertId;

      // Si el movimiento se confirma automáticamente, actualizar saldo de la cuenta
      if (movementData.auto_confirm) {
        await CashAccount.updateBalance(movementData.cash_account_id, amountWithSign, connection);
        
        await connection.query(
          `UPDATE cash_movements 
           SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = ?
           WHERE id = ?`,
          [movementData.created_by, movementId]
        );
      }

      await connection.commit();
      
      return { 
        id: movementId, 
        reference_number: referenceNumber,
        running_balance: newRunningBalance,
        ...movementData 
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear movimiento de efectivo: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Confirmar un movimiento de efectivo
   * @param {number} id - ID del movimiento
   * @param {number} userId - ID del usuario que confirma
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async confirm(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos del movimiento
      const [movement] = await connection.query(
        `SELECT * FROM cash_movements WHERE id = ?`,
        [id]
      );

      if (!movement.length) {
        throw new Error(`El movimiento de efectivo con ID ${id} no existe`);
      }

      const mov = movement[0];

      if (mov.status !== 'pending') {
        throw new Error(`El movimiento ya está en estado ${mov.status} y no puede ser confirmado`);
      }

      // Calcular el monto con signo según el tipo de movimiento
      let amountWithSign = parseFloat(mov.amount);
      if (mov.movement_type === 'expense' || mov.movement_type === 'transfer_out') {
        amountWithSign = -Math.abs(amountWithSign);
      } else {
        amountWithSign = Math.abs(amountWithSign);
      }

      // Actualizar saldo de la cuenta de efectivo
      const newBalance = await CashAccount.updateBalance(mov.cash_account_id, amountWithSign, connection);

      // Actualizar estado del movimiento
      await connection.query(
        `UPDATE cash_movements 
         SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = ?, running_balance = ?
         WHERE id = ?`,
        [userId, newBalance, id]
      );

      await connection.commit();

      return {
        movement_id: id,
        previous_status: 'pending',
        new_status: 'confirmed',
        new_balance: newBalance,
        confirmed_by: userId,
        confirmed_at: new Date()
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al confirmar movimiento de efectivo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancelar un movimiento de efectivo
   * @param {number} id - ID del movimiento
   * @param {number} userId - ID del usuario que cancela
   * @param {string} reason - Razón de la cancelación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async cancel(id, userId, reason = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos del movimiento
      const [movement] = await connection.query(
        `SELECT * FROM cash_movements WHERE id = ?`,
        [id]
      );

      if (!movement.length) {
        throw new Error(`El movimiento de efectivo con ID ${id} no existe`);
      }

      const mov = movement[0];

      if (mov.status === 'cancelled') {
        throw new Error('El movimiento ya está cancelado');
      }

      // Si el movimiento estaba confirmado, revertir el saldo
      if (mov.status === 'confirmed') {
        let amountWithSign = parseFloat(mov.amount);
        if (mov.movement_type === 'expense' || mov.movement_type === 'transfer_out') {
          amountWithSign = Math.abs(amountWithSign); // Revertir egreso
        } else {
          amountWithSign = -Math.abs(amountWithSign); // Revertir ingreso
        }

        await CashAccount.updateBalance(mov.cash_account_id, amountWithSign, connection);
      }

      // Cancelar el movimiento
      await connection.query(
        `UPDATE cash_movements 
         SET status = 'cancelled', confirmed_at = NOW(), confirmed_by = ?
         WHERE id = ?`,
        [userId, id]
      );

      await connection.commit();

      return {
        movement_id: id,
        previous_status: mov.status,
        new_status: 'cancelled',
        cancelled_by: userId,
        cancelled_at: new Date(),
        reason: reason
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cancelar movimiento de efectivo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener movimientos de efectivo por cuenta
   * @param {number} cashAccountId - ID de la cuenta de efectivo
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Lista de movimientos
   */
  static async getByCashAccount(cashAccountId, filters = {}) {
    try {
      let query = `
        SELECT cm.*, 
               tp.name as third_party_name,
               u.username as created_by_name
        FROM cash_movements cm
        LEFT JOIN third_parties tp ON cm.third_party_id = tp.id
        LEFT JOIN users u ON cm.created_by = u.id
        WHERE cm.cash_account_id = ?
      `;

      const queryParams = [cashAccountId];

      // Aplicar filtros adicionales
      if (filters.movement_type) {
        query += " AND cm.movement_type = ?";
        queryParams.push(filters.movement_type);
      }

      if (filters.status) {
        query += " AND cm.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        query += " AND cm.date >= ?";
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += " AND cm.date <= ?";
        queryParams.push(filters.date_to);
      }

      query += " ORDER BY cm.date DESC, cm.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener movimientos por cuenta de efectivo ${cashAccountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar movimientos de efectivo por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de movimientos que coinciden
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT cm.id, cm.reference_number, cm.date, cm.amount, cm.movement_type, cm.status,
                ca.code as cash_account_code, ca.name as cash_account_name,
                tp.name as third_party_name
         FROM cash_movements cm
         LEFT JOIN cash_accounts ca ON cm.cash_account_id = ca.id
         LEFT JOIN third_parties tp ON cm.third_party_id = tp.id
         WHERE cm.reference_number LIKE ? 
         OR cm.description LIKE ? 
         OR ca.code LIKE ? 
         OR ca.name LIKE ?
         OR tp.name LIKE ?
         ORDER BY cm.date DESC
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar movimientos de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de movimientos por cuenta y período
   * @param {number} cashAccountId - ID de la cuenta de efectivo
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @returns {Promise<Object>} Resumen de movimientos
   */
  static async getSummaryByPeriod(cashAccountId, dateFrom, dateTo) {
    try {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) as total_movements,
           SUM(CASE WHEN movement_type IN ('income', 'transfer_in') AND status = 'confirmed' THEN amount ELSE 0 END) as total_income,
           SUM(CASE WHEN movement_type IN ('expense', 'transfer_out') AND status = 'confirmed' THEN amount ELSE 0 END) as total_expense,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_movements,
           COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_movements,
           COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_movements
         FROM cash_movements
         WHERE cash_account_id = ? 
         AND date BETWEEN ? AND ?`,
        [cashAccountId, dateFrom, dateTo]
      );

      const summary = rows[0];
      summary.net_amount = parseFloat(summary.total_income || 0) - parseFloat(summary.total_expense || 0);

      return summary;
    } catch (error) {
      logger.error(`Error al obtener resumen de movimientos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transferir efectivo entre cuentas
   * @param {Object} transferData - Datos de la transferencia
   * @returns {Promise<Object>} Resultado de la transferencia
   */
  static async transfer(transferData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        from_cash_account_id,
        to_cash_account_id,
        amount,
        description,
        date,
        created_by
      } = transferData;

      // Validar que las cuentas existan y estén activas
      const [fromAccount] = await connection.query(
        `SELECT id, name, current_balance FROM cash_accounts WHERE id = ? AND is_active = 1`,
        [from_cash_account_id]
      );

      const [toAccount] = await connection.query(
        `SELECT id, name, max_amount FROM cash_accounts WHERE id = ? AND is_active = 1`,
        [to_cash_account_id]
      );

      if (!fromAccount.length) {
        throw new Error('La cuenta de efectivo origen no existe o no está activa');
      }

      if (!toAccount.length) {
        throw new Error('La cuenta de efectivo destino no existe o no está activa');
      }

      if (from_cash_account_id === to_cash_account_id) {
        throw new Error('Las cuentas origen y destino no pueden ser la misma');
      }

      // Validar saldo suficiente en cuenta origen
      if (parseFloat(fromAccount[0].current_balance) < parseFloat(amount)) {
        throw new Error(`Saldo insuficiente en cuenta origen ${fromAccount[0].name}`);
      }

      // Crear movimiento de salida (transfer_out)
      const outMovement = await this.create({
        cash_account_id: from_cash_account_id,
        movement_type: 'transfer_out',
        date: date,
        description: `Transferencia a ${toAccount[0].name}: ${description}`,
        amount: amount,
        created_by: created_by,
        auto_confirm: true
      });

      // Crear movimiento de entrada (transfer_in)
      const inMovement = await this.create({
        cash_account_id: to_cash_account_id,
        movement_type: 'transfer_in',
        date: date,
        description: `Transferencia desde ${fromAccount[0].name}: ${description}`,
        amount: amount,
        created_by: created_by,
        auto_confirm: true
      });

      await connection.commit();

      return {
        transfer_successful: true,
        out_movement_id: outMovement.id,
        in_movement_id: inMovement.id,
        amount: parseFloat(amount),
        from_account: fromAccount[0].name,
        to_account: toAccount[0].name,
        created_by: created_by
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error en transferencia de efectivo: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CashMovement; 