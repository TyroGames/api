/**
 * Modelo para gestionar las cuentas de efectivo y cajas
 * @module models/Contabilidad/Tesoreria/cashAccountModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');

/**
 * Clase para gestionar las cuentas de efectivo en el sistema de tesorería
 */
class CashAccount {
  /**
   * Obtener todas las cuentas de efectivo con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de cuentas de efectivo
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT ca.*, 
               c.name as currency_name, c.symbol as currency_symbol,
               coa.name as gl_account_name, coa.code as gl_account_code,
               u.username as responsible_user_name,
               u2.username as created_by_name
        FROM cash_accounts ca
        LEFT JOIN currencies c ON ca.currency_id = c.id
        LEFT JOIN chart_of_accounts coa ON ca.gl_account_id = coa.id
        LEFT JOIN users u ON ca.responsible_user_id = u.id
        LEFT JOIN users u2 ON ca.created_by = u2.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.is_active !== undefined) {
        conditions.push("ca.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.is_petty_cash !== undefined) {
        conditions.push("ca.is_petty_cash = ?");
        queryParams.push(filters.is_petty_cash);
      }

      if (filters.location) {
        conditions.push("ca.location LIKE ?");
        queryParams.push(`%${filters.location}%`);
      }

      if (filters.responsible_user_id) {
        conditions.push("ca.responsible_user_id = ?");
        queryParams.push(filters.responsible_user_id);
      }

      if (filters.currency_id) {
        conditions.push("ca.currency_id = ?");
        queryParams.push(filters.currency_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY ca.is_petty_cash, ca.name";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta de efectivo por ID
   * @param {number} id - ID de la cuenta de efectivo
   * @returns {Promise<Object>} Cuenta de efectivo con detalles
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ca.*, 
                c.name as currency_name, c.symbol as currency_symbol,
                coa.name as gl_account_name, coa.code as gl_account_code,
                u.username as responsible_user_name, u.full_name as responsible_user_full_name,
                u2.username as created_by_name
         FROM cash_accounts ca
         LEFT JOIN currencies c ON ca.currency_id = c.id
         LEFT JOIN chart_of_accounts coa ON ca.gl_account_id = coa.id
         LEFT JOIN users u ON ca.responsible_user_id = u.id
         LEFT JOIN users u2 ON ca.created_by = u2.id
         WHERE ca.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta de efectivo con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cuenta de efectivo por código
   * @param {string} code - Código de la cuenta de efectivo
   * @returns {Promise<Object>} Cuenta de efectivo
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT ca.*, c.name as currency_name, c.symbol as currency_symbol
         FROM cash_accounts ca
         LEFT JOIN currencies c ON ca.currency_id = c.id
         WHERE ca.code = ? AND ca.is_active = 1`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta de efectivo con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva cuenta de efectivo
   * @param {Object} accountData - Datos de la cuenta de efectivo
   * @returns {Promise<Object>} Cuenta de efectivo creada
   */
  static async create(accountData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que el código no exista
      const [existingCode] = await connection.query(
        `SELECT id FROM cash_accounts WHERE code = ?`,
        [accountData.code]
      );

      if (existingCode.length > 0) {
        throw new Error(`Ya existe una cuenta de efectivo con el código ${accountData.code}`);
      }

      // Validar que la moneda exista
      const [currency] = await connection.query(
        `SELECT id FROM currencies WHERE id = ?`,
        [accountData.currency_id]
      );

      if (!currency.length) {
        throw new Error('La moneda especificada no existe');
      }

      // Validar que la cuenta contable exista
      const [glAccount] = await connection.query(
        `SELECT id FROM chart_of_accounts WHERE id = ? AND allows_entries = 1`,
        [accountData.gl_account_id]
      );

      if (!glAccount.length) {
        throw new Error('La cuenta contable especificada no existe o no permite movimientos');
      }

      // Validar usuario responsable si se especifica
      if (accountData.responsible_user_id) {
        const [user] = await connection.query(
          `SELECT id FROM users WHERE id = ? AND is_active = 1`,
          [accountData.responsible_user_id]
        );

        if (!user.length) {
          throw new Error('El usuario responsable especificado no existe o no está activo');
        }
      }

      // Insertar la cuenta de efectivo
      const [result] = await connection.query(
        `INSERT INTO cash_accounts 
        (code, name, description, currency_id, gl_account_id, location, 
         responsible_user_id, max_amount, current_balance, is_petty_cash, 
         is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountData.code,
          accountData.name,
          accountData.description || null,
          accountData.currency_id,
          accountData.gl_account_id,
          accountData.location || null,
          accountData.responsible_user_id || null,
          accountData.max_amount || 0,
          accountData.current_balance || 0,
          accountData.is_petty_cash || false,
          accountData.is_active !== undefined ? accountData.is_active : true,
          accountData.created_by
        ]
      );

      await connection.commit();
      
      return { id: result.insertId, ...accountData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear cuenta de efectivo: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una cuenta de efectivo
   * @param {number} id - ID de la cuenta de efectivo
   * @param {Object} accountData - Datos a actualizar
   * @returns {Promise<Object>} Cuenta de efectivo actualizada
   */
  static async update(id, accountData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la cuenta existe
      const [existing] = await connection.query(
        `SELECT id, code FROM cash_accounts WHERE id = ?`,
        [id]
      );

      if (!existing.length) {
        throw new Error(`La cuenta de efectivo con ID ${id} no existe`);
      }

      // Validar código único si se está cambiando
      if (accountData.code && accountData.code !== existing[0].code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM cash_accounts WHERE code = ? AND id != ?`,
          [accountData.code, id]
        );

        if (existingCode.length > 0) {
          throw new Error(`Ya existe otra cuenta de efectivo con el código ${accountData.code}`);
        }
      }

      // Construir consulta de actualización dinámicamente
      const updateFields = [];
      const updateValues = [];

      const allowedFields = [
        'code', 'name', 'description', 'currency_id', 'gl_account_id',
        'location', 'responsible_user_id', 'max_amount', 'is_petty_cash', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (accountData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(accountData[field]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
      }

      // Agregar campos de auditoría
      updateFields.push('updated_at = NOW()');
      updateFields.push('updated_by = ?');
      updateValues.push(accountData.updated_by);
      updateValues.push(id);

      const updateQuery = `
        UPDATE cash_accounts 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await connection.query(updateQuery, updateValues);
      await connection.commit();

      // Obtener cuenta actualizada
      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar cuenta de efectivo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Desactivar una cuenta de efectivo
   * @param {number} id - ID de la cuenta de efectivo
   * @param {number} userId - ID del usuario que desactiva
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async deactivate(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la cuenta existe y está activa
      const [account] = await connection.query(
        `SELECT id, current_balance, is_active FROM cash_accounts WHERE id = ?`,
        [id]
      );

      if (!account.length) {
        throw new Error(`La cuenta de efectivo con ID ${id} no existe`);
      }

      if (!account[0].is_active) {
        throw new Error('La cuenta de efectivo ya está desactivada');
      }

      // Verificar que no tenga saldo pendiente
      if (parseFloat(account[0].current_balance) !== 0) {
        throw new Error('No se puede desactivar una cuenta con saldo pendiente. Saldo actual: ' + account[0].current_balance);
      }

      // Verificar que no tenga movimientos pendientes
      const [pendingMovements] = await connection.query(
        `SELECT COUNT(*) as count FROM cash_movements 
         WHERE cash_account_id = ? AND status = 'pending'`,
        [id]
      );

      if (pendingMovements[0].count > 0) {
        throw new Error('No se puede desactivar una cuenta con movimientos pendientes');
      }

      // Desactivar la cuenta
      await connection.query(
        `UPDATE cash_accounts 
         SET is_active = 0, updated_at = NOW(), updated_by = ?
         WHERE id = ?`,
        [userId, id]
      );

      await connection.commit();

      return {
        id: id,
        message: 'Cuenta de efectivo desactivada exitosamente',
        deactivated_by: userId,
        deactivated_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al desactivar cuenta de efectivo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar saldo de una cuenta de efectivo
   * @param {number} accountId - ID de la cuenta
   * @param {number} amount - Monto del movimiento (positivo o negativo)
   * @param {Object} connection - Conexión de base de datos activa
   * @returns {Promise<number>} Nuevo saldo
   */
  static async updateBalance(accountId, amount, connection = null) {
    const conn = connection || await pool.getConnection();
    
    try {
      if (!connection) await conn.beginTransaction();

      // Obtener saldo actual y límite máximo
      const [account] = await conn.query(
        `SELECT current_balance, max_amount, name FROM cash_accounts WHERE id = ? FOR UPDATE`,
        [accountId]
      );

      if (!account.length) {
        throw new Error(`La cuenta de efectivo con ID ${accountId} no existe`);
      }

      const currentBalance = parseFloat(account[0].current_balance);
      const maxAmount = parseFloat(account[0].max_amount);
      const newBalance = currentBalance + parseFloat(amount);

      // Validar que el saldo no sea negativo
      if (newBalance < 0) {
        throw new Error(`Saldo insuficiente en la cuenta ${account[0].name}. Saldo actual: ${currentBalance}, Intento de movimiento: ${amount}`);
      }

      // Validar límite máximo si aplica
      if (maxAmount > 0 && newBalance > maxAmount) {
        throw new Error(`El nuevo saldo (${newBalance}) excede el límite máximo permitido (${maxAmount}) para la cuenta ${account[0].name}`);
      }

      // Actualizar el saldo
      await conn.query(
        `UPDATE cash_accounts SET current_balance = ? WHERE id = ?`,
        [newBalance, accountId]
      );

      if (!connection) await conn.commit();

      return newBalance;
    } catch (error) {
      if (!connection) await conn.rollback();
      logger.error(`Error al actualizar saldo de cuenta de efectivo ${accountId}: ${error.message}`);
      throw error;
    } finally {
      if (!connection) conn.release();
    }
  }

  /**
   * Obtener saldo actual de una cuenta de efectivo
   * @param {number} id - ID de la cuenta de efectivo
   * @returns {Promise<Object>} Información del saldo
   */
  static async getBalance(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ca.id, ca.code, ca.name, ca.current_balance, ca.max_amount,
                c.symbol as currency_symbol,
                (ca.max_amount - ca.current_balance) as available_amount
         FROM cash_accounts ca
         LEFT JOIN currencies c ON ca.currency_id = c.id
         WHERE ca.id = ? AND ca.is_active = 1`,
        [id]
      );

      if (!rows.length) {
        throw new Error(`La cuenta de efectivo con ID ${id} no existe o no está activa`);
      }

      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta de efectivo ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar cuentas de efectivo por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de cuentas que coinciden
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT ca.id, ca.code, ca.name, ca.location, ca.current_balance, ca.is_petty_cash,
                c.symbol as currency_symbol,
                u.username as responsible_user_name
         FROM cash_accounts ca
         LEFT JOIN currencies c ON ca.currency_id = c.id
         LEFT JOIN users u ON ca.responsible_user_id = u.id
         WHERE ca.is_active = 1 
         AND (ca.code LIKE ? OR ca.name LIKE ? OR ca.location LIKE ?)
         ORDER BY ca.is_petty_cash, ca.name
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar cuentas de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de cuentas de efectivo por moneda
   * @returns {Promise<Array>} Resumen agrupado por moneda
   */
  static async getSummaryByCurrency() {
    try {
      const [rows] = await pool.query(
        `SELECT c.id as currency_id, c.name as currency_name, c.symbol as currency_symbol,
                COUNT(ca.id) as total_accounts,
                SUM(CASE WHEN ca.is_petty_cash = 1 THEN 1 ELSE 0 END) as petty_cash_accounts,
                SUM(CASE WHEN ca.is_petty_cash = 0 THEN 1 ELSE 0 END) as general_cash_accounts,
                SUM(ca.current_balance) as total_balance,
                SUM(ca.max_amount) as total_max_amount,
                AVG(ca.current_balance) as avg_balance
         FROM cash_accounts ca
         JOIN currencies c ON ca.currency_id = c.id
         WHERE ca.is_active = 1
         GROUP BY c.id, c.name, c.symbol
         ORDER BY total_balance DESC`
      );

      return rows;
    } catch (error) {
      logger.error(`Error al obtener resumen de cuentas de efectivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cuentas de efectivo por responsable
   * @param {number} userId - ID del usuario responsable
   * @returns {Promise<Array>} Lista de cuentas asignadas
   */
  static async getByResponsible(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT ca.*, c.name as currency_name, c.symbol as currency_symbol
         FROM cash_accounts ca
         LEFT JOIN currencies c ON ca.currency_id = c.id
         WHERE ca.responsible_user_id = ? AND ca.is_active = 1
         ORDER BY ca.is_petty_cash, ca.name`,
        [userId]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas de efectivo por responsable ${userId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CashAccount;