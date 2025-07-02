const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Modelo para el plan de cuentas contables
 */
class ChartOfAccounts {
  /**
   * Obtener todas las cuentas contables
   * @param {boolean} includeInactive - Incluir cuentas inactivas
   * @returns {Promise<Array>} Lista de cuentas contables
   */
  static async findAll(includeInactive = false) {
    try {
      let query = `
        SELECT c.*, at.name as account_type_name
        FROM chart_of_accounts c
        JOIN account_types at ON c.account_type_id = at.id
      `;
      
      if (!includeInactive) {
        query += ' WHERE c.is_active = 1';
      }
      
      query += ' ORDER BY c.code';
      
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas contables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta contable por su ID
   * @param {number} id - ID de la cuenta contable
   * @returns {Promise<Object>} Datos de la cuenta contable
   */
  static async findById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, at.name as account_type_name
        FROM chart_of_accounts c
        JOIN account_types at ON c.account_type_id = at.id
        WHERE c.id = ?
      `, [id]);
      
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta contable por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener las cuentas hijas de una cuenta padre
   * @param {number} parentId - ID de la cuenta padre
   * @returns {Promise<Array>} Lista de cuentas hijas
   */
  static async findChildrenByParentId(parentId) {
    try {
      const [rows] = await pool.query('SELECT * FROM puc_accounts WHERE parent_account_id = ? ORDER BY code', [parentId]);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas hijas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta contable por su código
   * @param {string} code - Código de la cuenta contable
   * @returns {Promise<Object>} Datos de la cuenta contable
   */
  static async findByCode(code) {
    try {
      const [rows] = await pool.query(`
        SELECT c.*, at.name as account_type_name
        FROM chart_of_accounts c
        JOIN account_types at ON c.account_type_id = at.id
        WHERE c.code = ?
      `, [code]);
      
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta contable por código: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cuentas contables jerárquicamente
   * @returns {Promise<Array>} Lista jerárquica de cuentas
   */
  static async findHierarchical() {
    try {
      // Primero obtenemos todas las cuentas
      const [accounts] = await pool.query(`
        SELECT c.*, at.name as account_type_name
        FROM chart_of_accounts c
        JOIN account_types at ON c.account_type_id = at.id
        WHERE c.is_active = 1
        ORDER BY c.code
      `);
      
      // Función para construir la jerarquía
      const buildHierarchy = (items, parentId = null) => {
        const result = [];
        items
          .filter(item => item.parent_account_id === parentId)
          .forEach(item => {
            // Buscar hijos para esta cuenta
            const children = buildHierarchy(items, item.id);
            if (children.length) {
              item.children = children;
            }
            result.push(item);
          });
        return result;
      };
      
      return buildHierarchy(accounts);
    } catch (error) {
      logger.error(`Error al obtener jerarquía de cuentas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva cuenta contable
   * @param {Object} accountData - Datos de la cuenta contable
   * @param {number} userId - ID del usuario que crea la cuenta
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(accountData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        code,
        name,
        description,
        account_type_id,
        parent_account_id,
        is_active,
        allows_entries,
        level,
        balance_type
      } = accountData;
      
      // Verificar si ya existe una cuenta con el mismo código
      const [existingAccounts] = await connection.query(
        'SELECT id FROM chart_of_accounts WHERE code = ?',
        [code]
      );
      
      if (existingAccounts.length > 0) {
        throw new Error(`Ya existe una cuenta con el código ${code}`);
      }
      
      // Insertar la nueva cuenta
      const [result] = await connection.query(
        `INSERT INTO chart_of_accounts (
          code, name, description, account_type_id, parent_account_id,
          is_active, allows_entries, level, balance_type, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, name, description, account_type_id, parent_account_id,
          is_active, allows_entries, level, balance_type, userId
        ]
      );
      
      await connection.commit();
      
      return { id: result.insertId, ...accountData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear cuenta contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una cuenta contable existente
   * @param {number} id - ID de la cuenta contable
   * @param {Object} accountData - Datos actualizados
   * @param {number} userId - ID del usuario que actualiza la cuenta
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async update(id, accountData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        code,
        name,
        description,
        account_type_id,
        parent_account_id,
        is_active,
        allows_entries,
        level,
        balance_type
      } = accountData;
      
      // Verificar si ya existe otra cuenta con el mismo código
     // const [existingAccounts] = await connection.query(
      //  'SELECT id FROM chart_of_accounts WHERE code = ? AND id != ?',
      //  [code, id]
      //);
      
      //if (existingAccounts.length > 0) {
      //  throw new Error(`Ya existe otra cuenta con el código ${code}`);
      //}
      console.log(code, name, description, account_type_id, parent_account_id, is_active, allows_entries, level, balance_type, userId, id);
      // Actualizar la cuenta
      const [result] = await connection.query(
        `UPDATE chart_of_accounts SET
          code = ?, name = ?, description = ?, account_type_id = ?,
          parent_account_id = ?, is_active = ?, allows_entries = ?,
          level = ?, balance_type = ?, updated_by = ?, updated_at = NOW()
        WHERE code = ?`,
        [
          code, name, description, account_type_id,
          parent_account_id, is_active, allows_entries,
          level, balance_type, userId, id
        ]
      );
      console.log(result);
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar cuenta contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una cuenta contable
   * @param {number} id - ID de la cuenta contable
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si la cuenta tiene subcuentas
      const [hasChildren] = await connection.query(
        'SELECT COUNT(*) as count FROM chart_of_accounts WHERE parent_account_id = ?',
        [id]
      );
      
      if (hasChildren[0].count > 0) {
        throw new Error('No se puede eliminar esta cuenta porque tiene subcuentas asociadas');
      }
      
      // Verificar si la cuenta tiene movimientos
      const [hasEntries] = await connection.query(
        'SELECT COUNT(*) as count FROM journal_entry_lines WHERE account_id = ?',
        [id]
      );
      
      if (hasEntries[0].count > 0) {
        throw new Error('No se puede eliminar esta cuenta porque tiene movimientos contables asociados');
      }
      
      // Eliminar la cuenta
      const [result] = await connection.query(
        'DELETE FROM chart_of_accounts WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar cuenta contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener el saldo actual de una cuenta contable
   * @param {number} accountId - ID de la cuenta contable
   * @param {number} fiscalPeriodId - ID del período fiscal
   * @returns {Promise<Object>} Saldo de la cuenta
   */
  static async getBalance(accountId, fiscalPeriodId) {
    try {
      const [balances] = await pool.query(
        'SELECT * FROM account_balances WHERE account_id = ? AND fiscal_period_id = ?',
        [accountId, fiscalPeriodId]
      );
      
      if (balances.length === 0) {
        return {
          debit_balance: 0,
          credit_balance: 0,
          starting_balance: 0,
          ending_balance: 0
        };
      }
      
      return balances[0];
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ChartOfAccounts; 