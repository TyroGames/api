/**
 * Modelo para gestionar las propiedades hipotecarias del sistema de créditos
 * @module models/Creditos/PropertiesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las propiedades hipotecarias en el sistema
 */
class Properties {
  /**
   * Obtener todas las propiedades con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de propiedades
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, 
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT po.id) as owners_count,
               COUNT(DISTINCT m.id) as mortgages_count
        FROM Cr_properties p
        LEFT JOIN users u1 ON p.created_by = u1.id
        LEFT JOIN users u2 ON p.updated_by = u2.id
        LEFT JOIN Cr_property_owners po ON p.id = po.property_id
        LEFT JOIN Cr_mortgages m ON p.id = m.property_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.property_code) {
        conditions.push("p.property_code LIKE ?");
        queryParams.push(`%${filters.property_code}%`);
      }

      if (filters.property_type) {
        conditions.push("p.property_type = ?");
        queryParams.push(filters.property_type);
      }

      if (filters.city) {
        conditions.push("p.city LIKE ?");
        queryParams.push(`%${filters.city}%`);
      }

      if (filters.state) {
        conditions.push("p.state LIKE ?");
        queryParams.push(`%${filters.state}%`);
      }

      if (filters.stratum) {
        conditions.push("p.stratum = ?");
        queryParams.push(parseInt(filters.stratum));
      }

      if (filters.property_condition) {
        conditions.push("p.property_condition = ?");
        queryParams.push(filters.property_condition);
      }

      if (filters.min_value) {
        conditions.push("p.property_value >= ?");
        queryParams.push(parseFloat(filters.min_value));
      }

      if (filters.max_value) {
        conditions.push("p.property_value <= ?");
        queryParams.push(parseFloat(filters.max_value));
      }

      if (filters.min_area) {
        conditions.push("p.area_sqm >= ?");
        queryParams.push(parseFloat(filters.min_area));
      }

      if (filters.max_area) {
        conditions.push("p.area_sqm <= ?");
        queryParams.push(parseFloat(filters.max_area));
      }

      if (filters.is_active !== undefined) {
        conditions.push("p.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY p.id ORDER BY p.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propiedades: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una propiedad por ID
   * @param {number} id - ID de la propiedad
   * @returns {Promise<Object>} Propiedad
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT po.id) as owners_count,
                COUNT(DISTINCT m.id) as mortgages_count
         FROM Cr_properties p
         LEFT JOIN users u1 ON p.created_by = u1.id
         LEFT JOIN users u2 ON p.updated_by = u2.id
         LEFT JOIN Cr_property_owners po ON p.id = po.property_id
         LEFT JOIN Cr_mortgages m ON p.id = m.property_id
         WHERE p.id = ?
         GROUP BY p.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener propiedad con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una propiedad por código
   * @param {string} code - Código de la propiedad
   * @returns {Promise<Object>} Propiedad
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name
         FROM Cr_properties p
         LEFT JOIN users u1 ON p.created_by = u1.id
         LEFT JOIN users u2 ON p.updated_by = u2.id
         WHERE p.property_code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener propiedad con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener propiedades por ciudad
   * @param {string} city - Ciudad
   * @returns {Promise<Array>} Lista de propiedades
   */
  static async getByCity(city) {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, 
                u1.username as created_by_name,
                COUNT(DISTINCT po.id) as owners_count
         FROM Cr_properties p
         LEFT JOIN users u1 ON p.created_by = u1.id
         LEFT JOIN Cr_property_owners po ON p.id = po.property_id
         WHERE p.city = ? AND p.is_active = TRUE
         GROUP BY p.id
         ORDER BY p.property_value DESC`,
        [city]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propiedades por ciudad ${city}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo propiedades activas
   * @returns {Promise<Array>} Lista de propiedades activas
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, 
                u1.username as created_by_name,
                COUNT(DISTINCT po.id) as owners_count
         FROM Cr_properties p
         LEFT JOIN users u1 ON p.created_by = u1.id
         LEFT JOIN Cr_property_owners po ON p.id = po.property_id
         WHERE p.is_active = TRUE
         GROUP BY p.id
         ORDER BY p.state ASC, p.city ASC, p.property_value DESC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propiedades activas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva propiedad
   * @param {Object} propertyData - Datos de la propiedad
   * @returns {Promise<Object>} Propiedad creada
   */
  static async create(propertyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el código no exista
      const [existingCode] = await connection.query(
        `SELECT id FROM Cr_properties WHERE property_code = ?`,
        [propertyData.property_code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe una propiedad con el código ${propertyData.property_code}`);
      }

      // Verificar que el número de matrícula no exista si se proporciona
      if (propertyData.registration_number) {
        const [existingRegistration] = await connection.query(
          `SELECT id FROM Cr_properties WHERE registration_number = ?`,
          [propertyData.registration_number]
        );
        
        if (existingRegistration.length > 0) {
          throw new Error(`Ya existe una propiedad con el número de matrícula ${propertyData.registration_number}`);
        }
      }
      
      // Insertar la propiedad
      const [result] = await connection.query(
        `INSERT INTO Cr_properties 
        (property_code, property_type, address, city, state, postal_code, country,
         area_sqm, construction_year, property_value, appraisal_date, appraisal_value,
         appraisal_company, property_tax_value, property_tax_number, registration_number,
         cadastral_number, stratum, utilities_available, property_condition, notes,
         is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          propertyData.property_code,
          propertyData.property_type,
          propertyData.address,
          propertyData.city,
          propertyData.state,
          propertyData.postal_code || null,
          propertyData.country || 'Colombia',
          propertyData.area_sqm || null,
          propertyData.construction_year || null,
          propertyData.property_value,
          propertyData.appraisal_date || null,
          propertyData.appraisal_value || null,
          propertyData.appraisal_company || null,
          propertyData.property_tax_value || null,
          propertyData.property_tax_number || null,
          propertyData.registration_number || null,
          propertyData.cadastral_number || null,
          propertyData.stratum || null,
          propertyData.utilities_available || null,
          propertyData.property_condition || 'good',
          propertyData.notes || null,
          propertyData.is_active !== false,
          propertyData.created_by
        ]
      );
      
      const propertyId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdProperty = await this.getById(propertyId);
      
      return createdProperty;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear propiedad: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una propiedad existente
   * @param {number} id - ID de la propiedad
   * @param {Object} propertyData - Datos actualizados de la propiedad
   * @returns {Promise<Object>} Propiedad actualizada
   */
  static async update(id, propertyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la propiedad exista
      const [existingProperty] = await connection.query(
        `SELECT id FROM Cr_properties WHERE id = ?`,
        [id]
      );
      
      if (existingProperty.length === 0) {
        throw new Error(`La propiedad con ID ${id} no existe`);
      }

      // Verificar que el código no esté en uso por otra propiedad
      if (propertyData.property_code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM Cr_properties WHERE property_code = ? AND id != ?`,
          [propertyData.property_code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otra propiedad con el código ${propertyData.property_code}`);
        }
      }

      // Verificar que el número de matrícula no esté en uso por otra propiedad
      if (propertyData.registration_number) {
        const [existingRegistration] = await connection.query(
          `SELECT id FROM Cr_properties WHERE registration_number = ? AND id != ?`,
          [propertyData.registration_number, id]
        );
        
        if (existingRegistration.length > 0) {
          throw new Error(`Ya existe otra propiedad con el número de matrícula ${propertyData.registration_number}`);
        }
      }
      
      // Actualizar la propiedad
      await connection.query(
        `UPDATE Cr_properties SET
         property_code = ?,
         property_type = ?,
         address = ?,
         city = ?,
         state = ?,
         postal_code = ?,
         country = ?,
         area_sqm = ?,
         construction_year = ?,
         property_value = ?,
         appraisal_date = ?,
         appraisal_value = ?,
         appraisal_company = ?,
         property_tax_value = ?,
         property_tax_number = ?,
         registration_number = ?,
         cadastral_number = ?,
         stratum = ?,
         utilities_available = ?,
         property_condition = ?,
         notes = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          propertyData.property_code,
          propertyData.property_type,
          propertyData.address,
          propertyData.city,
          propertyData.state,
          propertyData.postal_code,
          propertyData.country || 'Colombia',
          propertyData.area_sqm,
          propertyData.construction_year,
          propertyData.property_value,
          propertyData.appraisal_date,
          propertyData.appraisal_value,
          propertyData.appraisal_company,
          propertyData.property_tax_value,
          propertyData.property_tax_number,
          propertyData.registration_number,
          propertyData.cadastral_number,
          propertyData.stratum,
          propertyData.utilities_available,
          propertyData.property_condition || 'good',
          propertyData.notes,
          propertyData.is_active !== false,
          propertyData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedProperty = await this.getById(id);
      
      return updatedProperty;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar propiedad ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de una propiedad
   * @param {number} id - ID de la propiedad
   * @param {boolean} isActive - Nuevo estado activo
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Propiedad actualizada
   */
  static async toggleActive(id, isActive, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la propiedad exista
      const [existingProperty] = await connection.query(
        `SELECT id, property_code, is_active FROM Cr_properties WHERE id = ?`,
        [id]
      );
      
      if (existingProperty.length === 0) {
        throw new Error(`La propiedad con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga créditos activos asociados
      if (!isActive) {
        const [activeMortgages] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_mortgages 
           WHERE property_id = ? AND status IN ('active', 'suspended')`,
          [id]
        );
        
        if (activeMortgages[0].count > 0) {
          throw new Error('No se puede desactivar una propiedad que tiene créditos activos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_properties SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedProperty = await this.getById(id);
      
      return updatedProperty;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado de la propiedad ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una propiedad (solo si no tiene créditos asociados)
   * @param {number} id - ID de la propiedad
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la propiedad exista
      const [existingProperty] = await connection.query(
        `SELECT id, property_code FROM Cr_properties WHERE id = ?`,
        [id]
      );
      
      if (existingProperty.length === 0) {
        throw new Error(`La propiedad con ID ${id} no existe`);
      }

      // Verificar que no tenga créditos asociados
      const [associatedMortgages] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgages WHERE property_id = ?`,
        [id]
      );
      
      if (associatedMortgages[0].count > 0) {
        throw new Error(`No se puede eliminar la propiedad "${existingProperty[0].property_code}" porque tiene ${associatedMortgages[0].count} crédito(s) asociado(s)`);
      }

      // Verificar que no tenga propietarios asociados
      const [associatedOwners] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_property_owners WHERE property_id = ?`,
        [id]
      );
      
      if (associatedOwners[0].count > 0) {
        throw new Error(`No se puede eliminar la propiedad "${existingProperty[0].property_code}" porque tiene ${associatedOwners[0].count} propietario(s) asociado(s)`);
      }
      
      // Eliminar la propiedad
      await connection.query(`DELETE FROM Cr_properties WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { id, deleted: true, property_code: existingProperty[0].property_code };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar propiedad ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un código de propiedad está disponible
   * @param {string} code - Código a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isCodeAvailable(code, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_properties WHERE property_code = ?`;
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
   * Obtener ciudades únicas de las propiedades
   * @returns {Promise<Array>} Lista de ciudades
   */
  static async getCities() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT city, state, COUNT(*) as properties_count,
                AVG(property_value) as avg_value,
                MIN(property_value) as min_value,
                MAX(property_value) as max_value
         FROM Cr_properties 
         WHERE is_active = TRUE
         GROUP BY city, state
         ORDER BY state ASC, city ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener ciudades de propiedades: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estados únicos de las propiedades
   * @returns {Promise<Array>} Lista de estados
   */
  static async getStates() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT state, COUNT(*) as properties_count,
                AVG(property_value) as avg_value
         FROM Cr_properties 
         WHERE is_active = TRUE
         GROUP BY state
         ORDER BY state ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener estados de propiedades: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener tipos de propiedades únicos
   * @returns {Promise<Array>} Lista de tipos
   */
  static async getPropertyTypes() {
    try {
      const [rows] = await pool.query(
        `SELECT property_type, COUNT(*) as count,
                AVG(property_value) as avg_value,
                AVG(area_sqm) as avg_area
         FROM Cr_properties 
         WHERE is_active = TRUE
         GROUP BY property_type
         ORDER BY count DESC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de propiedades: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de propiedades
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_properties,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_properties,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_properties,
          COUNT(DISTINCT property_type) as different_types,
          COUNT(DISTINCT city) as different_cities,
          COUNT(DISTINCT state) as different_states,
          AVG(property_value) as avg_value,
          MIN(property_value) as min_value,
          MAX(property_value) as max_value,
          SUM(property_value) as total_value,
          AVG(area_sqm) as avg_area,
          SUM(area_sqm) as total_area
        FROM Cr_properties
      `);

      const [byType] = await pool.query(`
        SELECT 
          property_type,
          COUNT(*) as count,
          AVG(property_value) as avg_value,
          AVG(area_sqm) as avg_area
        FROM Cr_properties
        WHERE is_active = TRUE
        GROUP BY property_type
        ORDER BY count DESC
      `);

      const [byCity] = await pool.query(`
        SELECT 
          city,
          state,
          COUNT(*) as count,
          AVG(property_value) as avg_value
        FROM Cr_properties
        WHERE is_active = TRUE
        GROUP BY city, state
        ORDER BY count DESC
        LIMIT 10
      `);

      const [byStratum] = await pool.query(`
        SELECT 
          stratum,
          COUNT(*) as count,
          AVG(property_value) as avg_value
        FROM Cr_properties
        WHERE is_active = TRUE AND stratum IS NOT NULL
        GROUP BY stratum
        ORDER BY stratum ASC
      `);

      return {
        general: stats[0],
        by_type: byType,
        by_city: byCity,
        by_stratum: byStratum
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de propiedades: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Properties; 