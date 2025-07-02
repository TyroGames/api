/**
 * Modelo para gestionar los tipos de créditos hipotecarios
 * @module models/Creditos/CreditTypesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los tipos de créditos hipotecarios en el sistema
 */
class CreditTypes {
  /**
   * Obtener todos los tipos de créditos con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de tipos de créditos
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT ct.*, 
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT m.id) as mortgages_count
        FROM Cr_credit_types ct
        LEFT JOIN users u1 ON ct.created_by = u1.id
        LEFT JOIN users u2 ON ct.updated_by = u2.id
        LEFT JOIN Cr_mortgages m ON ct.id = m.credit_type_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.code) {
        conditions.push("ct.code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.name) {
        conditions.push("ct.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.payment_frequency) {
        conditions.push("ct.payment_frequency = ?");
        queryParams.push(filters.payment_frequency);
      }

      if (filters.interest_calculation_method) {
        conditions.push("ct.interest_calculation_method = ?");
        queryParams.push(filters.interest_calculation_method);
      }

      if (filters.is_active !== undefined) {
        conditions.push("ct.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY ct.id ORDER BY ct.name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de créditos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de crédito por ID
   * @param {number} id - ID del tipo de crédito
   * @returns {Promise<Object>} Tipo de crédito
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ct.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT m.id) as mortgages_count
         FROM Cr_credit_types ct
         LEFT JOIN users u1 ON ct.created_by = u1.id
         LEFT JOIN users u2 ON ct.updated_by = u2.id
         LEFT JOIN Cr_mortgages m ON ct.id = m.credit_type_id
         WHERE ct.id = ?
         GROUP BY ct.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de crédito con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de crédito por código
   * @param {string} code - Código del tipo de crédito
   * @returns {Promise<Object>} Tipo de crédito
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT ct.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name
         FROM Cr_credit_types ct
         LEFT JOIN users u1 ON ct.created_by = u1.id
         LEFT JOIN users u2 ON ct.updated_by = u2.id
         WHERE ct.code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de crédito con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo tipos de créditos activos
   * @returns {Promise<Array>} Lista de tipos de créditos activos
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT ct.*, 
                u1.username as created_by_name
         FROM Cr_credit_types ct
         LEFT JOIN users u1 ON ct.created_by = u1.id
         WHERE ct.is_active = TRUE
         ORDER BY ct.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de créditos activos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tipo de crédito
   * @param {Object} creditTypeData - Datos del tipo de crédito
   * @returns {Promise<Object>} Tipo de crédito creado
   */
  static async create(creditTypeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el código no exista
      const [existingCode] = await connection.query(
        `SELECT id FROM Cr_credit_types WHERE code = ?`,
        [creditTypeData.code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe un tipo de crédito con el código ${creditTypeData.code}`);
      }

      // Verificar que el nombre no exista
      const [existingName] = await connection.query(
        `SELECT id FROM Cr_credit_types WHERE name = ?`,
        [creditTypeData.name]
      );
      
      if (existingName.length > 0) {
        throw new Error(`Ya existe un tipo de crédito con el nombre ${creditTypeData.name}`);
      }
      
      // Insertar el tipo de crédito
      const [result] = await connection.query(
        `INSERT INTO Cr_credit_types 
        (code, name, description, payment_frequency, interest_calculation_method, 
         allows_early_payment, allows_partial_payment, requires_guarantee, 
         is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creditTypeData.code,
          creditTypeData.name,
          creditTypeData.description || null,
          creditTypeData.payment_frequency || 'monthly',
          creditTypeData.interest_calculation_method || 'compound',
          creditTypeData.allows_early_payment !== false,
          creditTypeData.allows_partial_payment !== false,
          creditTypeData.requires_guarantee !== false,
          creditTypeData.is_active !== false,
          creditTypeData.created_by
        ]
      );
      
      const creditTypeId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdCreditType = await this.getById(creditTypeId);
      
      return createdCreditType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear tipo de crédito: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un tipo de crédito existente
   * @param {number} id - ID del tipo de crédito
   * @param {Object} creditTypeData - Datos actualizados del tipo de crédito
   * @returns {Promise<Object>} Tipo de crédito actualizado
   */
  static async update(id, creditTypeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de crédito exista
      const [existingCreditType] = await connection.query(
        `SELECT id FROM Cr_credit_types WHERE id = ?`,
        [id]
      );
      
      if (existingCreditType.length === 0) {
        throw new Error(`El tipo de crédito con ID ${id} no existe`);
      }

      // Verificar que el código no esté en uso por otro registro
      if (creditTypeData.code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM Cr_credit_types WHERE code = ? AND id != ?`,
          [creditTypeData.code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otro tipo de crédito con el código ${creditTypeData.code}`);
        }
      }

      // Verificar que el nombre no esté en uso por otro registro
      if (creditTypeData.name) {
        const [existingName] = await connection.query(
          `SELECT id FROM Cr_credit_types WHERE name = ? AND id != ?`,
          [creditTypeData.name, id]
        );
        
        if (existingName.length > 0) {
          throw new Error(`Ya existe otro tipo de crédito con el nombre ${creditTypeData.name}`);
        }
      }
      
      // Actualizar el tipo de crédito
      await connection.query(
        `UPDATE Cr_credit_types SET
         code = ?,
         name = ?,
         description = ?,
         payment_frequency = ?,
         interest_calculation_method = ?,
         allows_early_payment = ?,
         allows_partial_payment = ?,
         requires_guarantee = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          creditTypeData.code,
          creditTypeData.name,
          creditTypeData.description,
          creditTypeData.payment_frequency || 'monthly',
          creditTypeData.interest_calculation_method || 'compound',
          creditTypeData.allows_early_payment !== false,
          creditTypeData.allows_partial_payment !== false,
          creditTypeData.requires_guarantee !== false,
          creditTypeData.is_active !== false,
          creditTypeData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedCreditType = await this.getById(id);
      
      return updatedCreditType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar tipo de crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de un tipo de crédito
   * @param {number} id - ID del tipo de crédito
   * @param {boolean} isActive - Nuevo estado activo
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Tipo de crédito actualizado
   */
  static async toggleActive(id, isActive, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de crédito exista
      const [existingCreditType] = await connection.query(
        `SELECT id, is_active FROM Cr_credit_types WHERE id = ?`,
        [id]
      );
      
      if (existingCreditType.length === 0) {
        throw new Error(`El tipo de crédito con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga créditos activos asociados
      if (!isActive) {
        const [activeMortgages] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_mortgages 
           WHERE credit_type_id = ? AND status IN ('active', 'suspended')`,
          [id]
        );
        
        if (activeMortgages[0].count > 0) {
          throw new Error('No se puede desactivar un tipo de crédito que tiene créditos activos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_credit_types SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedCreditType = await this.getById(id);
      
      return updatedCreditType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado del tipo de crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un tipo de crédito (solo si no tiene créditos asociados)
   * @param {number} id - ID del tipo de crédito
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de crédito exista
      const [existingCreditType] = await connection.query(
        `SELECT id, name FROM Cr_credit_types WHERE id = ?`,
        [id]
      );
      
      if (existingCreditType.length === 0) {
        throw new Error(`El tipo de crédito con ID ${id} no existe`);
      }

      // Verificar que no tenga créditos asociados
      const [associatedMortgages] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgages WHERE credit_type_id = ?`,
        [id]
      );
      
      if (associatedMortgages[0].count > 0) {
        throw new Error(`No se puede eliminar el tipo de crédito "${existingCreditType[0].name}" porque tiene ${associatedMortgages[0].count} crédito(s) asociado(s)`);
      }

      // Verificar que no tenga configuraciones de cuotas asociadas
      const [associatedConfigurations] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_quota_configurations WHERE credit_type_id = ?`,
        [id]
      );
      
      if (associatedConfigurations[0].count > 0) {
        throw new Error(`No se puede eliminar el tipo de crédito "${existingCreditType[0].name}" porque tiene ${associatedConfigurations[0].count} configuración(es) de cuotas asociada(s)`);
      }
      
      // Eliminar el tipo de crédito
      await connection.query(`DELETE FROM Cr_credit_types WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { id, deleted: true, name: existingCreditType[0].name };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar tipo de crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un código de tipo de crédito está disponible
   * @param {string} code - Código a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isCodeAvailable(code, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_credit_types WHERE code = ?`;
      let params = [code];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const [rows] = await pool.query(query, params);
      return rows[0].count === 0;
    } catch (error) {
      logger.error(`Error al verificar disponibilidad del código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de tipos de créditos
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_types,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_types,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_types,
          COUNT(DISTINCT payment_frequency) as different_frequencies,
          COUNT(DISTINCT interest_calculation_method) as different_calculation_methods
        FROM Cr_credit_types
      `);

      const [mortgageStats] = await pool.query(`
        SELECT 
          ct.name as credit_type_name,
          COUNT(m.id) as mortgages_count,
          SUM(CASE WHEN m.status = 'active' THEN 1 ELSE 0 END) as active_mortgages,
          SUM(m.principal_amount) as total_principal_amount
        FROM Cr_credit_types ct
        LEFT JOIN Cr_mortgages m ON ct.id = m.credit_type_id
        WHERE ct.is_active = TRUE
        GROUP BY ct.id, ct.name
        ORDER BY mortgages_count DESC
      `);

      return {
        general: stats[0],
        by_type: mortgageStats
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de tipos de créditos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CreditTypes;