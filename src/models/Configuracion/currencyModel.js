/**
 * Modelo para gestionar las monedas del sistema
 * @module models/Configuracion/currencyModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las monedas en el sistema
 */
class Currency {
  /**
   * Obtener todas las monedas con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de monedas
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT id, code, name, symbol, is_default, created_at
        FROM currencies
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

      if (filters.symbol) {
        conditions.push("symbol LIKE ?");
        queryParams.push(`%${filters.symbol}%`);
      }

      if (filters.is_default !== undefined) {
        conditions.push("is_default = ?");
        queryParams.push(filters.is_default);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY name ASC";

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
        `SELECT id, code, name, symbol, is_default, created_at
         FROM currencies 
         WHERE id = ?`,
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
        `SELECT id, code, name, symbol, is_default, created_at
         FROM currencies 
         WHERE code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener moneda con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener la moneda por defecto
   * @returns {Promise<Object>} Moneda por defecto
   */
  static async getDefault() {
    try {
      const [rows] = await pool.query(
        `SELECT id, code, name, symbol, is_default, created_at
         FROM currencies 
         WHERE is_default = true
         LIMIT 1`
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener moneda por defecto: ${error.message}`);
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
      
      // Verificar que no exista una moneda con el mismo código
      const [existingCurrency] = await connection.query(
        `SELECT id FROM currencies WHERE code = ?`,
        [currencyData.code]
      );
      
      if (existingCurrency.length > 0) {
        throw new Error(`Ya existe una moneda con el código ${currencyData.code}`);
      }
      
      // Si se establece como moneda por defecto, quitar el flag de la anterior
      if (currencyData.is_default) {
        await connection.query(
          `UPDATE currencies SET is_default = false WHERE is_default = true`
        );
      }
      
      // Insertar la nueva moneda
      const [result] = await connection.query(
        `INSERT INTO currencies (code, name, symbol, is_default)
         VALUES (?, ?, ?, ?)`,
        [
          currencyData.code.toUpperCase(),
          currencyData.name,
          currencyData.symbol,
          currencyData.is_default || false
        ]
      );
      
      await connection.commit();
      
      return {
        id: result.insertId,
        code: currencyData.code.toUpperCase(),
        name: currencyData.name,
        symbol: currencyData.symbol,
        is_default: currencyData.is_default || false
      };
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
      const [existingCurrency] = await connection.query(
        `SELECT id, code FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (existingCurrency.length === 0) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // Verificar que no exista otra moneda con el mismo código (si se está cambiando)
      if (currencyData.code && currencyData.code !== existingCurrency[0].code) {
        const [duplicateCheck] = await connection.query(
          `SELECT id FROM currencies WHERE code = ? AND id != ?`,
          [currencyData.code, id]
        );
        
        if (duplicateCheck.length > 0) {
          throw new Error(`Ya existe otra moneda con el código ${currencyData.code}`);
        }
      }
      
      // Si se establece como moneda por defecto, quitar el flag de las otras
      if (currencyData.is_default) {
        await connection.query(
          `UPDATE currencies SET is_default = false WHERE is_default = true AND id != ?`,
          [id]
        );
      }
      
      // Actualizar la moneda
      await connection.query(
        `UPDATE currencies 
         SET code = ?, name = ?, symbol = ?, is_default = ?
         WHERE id = ?`,
        [
          currencyData.code?.toUpperCase() || existingCurrency[0].code,
          currencyData.name,
          currencyData.symbol,
          currencyData.is_default || false,
          id
        ]
      );
      
      await connection.commit();
      
      return {
        id,
        code: currencyData.code?.toUpperCase() || existingCurrency[0].code,
        name: currencyData.name,
        symbol: currencyData.symbol,
        is_default: currencyData.is_default || false
      };
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
      const [existingCurrency] = await connection.query(
        `SELECT id, is_default FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (existingCurrency.length === 0) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // No permitir eliminar la moneda por defecto
      if (existingCurrency[0].is_default) {
        throw new Error('No se puede eliminar la moneda por defecto');
      }
      
      // Verificar que no esté siendo utilizada en otras tablas
      const [companyUsage] = await connection.query(
        `SELECT COUNT(*) as count FROM companies WHERE currency_id = ?`,
        [id]
      );
      
      if (companyUsage[0].count > 0) {
        throw new Error('No se puede eliminar la moneda porque está siendo utilizada por una o más empresas');
      }
      
      const [bankAccountUsage] = await connection.query(
        `SELECT COUNT(*) as count FROM bank_accounts WHERE currency_id = ?`,
        [id]
      );
      
      if (bankAccountUsage[0].count > 0) {
        throw new Error('No se puede eliminar la moneda porque está siendo utilizada por una o más cuentas bancarias');
      }
      
      // Verificar uso en documentos legales
      const [documentUsage] = await connection.query(
        `SELECT COUNT(*) as count FROM legal_documents WHERE currency_id = ?`,
        [id]
      );
      
      if (documentUsage[0].count > 0) {
        throw new Error('No se puede eliminar la moneda porque está siendo utilizada por uno o más documentos legales');
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
  static async setAsDefault(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la moneda exista
      const [existingCurrency] = await connection.query(
        `SELECT id FROM currencies WHERE id = ?`,
        [id]
      );
      
      if (existingCurrency.length === 0) {
        throw new Error(`La moneda con ID ${id} no existe`);
      }
      
      // Quitar el flag de todas las monedas
      await connection.query(
        `UPDATE currencies SET is_default = false WHERE is_default = true`
      );
      
      // Establecer la nueva moneda por defecto
      await connection.query(
        `UPDATE currencies SET is_default = true WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, is_default: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al establecer moneda por defecto ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de uso de monedas
   * @returns {Promise<Array>} Estadísticas de uso
   */
  static async getUsageStats() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          c.id,
          c.code,
          c.name,
          c.symbol,
          c.is_default,
          COALESCE(companies.count, 0) as companies_count,
          COALESCE(bank_accounts.count, 0) as bank_accounts_count,
          COALESCE(legal_documents.count, 0) as legal_documents_count,
          (COALESCE(companies.count, 0) + COALESCE(bank_accounts.count, 0) + COALESCE(legal_documents.count, 0)) as total_usage
        FROM currencies c
        LEFT JOIN (
          SELECT currency_id, COUNT(*) as count 
          FROM companies 
          GROUP BY currency_id
        ) companies ON c.id = companies.currency_id
        LEFT JOIN (
          SELECT currency_id, COUNT(*) as count 
          FROM bank_accounts 
          GROUP BY currency_id
        ) bank_accounts ON c.id = bank_accounts.currency_id
        LEFT JOIN (
          SELECT currency_id, COUNT(*) as count 
          FROM legal_documents 
          WHERE currency_id IS NOT NULL
          GROUP BY currency_id
        ) legal_documents ON c.id = legal_documents.currency_id
        ORDER BY total_usage DESC, c.name ASC
      `);
      
      return rows;
    } catch (error) {
      logger.error(`Error al obtener estadísticas de uso de monedas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Currency; 