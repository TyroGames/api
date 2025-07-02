/**
 * Modelo para gestionar las monedas
 * @module models/Contabilidad/Configuracion/Monedas/currencyModel
 */

const { loggers } = require("winston");
const { pool } = require("../../../../config/db");





/**
 * Clase para gestionar las monedas en el sistema
 */
class Currency {
  /**
   * Obtener todas las monedas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de monedas
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT * FROM currencies
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.code) {
        conditions.push("code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.name) {
        conditions.push("name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.is_default !== undefined) {
        conditions.push("is_default = ?");
        queryParams.push(filters.is_default);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY is_default DESC, name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener monedas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una moneda por ID
   * @param {number} id - ID de la moneda
   * @returns {Promise<Object>} Moneda
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM currencies WHERE id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener moneda con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una moneda por código
   * @param {string} code - Código de la moneda
   * @returns {Promise<Object>} Moneda
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM currencies WHERE code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener moneda con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener la moneda predeterminada
   * @returns {Promise<Object>} Moneda predeterminada
   */
  static async getDefault() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM currencies WHERE is_default = true LIMIT 1`
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener moneda predeterminada: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva moneda
   * @param {Object} currencyData - Datos de la moneda
   * @returns {Promise<Object>} Moneda creada
   */
  static async create(currencyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Si la moneda se marca como predeterminada, actualizar las demás
      if (currencyData.is_default) {
        await connection.query(
          `UPDATE currencies SET is_default = false WHERE is_default = true`
        );
      }
      
      // Insertar la nueva moneda
      const [result] = await connection.query(
        `INSERT INTO currencies 
        (code, name, symbol, is_default)
        VALUES (?, ?, ?, ?)`,
        [
          currencyData.code,
          currencyData.name,
          currencyData.symbol,
          currencyData.is_default || false
        ]
      );
      
      const currencyId = result.insertId;
      await connection.commit();
      
      return { id: currencyId, ...currencyData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear moneda: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una moneda existente
   * @param {number} id - ID de la moneda
   * @param {Object} currencyData - Datos actualizados de la moneda
   * @returns {Promise<Object>} Moneda actualizada
   */
  static async update(id, currencyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la moneda exista
      const [currencyCheck] = await connection.query(
        `SELECT * FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (!currencyCheck.length) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // Si la moneda se marca como predeterminada, actualizar las demás
      if (currencyData.is_default) {
        await connection.query(
          `UPDATE currencies SET is_default = false WHERE is_default = true AND id != ?`,
          [id]
        );
      }
      
      // Actualizar la moneda
      await connection.query(
        `UPDATE currencies SET
         code = ?,
         name = ?,
         symbol = ?,
         is_default = ?
         WHERE id = ?`,
        [
          currencyData.code,
          currencyData.name,
          currencyData.symbol,
          currencyData.is_default || false,
          id
        ]
      );
      
      await connection.commit();
      
      return { id, ...currencyData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar moneda ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una moneda
   * @param {number} id - ID de la moneda
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la moneda exista
      const [currencyCheck] = await connection.query(
        `SELECT * FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (!currencyCheck.length) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // No permitir eliminar la moneda predeterminada
      if (currencyCheck[0].is_default) {
        throw new Error('No se puede eliminar la moneda predeterminada');
      }
      
      // Verificar si la moneda está en uso
      const [inUseCheck] = await connection.query(
        `SELECT COUNT(*) as count FROM (
           SELECT 1 FROM companies WHERE currency_id = ? 
           UNION ALL 
           SELECT 1 FROM exchange_rates WHERE currency_id = ?
         ) as usage_check`,
        [id, id]
      );
      
      if (inUseCheck[0].count > 0) {
        throw new Error('No se puede eliminar la moneda porque está en uso');
      }
      
      // Eliminar la moneda
      await connection.query(
        `DELETE FROM currencies WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar moneda ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Establecer una moneda como predeterminada
   * @param {number} id - ID de la moneda
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async setDefault(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la moneda exista
      const [currencyCheck] = await connection.query(
        `SELECT * FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (!currencyCheck.length) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // Actualizar todas las monedas para quitar la marca de predeterminada
      await connection.query(
        `UPDATE currencies SET is_default = false WHERE is_default = true`
      );
      
      // Establecer la moneda seleccionada como predeterminada
      await connection.query(
        `UPDATE currencies SET is_default = true WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { 
        id, 
        is_default: true,
        message: `La moneda ${currencyCheck[0].name} ha sido establecida como predeterminada`
      };
    } catch (error) {
      await connection.rollback();
      loggers.error(`Error al establecer moneda predeterminada ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Currency; 