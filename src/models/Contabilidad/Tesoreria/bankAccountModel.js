/**
 * Modelo para gestionar las cuentas bancarias
 * @module models/Contabilidad/Tesoreria/bankAccountModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');

/**
 * Clase para gestionar las cuentas bancarias en el sistema de tesorería
 */
class BankAccount {
  /**
   * Obtener todas las cuentas bancarias con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de cuentas bancarias
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT ba.*, 
               c.name as currency_name, c.symbol as currency_symbol,
               coa.name as gl_account_name, coa.code as gl_account_code,
               u.username as created_by_name,
               COUNT(bt.id) as transaction_count
        FROM bank_accounts ba
        LEFT JOIN currencies c ON ba.currency_id = c.id
        LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
        LEFT JOIN users u ON ba.created_by = u.id
        LEFT JOIN bank_transactions bt ON ba.id = bt.bank_account_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.account_number) {
        conditions.push("ba.account_number LIKE ?");
        queryParams.push(`%${filters.account_number}%`);
      }

      if (filters.bank_name) {
        conditions.push("ba.bank_name LIKE ?");
        queryParams.push(`%${filters.bank_name}%`);
      }

      if (filters.account_type) {
        conditions.push("ba.account_type = ?");
        queryParams.push(filters.account_type);
      }

      if (filters.currency_id) {
        conditions.push("ba.currency_id = ?");
        queryParams.push(filters.currency_id);
      }

      if (filters.is_active !== undefined) {
        conditions.push("ba.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY ba.id ORDER BY ba.bank_name, ba.account_number";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas bancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta bancaria por ID
   * @param {number} id - ID de la cuenta bancaria
   * @returns {Promise<Object>} Cuenta bancaria
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ba.*, 
                c.name as currency_name, c.symbol as currency_symbol,
                coa.name as gl_account_name, coa.code as gl_account_code,coa.code,
                u.username as created_by_name,
                COUNT(bt.id) as transaction_count,
                SUM(CASE WHEN bt.transaction_type IN ('deposit', 'receipt') THEN bt.amount ELSE 0 END) as total_deposits,
                SUM(CASE WHEN bt.transaction_type IN ('withdrawal', 'payment', 'transfer') THEN bt.amount ELSE 0 END) as total_withdrawals
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
         LEFT JOIN users u ON ba.created_by = u.id
         LEFT JOIN bank_transactions bt ON ba.id = bt.bank_account_id AND bt.status != 'voided'
         WHERE ba.id = ?
         GROUP BY ba.id`,
        [id]

      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta bancaria con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cuenta bancaria por número de cuenta
   * @param {string} accountNumber - Número de cuenta bancaria
   * @returns {Promise<Object>} Cuenta bancaria
   */
  static async getByAccountNumber(accountNumber) {
    try {
      const [rows] = await pool.query(
        `SELECT ba.*, 
                c.name as currency_name, c.symbol as currency_symbol,
                coa.name as gl_account_name, coa.code as gl_account_code
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
         WHERE ba.account_number = ?`,
        [accountNumber]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta bancaria por número ${accountNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva cuenta bancaria
   * @param {Object} accountData - Datos de la cuenta bancaria
   * @returns {Promise<Object>} Cuenta bancaria creada
   */
  static async create(accountData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que no exista el número de cuenta
      const [existing] = await connection.query(
        `SELECT id FROM bank_accounts WHERE account_number = ?`,
        [accountData.account_number]
      );

      if (existing.length > 0) {
        throw new Error(`Ya existe una cuenta bancaria con el número ${accountData.account_number}`);
      }

      // Validar que la cuenta contable exista y sea válida
      const [glAccount] = await connection.query(
        `SELECT id, allows_entries FROM chart_of_accounts WHERE id = ? AND is_active = 1`,
        [accountData.gl_account_id]
      );

      if (!glAccount.length) {
        throw new Error('La cuenta contable especificada no existe o no está activa');
      }

      if (!glAccount[0].allows_entries) {
        throw new Error('La cuenta contable especificada no permite movimientos');
      }

      // Validar que la moneda exista
      const [currency] = await connection.query(
        `SELECT id FROM currencies WHERE id = ?`,
        [accountData.currency_id]
      );

      if (!currency.length) {
        throw new Error('La moneda especificada no existe');
      }

      // Insertar la cuenta bancaria
      const [result] = await connection.query(
        `INSERT INTO bank_accounts 
        (account_number, name, bank_name, account_type, currency_id, gl_account_id, 
         initial_balance, current_balance, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountData.account_number,
          accountData.name,
          accountData.bank_name,
          accountData.account_type,
          accountData.currency_id,
          accountData.gl_account_id,
          accountData.initial_balance || 0,
          accountData.initial_balance || 0,
          accountData.is_active !== undefined ? accountData.is_active : true,
          accountData.created_by
        ]
      );

      const accountId = result.insertId;

      // Si hay saldo inicial, crear el movimiento inicial
      if (accountData.initial_balance && accountData.initial_balance > 0) {
        await connection.query(
          `INSERT INTO bank_transactions 
          (bank_account_id, transaction_type, reference_number, date, description, 
           amount, running_balance, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            accountId,
            'deposit',
            'SALDO-INICIAL',
            new Date().toISOString().split('T')[0],
            'Saldo inicial de la cuenta bancaria',
            accountData.initial_balance,
            accountData.initial_balance,
            'cleared',
            accountData.created_by
          ]
        );
      }

      await connection.commit();
      
      return { id: accountId, ...accountData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear cuenta bancaria: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una cuenta bancaria existente
   * @param {number} id - ID de la cuenta bancaria
   * @param {Object} accountData - Datos actualizados de la cuenta
   * @returns {Promise<Object>} Cuenta bancaria actualizada
   */
  static async update(id, accountData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la cuenta exista
      const [accountCheck] = await connection.query(
        `SELECT id, account_number FROM bank_accounts WHERE id = ?`,
        [id]
      );

      if (!accountCheck.length) {
        throw new Error(`La cuenta bancaria con ID ${id} no existe`);
      }

      // Validar que no exista otro número de cuenta igual (si se está cambiando)
      if (accountData.account_number && accountData.account_number !== accountCheck[0].account_number) {
        const [existing] = await connection.query(
          `SELECT id FROM bank_accounts WHERE account_number = ? AND id != ?`,
          [accountData.account_number, id]
        );

        if (existing.length > 0) {
          throw new Error(`Ya existe otra cuenta bancaria con el número ${accountData.account_number}`);
        }
      }

      // Validar cuenta contable si se está cambiando
      if (accountData.gl_account_id) {
        const [glAccount] = await connection.query(
          `SELECT id, allows_entries FROM chart_of_accounts WHERE id = ? AND is_active = 1`,
          [accountData.gl_account_id]
        );

        if (!glAccount.length) {
          throw new Error('La cuenta contable especificada no existe o no está activa');
        }

        if (!glAccount[0].allows_entries) {
          throw new Error('La cuenta contable especificada no permite movimientos');
        }
      }

      // Validar moneda si se está cambiando
      if (accountData.currency_id) {
        const [currency] = await connection.query(
          `SELECT id FROM currencies WHERE id = ?`,
          [accountData.currency_id]
        );

        if (!currency.length) {
          throw new Error('La moneda especificada no existe');
        }
      }

      // Actualizar la cuenta bancaria
      await connection.query(
        `UPDATE bank_accounts SET
         account_number = COALESCE(?, account_number),
         name = COALESCE(?, name),
         bank_name = COALESCE(?, bank_name),
         account_type = COALESCE(?, account_type),
         currency_id = COALESCE(?, currency_id),
         gl_account_id = COALESCE(?, gl_account_id),
         is_active = COALESCE(?, is_active),
         updated_at = NOW()
         WHERE id = ?`,
        [
          accountData.account_number,
          accountData.name,
          accountData.bank_name,
          accountData.account_type,
          accountData.currency_id,
          accountData.gl_account_id,
          accountData.is_active,
          id
        ]
      );

      await connection.commit();
      
      return { id, ...accountData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar cuenta bancaria ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Desactivar una cuenta bancaria (soft delete)
   * @param {number} id - ID de la cuenta bancaria
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async deactivate(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la cuenta exista
      const [accountCheck] = await connection.query(
        `SELECT id, is_active FROM bank_accounts WHERE id = ?`,
        [id]
      );

      if (!accountCheck.length) {
        throw new Error(`La cuenta bancaria con ID ${id} no existe`);
      }

      if (!accountCheck[0].is_active) {
        throw new Error('La cuenta bancaria ya está desactivada');
      }

      // Verificar que no tenga transacciones pendientes
      const [pendingTransactions] = await connection.query(
        `SELECT COUNT(*) as count FROM bank_transactions 
         WHERE bank_account_id = ? AND status = 'pending'`,
        [id]
      );

      if (pendingTransactions[0].count > 0) {
        throw new Error('No se puede desactivar una cuenta con transacciones pendientes');
      }

      // Desactivar la cuenta
      await connection.query(
        `UPDATE bank_accounts SET is_active = 0, updated_at = NOW() WHERE id = ?`,
        [id]
      );

      await connection.commit();
      
      return { id, deactivated: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al desactivar cuenta bancaria ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener el saldo actual de una cuenta bancaria
   * @param {number} id - ID de la cuenta bancaria
   * @returns {Promise<Object>} Información del saldo
   */
  static async getBalance(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ba.current_balance, ba.currency_id, c.name as currency_name, c.symbol as currency_symbol,
                ba.account_number, ba.name as account_name, ba.bank_name,
                (SELECT MAX(bt.created_at) FROM bank_transactions bt WHERE bt.bank_account_id = ba.id) as last_transaction_date
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         WHERE ba.id = ?`,
        [id]
      );

      if (!rows.length) {
        throw new Error(`La cuenta bancaria con ID ${id} no existe`);
      }

      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta bancaria ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar el saldo de una cuenta bancaria
   * @param {number} id - ID de la cuenta bancaria
   * @param {number} newBalance - Nuevo saldo
   * @param {Object} connection - Conexión de base de datos activa
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async updateBalance(id, newBalance, connection = null) {
    const conn = connection || await pool.getConnection();
    const shouldReleaseConnection = !connection;
    
    try {
      if (!connection) {
        await conn.beginTransaction();
      }

      await conn.query(
        `UPDATE bank_accounts SET current_balance = ?, updated_at = NOW() WHERE id = ?`,
        [newBalance, id]
      );

      if (!connection) {
        await conn.commit();
      }

      return { id, new_balance: newBalance };
    } catch (error) {
      if (!connection) {
        await conn.rollback();
      }
      logger.error(`Error al actualizar saldo de cuenta bancaria ${id}: ${error.message}`);
      throw error;
    } finally {
      if (shouldReleaseConnection) {
        conn.release();
      }
    }
  }

  /**
   * Obtener resumen de cuentas bancarias
   * @returns {Promise<Object>} Resumen con totales por moneda
   */
  static async getSummary() {
    try {
      const [rows] = await pool.query(
        `SELECT c.name as currency_name, c.symbol as currency_symbol,
                COUNT(ba.id) as account_count,
                SUM(ba.current_balance) as total_balance,
                SUM(CASE WHEN ba.is_active = 1 THEN ba.current_balance ELSE 0 END) as active_balance
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         GROUP BY ba.currency_id, c.name, c.symbol
         ORDER BY c.name`
      );

      return rows;
    } catch (error) {
      logger.error(`Error al obtener resumen de cuentas bancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar cuentas bancarias por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de cuentas que coinciden con la búsqueda
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT ba.id, ba.account_number, ba.name, ba.bank_name, ba.current_balance,
                c.symbol as currency_symbol
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         WHERE ba.is_active = 1 
         AND (ba.account_number LIKE ? OR ba.name LIKE ? OR ba.bank_name LIKE ?)
         ORDER BY ba.bank_name, ba.account_number
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar cuentas bancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cuenta bancaria asociada a una cuenta contable
   * @param {number} glAccountId - ID de la cuenta contable
   * @returns {Promise<Object|null>} Cuenta bancaria asociada o null si no existe
   */
  static async getByGLAccount(glAccountId) {
    try {
      const [rows] = await pool.query(
        `SELECT ba.*, 
                c.name as currency_name, c.symbol as currency_symbol,
                coa.name as gl_account_name, coa.code as gl_account_code
         FROM bank_accounts ba
         LEFT JOIN currencies c ON ba.currency_id = c.id
         LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
         WHERE ba.gl_account_id = ? AND ba.is_active = 1`,
        [glAccountId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error(`Error al obtener cuenta bancaria por cuenta contable ${glAccountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si una cuenta contable está asociada a una cuenta bancaria
   * @param {number} glAccountId - ID de la cuenta contable
   * @returns {Promise<boolean>} True si está asociada, false si no
   */
  static async isGLAccountLinkedToBankAccount(glAccountId) {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM bank_accounts 
         WHERE gl_account_id = ? AND is_active = 1`,
        [glAccountId]
      );
      return rows[0].count > 0;
    } catch (error) {
      logger.error(`Error al verificar asociación de cuenta contable ${glAccountId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BankAccount; 