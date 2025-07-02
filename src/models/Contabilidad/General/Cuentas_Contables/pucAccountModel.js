const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Modelo para las cuentas del Plan Único de Cuentas (PUC)
 */
class PucAccount {
  /**
   * Obtener todas las cuentas PUC
   * @returns {Promise<Array>} Lista de cuentas PUC
   */
  static async findAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM puc_accounts ORDER BY code');
      return rows;
    } catch (error) {
      logger.error(`Error al obtener cuentas PUC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta PUC por su ID
   * @param {number} id - ID de la cuenta PUC
   * @returns {Promise<Object>} Datos de la cuenta PUC
   */
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM puc_accounts WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta PUC por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una cuenta PUC por su código
   * @param {string} code - Código de la cuenta PUC
   * @returns {Promise<Object>} Datos de la cuenta PUC
   */
  static async findByCode(code) {
    try {
      const [rows] = await pool.query('SELECT * FROM puc_accounts WHERE code = ?', [code]);
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener cuenta PUC por código: ${error.message}`);
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
   * Crear una nueva cuenta PUC
   * @param {Object} accountData - Datos de la cuenta PUC
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(accountData) {
    try {
      const { 
        code, 
        name, 
        description, 
        account_type_id, 
        parent_account_id, 
        is_active, 
        allows_entries, 
        level, 
        balance_type, 
        created_by 
      } = accountData;
      
      const [result] = await pool.query(
        `INSERT INTO puc_accounts (
          code, name, description, account_type_id, parent_account_id, 
          is_active, allows_entries, level, balance_type, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, name, description, account_type_id, parent_account_id,
          is_active, allows_entries, level, balance_type, created_by
        ]
      );
      
      return { id: result.insertId, ...accountData };
    } catch (error) {
      logger.error(`Error al crear cuenta PUC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar una cuenta PUC existente
   * @param {number} id - ID de la cuenta PUC
   * @param {Object} accountData - Datos actualizados
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async update(id, accountData) {
    try {
      const { 
        code, 
        name, 
        description, 
        account_type_id, 
        parent_account_id, 
        is_active, 
        allows_entries, 
        level, 
        balance_type, 
        updated_by 
      } = accountData;
      
      const [result] = await pool.query(
        `UPDATE puc_accounts SET 
          code = ?, 
          name = ?, 
          description = ?, 
          account_type_id = ?, 
          parent_account_id = ?, 
          is_active = ?, 
          allows_entries = ?, 
          level = ?, 
          balance_type = ?, 
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          code, name, description, account_type_id, parent_account_id,
          is_active, allows_entries, level, balance_type, updated_by,
          id
        ]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al actualizar cuenta PUC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar una cuenta PUC
   * @param {number} id - ID de la cuenta PUC
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async delete(id) {
    try {
      // Verificar si la cuenta tiene hijos
      const [childAccounts] = await pool.query(
        'SELECT COUNT(*) as count FROM puc_accounts WHERE parent_account_id = ?',
        [id]
      );
      
      if (childAccounts[0].count > 0) {
        throw new Error('No se puede eliminar esta cuenta porque tiene cuentas hijas asociadas');
      }
      
      // Verificar si la cuenta está siendo utilizada en otro lugar
      // Aquí podrías añadir más comprobaciones según sea necesario
      
      const [result] = await pool.query('DELETE FROM puc_accounts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al eliminar cuenta PUC: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PucAccount; 