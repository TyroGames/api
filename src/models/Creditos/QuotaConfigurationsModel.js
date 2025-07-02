/**
 * Modelo para gestionar las configuraciones de cuotas de créditos hipotecarios
 * @module models/Creditos/QuotaConfigurationsModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las configuraciones de cuotas en el sistema
 */
class QuotaConfigurations {
  /**
   * Obtener todas las configuraciones de cuotas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de configuraciones de cuotas
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT qc.*, 
               ct.name as credit_type_name,
               ct.code as credit_type_code,
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT m.id) as mortgages_count
        FROM Cr_quota_configurations qc
        LEFT JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
        LEFT JOIN users u1 ON qc.created_by = u1.id
        LEFT JOIN users u2 ON qc.updated_by = u2.id
        LEFT JOIN Cr_mortgages m ON qc.id = m.quota_configuration_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("qc.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.credit_type_id) {
        conditions.push("qc.credit_type_id = ?");
        queryParams.push(filters.credit_type_id);
      }

      if (filters.quota_type) {
        conditions.push("qc.quota_type = ?");
        queryParams.push(filters.quota_type);
      }

      if (filters.is_active !== undefined) {
        conditions.push("qc.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY qc.id ORDER BY ct.name ASC, qc.name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener configuraciones de cuotas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una configuración de cuota por ID
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object>} Configuración de cuota
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT qc.*, 
                ct.name as credit_type_name,
                ct.code as credit_type_code,
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT m.id) as mortgages_count
         FROM Cr_quota_configurations qc
         LEFT JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
         LEFT JOIN users u1 ON qc.created_by = u1.id
         LEFT JOIN users u2 ON qc.updated_by = u2.id
         LEFT JOIN Cr_mortgages m ON qc.id = m.quota_configuration_id
         WHERE qc.id = ?
         GROUP BY qc.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener configuración de cuota con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener configuraciones por tipo de crédito
   * @param {number} creditTypeId - ID del tipo de crédito
   * @returns {Promise<Array>} Lista de configuraciones
   */
  static async getByCreditType(creditTypeId) {
    try {
      const [rows] = await pool.query(
        `SELECT qc.*, 
                ct.name as credit_type_name,
                ct.code as credit_type_code,
                u1.username as created_by_name
         FROM Cr_quota_configurations qc
         LEFT JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
         LEFT JOIN users u1 ON qc.created_by = u1.id
         WHERE qc.credit_type_id = ? AND qc.is_active = TRUE
         ORDER BY qc.name ASC`,
        [creditTypeId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener configuraciones por tipo de crédito ${creditTypeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo configuraciones activas
   * @returns {Promise<Array>} Lista de configuraciones activas
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT qc.*, 
                ct.name as credit_type_name,
                ct.code as credit_type_code,
                u1.username as created_by_name
         FROM Cr_quota_configurations qc
         LEFT JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
         LEFT JOIN users u1 ON qc.created_by = u1.id
         WHERE qc.is_active = TRUE AND ct.is_active = TRUE
         ORDER BY ct.name ASC, qc.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener configuraciones activas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva configuración de cuota
   * @param {Object} configData - Datos de la configuración
   * @returns {Promise<Object>} Configuración creada
   */
  static async create(configData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de crédito exista y esté activo
      const [creditType] = await connection.query(
        `SELECT id, name, is_active FROM Cr_credit_types WHERE id = ?`,
        [configData.credit_type_id]
      );
      
      if (creditType.length === 0) {
        throw new Error(`El tipo de crédito con ID ${configData.credit_type_id} no existe`);
      }

      if (!creditType[0].is_active) {
        throw new Error(`No se puede crear una configuración para el tipo de crédito "${creditType[0].name}" porque está inactivo`);
      }

      // Verificar que no exista otra configuración con el mismo nombre para el mismo tipo de crédito
      const [existingConfig] = await connection.query(
        `SELECT id FROM Cr_quota_configurations 
         WHERE credit_type_id = ? AND name = ?`,
        [configData.credit_type_id, configData.name]
      );
      
      if (existingConfig.length > 0) {
        throw new Error(`Ya existe una configuración con el nombre "${configData.name}" para este tipo de crédito`);
      }
      
      // Insertar la configuración
      const [result] = await connection.query(
        `INSERT INTO Cr_quota_configurations 
        (credit_type_id, quota_type, name, description, management_fee_percentage, 
         management_fee_amount, minimum_payment_percentage, grace_period_days, 
         late_payment_penalty_percentage, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          configData.credit_type_id,
          configData.quota_type,
          configData.name,
          configData.description || null,
          configData.management_fee_percentage || 0.0000,
          configData.management_fee_amount || 0.00,
          configData.minimum_payment_percentage || 0.0000,
          configData.grace_period_days || 0,
          configData.late_payment_penalty_percentage || 0.0000,
          configData.is_active !== false,
          configData.created_by
        ]
      );
      
      const configId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdConfig = await this.getById(configId);
      
      return createdConfig;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear configuración de cuota: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una configuración de cuota existente
   * @param {number} id - ID de la configuración
   * @param {Object} configData - Datos actualizados
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async update(id, configData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la configuración exista
      const [existingConfig] = await connection.query(
        `SELECT id, credit_type_id FROM Cr_quota_configurations WHERE id = ?`,
        [id]
      );
      
      if (existingConfig.length === 0) {
        throw new Error(`La configuración con ID ${id} no existe`);
      }

      // Si se está cambiando el tipo de crédito, verificar que exista y esté activo
      if (configData.credit_type_id && configData.credit_type_id !== existingConfig[0].credit_type_id) {
        const [creditType] = await connection.query(
          `SELECT id, name, is_active FROM Cr_credit_types WHERE id = ?`,
          [configData.credit_type_id]
        );
        
        if (creditType.length === 0) {
          throw new Error(`El tipo de crédito con ID ${configData.credit_type_id} no existe`);
        }

        if (!creditType[0].is_active) {
          throw new Error(`No se puede asociar a un tipo de crédito inactivo`);
        }
      }

      // Verificar que no exista otra configuración con el mismo nombre para el mismo tipo de crédito
      if (configData.name) {
        const checkCreditTypeId = configData.credit_type_id || existingConfig[0].credit_type_id;
        const [duplicateName] = await connection.query(
          `SELECT id FROM Cr_quota_configurations 
           WHERE credit_type_id = ? AND name = ? AND id != ?`,
          [checkCreditTypeId, configData.name, id]
        );
        
        if (duplicateName.length > 0) {
          throw new Error(`Ya existe otra configuración con el nombre "${configData.name}" para este tipo de crédito`);
        }
      }
      
      // Actualizar la configuración
      await connection.query(
        `UPDATE Cr_quota_configurations SET
         credit_type_id = ?,
         quota_type = ?,
         name = ?,
         description = ?,
         management_fee_percentage = ?,
         management_fee_amount = ?,
         minimum_payment_percentage = ?,
         grace_period_days = ?,
         late_payment_penalty_percentage = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          configData.credit_type_id || existingConfig[0].credit_type_id,
          configData.quota_type,
          configData.name,
          configData.description,
          configData.management_fee_percentage || 0.0000,
          configData.management_fee_amount || 0.00,
          configData.minimum_payment_percentage || 0.0000,
          configData.grace_period_days || 0,
          configData.late_payment_penalty_percentage || 0.0000,
          configData.is_active !== false,
          configData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedConfig = await this.getById(id);
      
      return updatedConfig;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar configuración de cuota ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de una configuración
   * @param {number} id - ID de la configuración
   * @param {boolean} isActive - Nuevo estado activo
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async toggleActive(id, isActive, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la configuración exista
      const [existingConfig] = await connection.query(
        `SELECT id, name, is_active FROM Cr_quota_configurations WHERE id = ?`,
        [id]
      );
      
      if (existingConfig.length === 0) {
        throw new Error(`La configuración con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga créditos activos asociados
      if (!isActive) {
        const [activeMortgages] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_mortgages 
           WHERE quota_configuration_id = ? AND status IN ('active', 'suspended')`,
          [id]
        );
        
        if (activeMortgages[0].count > 0) {
          throw new Error('No se puede desactivar una configuración que tiene créditos activos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_quota_configurations SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedConfig = await this.getById(id);
      
      return updatedConfig;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado de la configuración ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una configuración (solo si no tiene créditos asociados)
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la configuración exista
      const [existingConfig] = await connection.query(
        `SELECT id, name FROM Cr_quota_configurations WHERE id = ?`,
        [id]
      );
      
      if (existingConfig.length === 0) {
        throw new Error(`La configuración con ID ${id} no existe`);
      }

      // Verificar que no tenga créditos asociados
      const [associatedMortgages] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgages WHERE quota_configuration_id = ?`,
        [id]
      );
      
      if (associatedMortgages[0].count > 0) {
        throw new Error(`No se puede eliminar la configuración "${existingConfig[0].name}" porque tiene ${associatedMortgages[0].count} crédito(s) asociado(s)`);
      }
      
      // Eliminar la configuración
      await connection.query(`DELETE FROM Cr_quota_configurations WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { id, deleted: true, name: existingConfig[0].name };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar configuración ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de configuraciones
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_configurations,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_configurations,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_configurations,
          COUNT(DISTINCT credit_type_id) as different_credit_types,
          COUNT(DISTINCT quota_type) as different_quota_types
        FROM Cr_quota_configurations
      `);

      const [byType] = await pool.query(`
        SELECT 
          ct.name as credit_type_name,
          qc.quota_type,
          COUNT(qc.id) as configurations_count,
          COUNT(m.id) as mortgages_count
        FROM Cr_quota_configurations qc
        LEFT JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
        LEFT JOIN Cr_mortgages m ON qc.id = m.quota_configuration_id
        WHERE qc.is_active = TRUE
        GROUP BY ct.id, qc.quota_type
        ORDER BY configurations_count DESC
      `);

      return {
        general: stats[0],
        by_type: byType
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de configuraciones: ${error.message}`);
      throw error;
    }
  }
}

module.exports = QuotaConfigurations;