/**
 * Modelo para gestionar los propietarios de propiedades hipotecarias del sistema de créditos
 * @module models/Creditos/PropertyOwnersModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las relaciones entre propiedades y sus propietarios
 */
class PropertyOwners {
  /**
   * Obtener todos los propietarios con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de propietarios con información de propiedades y terceros
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT po.*, 
               p.property_code,
               p.property_type,
               p.address as property_address,
               p.city as property_city,
               p.state as property_state,
               p.property_value,
               tp.identification_type as document_type,
               tp.identification_number as document_number,
               tp.name as owner_name,
               tp.phone as owner_phone,
               tp.email as owner_email,
               tp.address as owner_address,
               u.username as created_by_name
        FROM Cr_property_owners po
        INNER JOIN Cr_properties p ON po.property_id = p.id
        INNER JOIN third_parties tp ON po.third_party_id = tp.id
        LEFT JOIN users u ON po.created_by = u.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.property_id) {
        conditions.push("po.property_id = ?");
        queryParams.push(parseInt(filters.property_id));
      }

      if (filters.third_party_id) {
        conditions.push("po.third_party_id = ?");
        queryParams.push(parseInt(filters.third_party_id));
      }

      if (filters.property_code) {
        conditions.push("p.property_code LIKE ?");
        queryParams.push(`%${filters.property_code}%`);
      }

      if (filters.owner_name) {
        conditions.push("tp.name LIKE ?");
        queryParams.push(`%${filters.owner_name}%`);
      }

      if (filters.owner_document) {
        conditions.push("tp.identification_number LIKE ?");
        queryParams.push(`%${filters.owner_document}%`);
      }

      if (filters.is_primary_owner !== undefined) {
        conditions.push("po.is_primary_owner = ?");
        queryParams.push(filters.is_primary_owner);
      }

      if (filters.min_ownership_percentage) {
        conditions.push("po.ownership_percentage >= ?");
        queryParams.push(parseFloat(filters.min_ownership_percentage));
      }

      if (filters.max_ownership_percentage) {
        conditions.push("po.ownership_percentage <= ?");
        queryParams.push(parseFloat(filters.max_ownership_percentage));
      }

      if (filters.property_city) {
        conditions.push("p.city LIKE ?");
        queryParams.push(`%${filters.property_city}%`);
      }

      if (filters.property_state) {
        conditions.push("p.state LIKE ?");
        queryParams.push(`%${filters.property_state}%`);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY p.property_code ASC, po.ownership_percentage DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propietarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un propietario por ID
   * @param {number} id - ID del propietario
   * @returns {Promise<Object>} Propietario con información completa
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT po.*, 
                p.property_code,
                p.property_type,
                p.address as property_address,
                p.city as property_city,
                p.state as property_state,
                p.property_value,
                p.area_sqm,
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as owner_name,
                tp.phone as owner_phone,
                tp.email as owner_email,
                tp.address as owner_address,
                u.username as created_by_name
         FROM Cr_property_owners po
         INNER JOIN Cr_properties p ON po.property_id = p.id
         INNER JOIN third_parties tp ON po.third_party_id = tp.id
         LEFT JOIN users u ON po.created_by = u.id
         WHERE po.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener propietario con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener propietarios por ID de propiedad
   * @param {number} propertyId - ID de la propiedad
   * @returns {Promise<Array>} Lista de propietarios de la propiedad
   */
  static async getByPropertyId(propertyId) {
    try {
      const [rows] = await pool.query(
        `SELECT po.*, 
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as owner_name,
                tp.phone as owner_phone,
                tp.email as owner_email,
                tp.address as owner_address,
                u.username as created_by_name
         FROM Cr_property_owners po
         INNER JOIN third_parties tp ON po.third_party_id = tp.id
         LEFT JOIN users u ON po.created_by = u.id
         WHERE po.property_id = ?
         ORDER BY po.is_primary_owner DESC, po.ownership_percentage DESC`,
        [propertyId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propietarios por propiedad ${propertyId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener propiedades por ID de tercero
   * @param {number} thirdPartyId - ID del tercero
   * @returns {Promise<Array>} Lista de propiedades del tercero
   */
  static async getByThirdPartyId(thirdPartyId) {
    try {
      const [rows] = await pool.query(
        `SELECT po.*, 
                p.property_code,
                p.property_type,
                p.address as property_address,
                p.city as property_city,
                p.state as property_state,
                p.property_value,
                p.area_sqm,
                u.username as created_by_name
         FROM Cr_property_owners po
         INNER JOIN Cr_properties p ON po.property_id = p.id
         LEFT JOIN users u ON po.created_by = u.id
         WHERE po.third_party_id = ?
         ORDER BY po.is_primary_owner DESC, po.ownership_percentage DESC`,
        [thirdPartyId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propiedades por tercero ${thirdPartyId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener propietarios principales
   * @returns {Promise<Array>} Lista de propietarios principales
   */
  static async getPrimaryOwners() {
    try {
      const [rows] = await pool.query(
        `SELECT po.*, 
                p.property_code,
                p.property_type,
                p.address as property_address,
                p.city as property_city,
                p.state as property_state,
                p.property_value,
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as owner_name,
                tp.phone as owner_phone,
                tp.email as owner_email
         FROM Cr_property_owners po
         INNER JOIN Cr_properties p ON po.property_id = p.id
         INNER JOIN third_parties tp ON po.third_party_id = tp.id
         WHERE po.is_primary_owner = TRUE
         ORDER BY p.property_code ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener propietarios principales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo propietario de propiedad
   * @param {Object} ownerData - Datos del propietario
   * @returns {Promise<Object>} Propietario creado
   */
  static async create(ownerData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la propiedad exista
      const [existingProperty] = await connection.query(
        `SELECT id, property_code FROM Cr_properties WHERE id = ?`,
        [ownerData.property_id]
      );
      
      if (existingProperty.length === 0) {
        throw new Error(`La propiedad con ID ${ownerData.property_id} no existe`);
      }

      // Verificar que el tercero exista
      const [existingThirdParty] = await connection.query(
        `SELECT id, name FROM third_parties WHERE id = ?`,
        [ownerData.third_party_id]
      );
      
      if (existingThirdParty.length === 0) {
        throw new Error(`El tercero con ID ${ownerData.third_party_id} no existe`);
      }

      // Verificar que no exista ya la relación
      const [existingRelation] = await connection.query(
        `SELECT id FROM Cr_property_owners WHERE property_id = ? AND third_party_id = ?`,
        [ownerData.property_id, ownerData.third_party_id]
      );
      
      if (existingRelation.length > 0) {
        throw new Error(`El tercero "${existingThirdParty[0].name}" ya es propietario de la propiedad "${existingProperty[0].property_code}"`);
      }

      // Verificar que los porcentajes no excedan el 100%
      const [totalPercentage] = await connection.query(
        `SELECT COALESCE(SUM(ownership_percentage), 0) as total_percentage 
         FROM Cr_property_owners WHERE property_id = ?`,
        [ownerData.property_id]
      );
      
      const newTotalPercentage = totalPercentage[0].total_percentage + (ownerData.ownership_percentage || 100);
      if (newTotalPercentage > 100) {
        throw new Error(`El porcentaje de propiedad (${ownerData.ownership_percentage}%) haría que el total supere el 100%. Total actual: ${totalPercentage[0].total_percentage}%`);
      }

      // Si se marca como propietario principal, desmarcar otros como principales
      if (ownerData.is_primary_owner) {
        await connection.query(
          `UPDATE Cr_property_owners SET is_primary_owner = FALSE WHERE property_id = ?`,
          [ownerData.property_id]
        );
      }
      
      // Insertar el propietario
      const [result] = await connection.query(
        `INSERT INTO Cr_property_owners 
        (property_id, third_party_id, ownership_percentage, is_primary_owner,
         acquisition_date, acquisition_cost, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ownerData.property_id,
          ownerData.third_party_id,
          ownerData.ownership_percentage || 100.00,
          ownerData.is_primary_owner || false,
          ownerData.acquisition_date || null,
          ownerData.acquisition_cost || null,
          ownerData.notes || null,
          ownerData.created_by
        ]
      );
      
      const ownerId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdOwner = await this.getById(ownerId);
      
      return createdOwner;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear propietario: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un propietario existente
   * @param {number} id - ID del propietario
   * @param {Object} ownerData - Datos actualizados del propietario
   * @returns {Promise<Object>} Propietario actualizado
   */
  static async update(id, ownerData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el propietario exista
      const [existingOwner] = await connection.query(
        `SELECT id, property_id, third_party_id, ownership_percentage FROM Cr_property_owners WHERE id = ?`,
        [id]
      );
      
      if (existingOwner.length === 0) {
        throw new Error(`El propietario con ID ${id} no existe`);
      }

      // Verificar que los porcentajes no excedan el 100% (excluyendo el registro actual)
      if (ownerData.ownership_percentage !== undefined) {
        const [totalPercentage] = await connection.query(
          `SELECT COALESCE(SUM(ownership_percentage), 0) as total_percentage 
           FROM Cr_property_owners WHERE property_id = ? AND id != ?`,
          [existingOwner[0].property_id, id]
        );
        
        const newTotalPercentage = totalPercentage[0].total_percentage + ownerData.ownership_percentage;
        if (newTotalPercentage > 100) {
          throw new Error(`El porcentaje de propiedad (${ownerData.ownership_percentage}%) haría que el total supere el 100%. Total actual de otros propietarios: ${totalPercentage[0].total_percentage}%`);
        }
      }

      // Si se marca como propietario principal, desmarcar otros como principales
      if (ownerData.is_primary_owner) {
        await connection.query(
          `UPDATE Cr_property_owners SET is_primary_owner = FALSE 
           WHERE property_id = ? AND id != ?`,
          [existingOwner[0].property_id, id]
        );
      }
      
      // Actualizar el propietario
      await connection.query(
        `UPDATE Cr_property_owners SET
         ownership_percentage = ?,
         is_primary_owner = ?,
         acquisition_date = ?,
         acquisition_cost = ?,
         notes = ?
         WHERE id = ?`,
        [
          ownerData.ownership_percentage !== undefined ? ownerData.ownership_percentage : existingOwner[0].ownership_percentage,
          ownerData.is_primary_owner !== undefined ? ownerData.is_primary_owner : false,
          ownerData.acquisition_date || null,
          ownerData.acquisition_cost || null,
          ownerData.notes || null,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedOwner = await this.getById(id);
      
      return updatedOwner;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar propietario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un propietario
   * @param {number} id - ID del propietario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el propietario exista
      const [existingOwner] = await connection.query(
        `SELECT po.id, po.property_id, po.third_party_id, po.is_primary_owner,
                p.property_code, tp.name as owner_name
         FROM Cr_property_owners po
         INNER JOIN Cr_properties p ON po.property_id = p.id
         INNER JOIN third_parties tp ON po.third_party_id = tp.id
         WHERE po.id = ?`,
        [id]
      );
      
      if (existingOwner.length === 0) {
        throw new Error(`El propietario con ID ${id} no existe`);
      }

      // Verificar que no sea el único propietario
      const [ownerCount] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_property_owners WHERE property_id = ?`,
        [existingOwner[0].property_id]
      );
      
      if (ownerCount[0].count === 1) {
        throw new Error(`No se puede eliminar al único propietario de la propiedad "${existingOwner[0].property_code}"`);
      }

      // Si era el propietario principal, asignar a otro como principal
      if (existingOwner[0].is_primary_owner) {
        await connection.query(
          `UPDATE Cr_property_owners SET is_primary_owner = TRUE 
           WHERE property_id = ? AND id != ? 
           ORDER BY ownership_percentage DESC LIMIT 1`,
          [existingOwner[0].property_id, id]
        );
      }
      
      // Eliminar el propietario
      await connection.query(`DELETE FROM Cr_property_owners WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { 
        id, 
        deleted: true, 
        property_code: existingOwner[0].property_code,
        owner_name: existingOwner[0].owner_name
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar propietario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si una relación propiedad-tercero ya existe
   * @param {number} propertyId - ID de la propiedad
   * @param {number} thirdPartyId - ID del tercero
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si existe, False si no existe
   */
  static async relationExists(propertyId, thirdPartyId, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_property_owners 
                   WHERE property_id = ? AND third_party_id = ?`;
      let params = [propertyId, thirdPartyId];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const [rows] = await pool.query(query, params);
      return rows[0].count > 0;
    } catch (error) {
      logger.error(`Error al verificar relación propiedad-tercero: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener porcentaje total de propiedad por propiedad
   * @param {number} propertyId - ID de la propiedad
   * @param {number} excludeId - ID a excluir del cálculo (para actualizaciones)
   * @returns {Promise<number>} Porcentaje total
   */
  static async getTotalOwnershipPercentage(propertyId, excludeId = null) {
    try {
      let query = `SELECT COALESCE(SUM(ownership_percentage), 0) as total_percentage 
                   FROM Cr_property_owners WHERE property_id = ?`;
      let params = [propertyId];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const [rows] = await pool.query(query, params);
      return parseFloat(rows[0].total_percentage);
    } catch (error) {
      logger.error(`Error al obtener porcentaje total de propiedad: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transferir propiedad entre terceros
   * @param {number} propertyId - ID de la propiedad
   * @param {number} fromThirdPartyId - ID del tercero que transfiere
   * @param {number} toThirdPartyId - ID del tercero que recibe
   * @param {number} transferPercentage - Porcentaje a transferir
   * @param {number} userId - ID del usuario que realiza la operación
   * @returns {Promise<Object>} Resultado de la transferencia
   */
  static async transferOwnership(propertyId, fromThirdPartyId, toThirdPartyId, transferPercentage, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tercero origen sea propietario
      const [fromOwner] = await connection.query(
        `SELECT id, ownership_percentage, is_primary_owner FROM Cr_property_owners 
         WHERE property_id = ? AND third_party_id = ?`,
        [propertyId, fromThirdPartyId]
      );
      
      if (fromOwner.length === 0) {
        throw new Error('El tercero origen no es propietario de esta propiedad');
      }

      // Verificar que tenga suficiente porcentaje
      if (fromOwner[0].ownership_percentage < transferPercentage) {
        throw new Error(`El tercero origen solo posee ${fromOwner[0].ownership_percentage}% de la propiedad`);
      }

      // Actualizar porcentaje del tercero origen
      const newFromPercentage = fromOwner[0].ownership_percentage - transferPercentage;
      if (newFromPercentage === 0) {
        // Si queda en 0%, eliminar el registro
        await connection.query(
          `DELETE FROM Cr_property_owners WHERE id = ?`,
          [fromOwner[0].id]
        );
      } else {
        await connection.query(
          `UPDATE Cr_property_owners SET ownership_percentage = ? WHERE id = ?`,
          [newFromPercentage, fromOwner[0].id]
        );
      }

      // Verificar si el tercero destino ya es propietario
      const [toOwner] = await connection.query(
        `SELECT id, ownership_percentage FROM Cr_property_owners 
         WHERE property_id = ? AND third_party_id = ?`,
        [propertyId, toThirdPartyId]
      );

      if (toOwner.length > 0) {
        // Si ya es propietario, sumar el porcentaje
        const newToPercentage = toOwner[0].ownership_percentage + transferPercentage;
        await connection.query(
          `UPDATE Cr_property_owners SET ownership_percentage = ? WHERE id = ?`,
          [newToPercentage, toOwner[0].id]
        );
      } else {
        // Si no es propietario, crear nuevo registro
        await connection.query(
          `INSERT INTO Cr_property_owners (property_id, third_party_id, ownership_percentage, is_primary_owner, created_by)
           VALUES (?, ?, ?, FALSE, ?)`,
          [propertyId, toThirdPartyId, transferPercentage, userId]
        );
      }

      // Si el tercero origen era el principal y queda sin propiedad, asignar otro como principal
      if (fromOwner[0].is_primary_owner && newFromPercentage === 0) {
        await connection.query(
          `UPDATE Cr_property_owners SET is_primary_owner = TRUE 
           WHERE property_id = ? 
           ORDER BY ownership_percentage DESC LIMIT 1`,
          [propertyId]
        );
      }
      
      await connection.commit();
      
      return {
        success: true,
        transferred_percentage: transferPercentage,
        from_third_party_id: fromThirdPartyId,
        to_third_party_id: toThirdPartyId,
        property_id: propertyId
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al transferir propiedad: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de propietarios
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_ownerships,
          COUNT(DISTINCT property_id) as properties_with_owners,
          COUNT(DISTINCT third_party_id) as unique_owners,
          SUM(CASE WHEN is_primary_owner = TRUE THEN 1 ELSE 0 END) as primary_owners,
          AVG(ownership_percentage) as avg_ownership_percentage,
          MIN(ownership_percentage) as min_ownership_percentage,
          MAX(ownership_percentage) as max_ownership_percentage
        FROM Cr_property_owners
      `);

      const [ownershipDistribution] = await pool.query(`
        SELECT 
          CASE 
            WHEN ownership_percentage = 100 THEN 'Propietario único (100%)'
            WHEN ownership_percentage >= 50 THEN 'Propietario mayoritario (50-99%)'
            WHEN ownership_percentage >= 25 THEN 'Propietario significativo (25-49%)'
            ELSE 'Propietario minoritario (<25%)'
          END as ownership_type,
          COUNT(*) as count,
          AVG(ownership_percentage) as avg_percentage
        FROM Cr_property_owners
        GROUP BY 
          CASE 
            WHEN ownership_percentage = 100 THEN 'Propietario único (100%)'
            WHEN ownership_percentage >= 50 THEN 'Propietario mayoritario (50-99%)'
            WHEN ownership_percentage >= 25 THEN 'Propietario significativo (25-49%)'
            ELSE 'Propietario minoritario (<25%)'
          END
        ORDER BY avg_percentage DESC
      `);

      const [propertiesWithMultipleOwners] = await pool.query(`
        SELECT 
          COUNT(*) as properties_count,
          AVG(owners_count) as avg_owners_per_property
        FROM (
          SELECT property_id, COUNT(*) as owners_count
          FROM Cr_property_owners
          GROUP BY property_id
          HAVING COUNT(*) > 1
        ) as multiple_owners
      `);

      return {
        general: generalStats[0],
        ownership_distribution: ownershipDistribution,
        multiple_ownership: propertiesWithMultipleOwners[0] || { properties_count: 0, avg_owners_per_property: 0 }
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de propietarios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PropertyOwners; 