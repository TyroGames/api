const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Modelo para los tipos de cuenta contable
 */
class AccountType {
  /**
   * Obtener todos los tipos de cuenta
   * @returns {Promise<Array>} Lista de tipos de cuenta
   */
  static async findAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM account_types ORDER BY code');
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de cuenta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de cuenta por su ID
   * @param {number} id - ID del tipo de cuenta
   * @returns {Promise<Object>} Datos del tipo de cuenta
   */
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM account_types WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de cuenta por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tipo de cuenta
   * @param {Object} accountTypeData - Datos del tipo de cuenta
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(accountTypeData) {
    try {
      const { name, code, balance_sheet_section, income_statement_section } = accountTypeData;
      
      const [result] = await pool.query(
        'INSERT INTO account_types (name, code, balance_sheet_section, income_statement_section) VALUES (?, ?, ?, ?)',
        [name, code, balance_sheet_section, income_statement_section]
      );
      
      return { id: result.insertId, ...accountTypeData };
    } catch (error) {
      logger.error(`Error al crear tipo de cuenta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un tipo de cuenta existente
   * @param {number} id - ID del tipo de cuenta
   * @param {Object} accountTypeData - Datos actualizados
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async update(id, accountTypeData) {
    try {
      const { name, code, balance_sheet_section, income_statement_section } = accountTypeData;
      
      const [result] = await pool.query(
        'UPDATE account_types SET name = ?, code = ?, balance_sheet_section = ?, income_statement_section = ? WHERE id = ?',
        [name, code, balance_sheet_section, income_statement_section, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al actualizar tipo de cuenta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un tipo de cuenta
   * @param {number} id - ID del tipo de cuenta
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async delete(id) {
    try {
      // Verificar si el tipo de cuenta está en uso
      const [accountsUsingType] = await pool.query(
        'SELECT COUNT(*) as count FROM chart_of_accounts WHERE account_type_id = ?',
        [id]
      );
      
      if (accountsUsingType[0].count > 0) {
        throw new Error('No se puede eliminar este tipo de cuenta porque está siendo utilizado por una o más cuentas contables');
      }
      
      const [result] = await pool.query('DELETE FROM account_types WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al eliminar tipo de cuenta: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AccountType; 