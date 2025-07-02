/**
 * Modelo para gestionar las oficinas de empresas
 * @module models/Configuracion/Empresa/Oficina/company_offices_Model
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar las oficinas de empresas en el sistema
 */
class Company_offices {
  /**
   * Obtener todas las oficinas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de oficinas
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT o.*, c.name as company_name 
        FROM company_offices o
        JOIN companies c ON o.company_id = c.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("o.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.company_id) {
        conditions.push("o.company_id = ?");
        queryParams.push(filters.company_id);
      }

      if (filters.address) {
        conditions.push("o.address LIKE ?");
        queryParams.push(`%${filters.address}%`);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY o.name";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.execute(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener oficinas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una oficina por su ID
   * @param {number} id - ID de la oficina
   * @returns {Promise<Object>} Datos de la oficina
   */
  static async getById(id) {
    try {
      const query = `
        SELECT o.*, c.name as company_name 
        FROM company_offices o
        JOIN companies c ON o.company_id = c.id
        WHERE o.id = ?
      `;
      
      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener oficina por ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva oficina
   * @param {Object} officeData - Datos de la oficina a crear
   * @returns {Promise<Object>} Oficina creada
   */
  static async create(officeData) {
    try {
      const { company_id, name, address, created_by } = officeData;
      
      const query = `
        INSERT INTO company_offices (company_id, name, address, created_by)
        VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(query, [company_id, name, address, created_by]);
      
      return {
        id: result.insertId,
        ...officeData
      };
    } catch (error) {
      logger.error(`Error al crear oficina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar una oficina existente
   * @param {number} id - ID de la oficina a actualizar
   * @param {Object} officeData - Nuevos datos de la oficina
   * @returns {Promise<Object>} Resultado de la actualización
   */
  static async update(id, officeData) {
    try {
      const { company_id, name, address } = officeData;
      
      const query = `
        UPDATE company_offices
        SET company_id = ?, name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [company_id, name, address, id]);
      
      return {
        id,
        affected: result.affectedRows,
        changed: result.changedRows
      };
    } catch (error) {
      logger.error(`Error al actualizar oficina: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar una oficina
   * @param {number} id - ID de la oficina a eliminar
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM company_offices WHERE id = ?';
      
      const [result] = await pool.execute(query, [id]);
      
      return {
        affected: result.affectedRows
      };
    } catch (error) {
      logger.error(`Error al eliminar oficina: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Company_offices; 