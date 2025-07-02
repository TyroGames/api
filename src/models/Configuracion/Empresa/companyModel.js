/**
 * Modelo para gestionar las empresas
 * @module models/Configuracion/Empresa/companyModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');

/**
 * Clase para gestionar las empresas en el sistema
 */
class Company {
  /**
   * Obtener todas las empresas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de empresas
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT c.*, 
               curr.name as currency_name, 
               curr.symbol as currency_symbol
        FROM companies c
        LEFT JOIN currencies curr ON c.currency_id = curr.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("c.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.tax_id) {
        conditions.push("c.tax_id LIKE ?");
        queryParams.push(`%${filters.tax_id}%`);
      }

      if (filters.currency_id) {
        conditions.push("c.currency_id = ?");
        queryParams.push(filters.currency_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY c.name";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.execute(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener empresas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una empresa por ID
   * @param {number} id - ID de la empresa
   * @returns {Promise<Object>} Empresa
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT c.*, 
                curr.name as currency_name, 
                curr.symbol as currency_symbol
         FROM companies c
         LEFT JOIN currencies curr ON c.currency_id = curr.id
         WHERE c.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener empresa con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva empresa
   * @param {Object} companyData - Datos de la empresa
   * @returns {Promise<Object>} Empresa creada
   */
  static async create(companyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO companies 
        (name, legal_name, tax_id, identification_type, identification_number, 
         verification_digit, address, phone, email, website, logo_path, 
         fiscal_year_start, currency_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyData.name,
          companyData.legal_name,
          companyData.tax_id,
          companyData.identification_type,
          companyData.identification_number,
          companyData.verification_digit,
          companyData.address,
          companyData.phone,
          companyData.email,
          companyData.website,
          companyData.logo_path,
          companyData.fiscal_year_start,
          companyData.currency_id
        ]
      );
      
      const companyId = result.insertId;
      
      await connection.commit();
      
      return { id: companyId, ...companyData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear empresa: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una empresa existente
   * @param {number} id - ID de la empresa
   * @param {Object} companyData - Datos actualizados de la empresa
   * @returns {Promise<Object>} Empresa actualizada
   */
  static async update(id, companyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la empresa exista
      const [companyCheck] = await connection.query(
        `SELECT id FROM companies WHERE id = ?`,
        [id]
      );
      
      if (!companyCheck.length) {
        throw new Error(`La empresa con ID ${id} no existe`);
      }
      
      // Actualizar la empresa
      await connection.query(
        `UPDATE companies SET
         name = ?,
         legal_name = ?,
         tax_id = ?,
         identification_type = ?,
         identification_number = ?,
         verification_digit = ?,
         address = ?,
         phone = ?,
         email = ?,
         website = ?,
         logo_path = ?,
         fiscal_year_start = ?,
         currency_id = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          companyData.name,
          companyData.legal_name,
          companyData.tax_id,
          companyData.identification_type,
          companyData.identification_number,
          companyData.verification_digit,
          companyData.address,
          companyData.phone,
          companyData.email,
          companyData.website,
          companyData.logo_path,
          companyData.fiscal_year_start,
          companyData.currency_id,
          id
        ]
      );
      
      await connection.commit();
      
      return { id, ...companyData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar empresa ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una empresa
   * @param {number} id - ID de la empresa
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la empresa exista
      const [companyCheck] = await connection.query(
        `SELECT id FROM companies WHERE id = ?`,
        [id]
      );
      
      if (!companyCheck.length) {
        throw new Error(`La empresa con ID ${id} no existe`);
      }
      
      // Verificar si existen registros relacionados antes de eliminar
      // Por ejemplo, verificar fiscal_years, fiscal_periods, etc.
      const [relatedRecords] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_years WHERE company_id = ?`,
        [id]
      );
      
      if (relatedRecords[0].count > 0) {
        throw new Error(`No se puede eliminar la empresa porque tiene registros relacionados`);
      }
      
      // Eliminar la empresa
      await connection.query(
        `DELETE FROM companies WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar empresa ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Company; 