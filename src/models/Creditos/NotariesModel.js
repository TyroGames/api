/**
 * Modelo para gestionar las notarías del sistema de créditos hipotecarios
 * @module models/Creditos/NotariesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las notarías en el sistema
 */
class Notaries {
  /**
   * Obtener todas las notarías con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de notarías
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT n.*, 
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT md.id) as documents_count
        FROM Cr_notaries n
        LEFT JOIN users u1 ON n.created_by = u1.id
        LEFT JOIN users u2 ON n.updated_by = u2.id
        LEFT JOIN Cr_mortgage_documents md ON n.id = md.notary_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.notary_code) {
        conditions.push("n.notary_code LIKE ?");
        queryParams.push(`%${filters.notary_code}%`);
      }

      if (filters.name) {
        conditions.push("n.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.city) {
        conditions.push("n.city LIKE ?");
        queryParams.push(`%${filters.city}%`);
      }

      if (filters.state) {
        conditions.push("n.state LIKE ?");
        queryParams.push(`%${filters.state}%`);
      }

      if (filters.is_active !== undefined) {
        conditions.push("n.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY n.id ORDER BY n.name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener notarías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una notaría por ID
   * @param {number} id - ID de la notaría
   * @returns {Promise<Object>} Notaría
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT n.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT md.id) as documents_count
         FROM Cr_notaries n
         LEFT JOIN users u1 ON n.created_by = u1.id
         LEFT JOIN users u2 ON n.updated_by = u2.id
         LEFT JOIN Cr_mortgage_documents md ON n.id = md.notary_id
         WHERE n.id = ?
         GROUP BY n.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener notaría con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una notaría por código
   * @param {string} code - Código de la notaría
   * @returns {Promise<Object>} Notaría
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT n.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name
         FROM Cr_notaries n
         LEFT JOIN users u1 ON n.created_by = u1.id
         LEFT JOIN users u2 ON n.updated_by = u2.id
         WHERE n.notary_code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener notaría con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener notarías por ciudad
   * @param {string} city - Ciudad
   * @returns {Promise<Array>} Lista de notarías
   */
  static async getByCity(city) {
    try {
      const [rows] = await pool.query(
        `SELECT n.*, 
                u1.username as created_by_name
         FROM Cr_notaries n
         LEFT JOIN users u1 ON n.created_by = u1.id
         WHERE n.city = ? AND n.is_active = TRUE
         ORDER BY n.name ASC`,
        [city]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener notarías por ciudad ${city}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo notarías activas
   * @returns {Promise<Array>} Lista de notarías activas
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT n.*, 
                u1.username as created_by_name
         FROM Cr_notaries n
         LEFT JOIN users u1 ON n.created_by = u1.id
         WHERE n.is_active = TRUE
         ORDER BY n.state ASC, n.city ASC, n.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener notarías activas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva notaría
   * @param {Object} notaryData - Datos de la notaría
   * @returns {Promise<Object>} Notaría creada
   */
  static async create(notaryData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el código no exista
      const [existingCode] = await connection.query(
        `SELECT id FROM Cr_notaries WHERE notary_code = ?`,
        [notaryData.notary_code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe una notaría con el código ${notaryData.notary_code}`);
      }

      // Verificar que el nombre no exista en la misma ciudad
      const [existingName] = await connection.query(
        `SELECT id FROM Cr_notaries WHERE name = ? AND city = ?`,
        [notaryData.name, notaryData.city]
      );
      
      if (existingName.length > 0) {
        throw new Error(`Ya existe una notaría con el nombre "${notaryData.name}" en ${notaryData.city}`);
      }
      
      // Insertar la notaría
      const [result] = await connection.query(
        `INSERT INTO Cr_notaries 
        (notary_code, name, address, city, state, phone, email, website, 
         is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notaryData.notary_code,
          notaryData.name,
          notaryData.address,
          notaryData.city,
          notaryData.state,
          notaryData.phone || null,
          notaryData.email || null,
          notaryData.website || null,
          notaryData.is_active !== false,
          notaryData.created_by
        ]
      );
      
      const notaryId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdNotary = await this.getById(notaryId);
      
      return createdNotary;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear notaría: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una notaría existente
   * @param {number} id - ID de la notaría
   * @param {Object} notaryData - Datos actualizados de la notaría
   * @returns {Promise<Object>} Notaría actualizada
   */
  static async update(id, notaryData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la notaría exista
      const [existingNotary] = await connection.query(
        `SELECT id FROM Cr_notaries WHERE id = ?`,
        [id]
      );
      
      if (existingNotary.length === 0) {
        throw new Error(`La notaría con ID ${id} no existe`);
      }

      // Verificar que el código no esté en uso por otra notaría
      if (notaryData.notary_code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM Cr_notaries WHERE notary_code = ? AND id != ?`,
          [notaryData.notary_code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otra notaría con el código ${notaryData.notary_code}`);
        }
      }

      // Verificar que el nombre no esté en uso por otra notaría en la misma ciudad
      if (notaryData.name && notaryData.city) {
        const [existingName] = await connection.query(
          `SELECT id FROM Cr_notaries WHERE name = ? AND city = ? AND id != ?`,
          [notaryData.name, notaryData.city, id]
        );
        
        if (existingName.length > 0) {
          throw new Error(`Ya existe otra notaría con el nombre "${notaryData.name}" en ${notaryData.city}`);
        }
      }
      
      // Actualizar la notaría
      await connection.query(
        `UPDATE Cr_notaries SET
         notary_code = ?,
         name = ?,
         address = ?,
         city = ?,
         state = ?,
         phone = ?,
         email = ?,
         website = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          notaryData.notary_code,
          notaryData.name,
          notaryData.address,
          notaryData.city,
          notaryData.state,
          notaryData.phone || null,
          notaryData.email || null,
          notaryData.website || null,
          notaryData.is_active !== false,
          notaryData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedNotary = await this.getById(id);
      
      return updatedNotary;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar notaría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de una notaría
   * @param {number} id - ID de la notaría
   * @param {boolean} isActive - Nuevo estado activo
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Notaría actualizada
   */
  static async toggleActive(id, isActive, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la notaría exista
      const [existingNotary] = await connection.query(
        `SELECT id, name, is_active FROM Cr_notaries WHERE id = ?`,
        [id]
      );
      
      if (existingNotary.length === 0) {
        throw new Error(`La notaría con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga documentos asociados activos
      if (!isActive) {
        const [activeDocuments] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_mortgage_documents 
           WHERE notary_id = ? AND status IN ('uploaded', 'validated')`,
          [id]
        );
        
        if (activeDocuments[0].count > 0) {
          throw new Error('No se puede desactivar una notaría que tiene documentos activos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_notaries SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedNotary = await this.getById(id);
      
      return updatedNotary;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado de la notaría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una notaría (solo si no tiene documentos asociados)
   * @param {number} id - ID de la notaría
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la notaría exista
      const [existingNotary] = await connection.query(
        `SELECT id, name FROM Cr_notaries WHERE id = ?`,
        [id]
      );
      
      if (existingNotary.length === 0) {
        throw new Error(`La notaría con ID ${id} no existe`);
      }

      // Verificar que no tenga documentos asociados
      const [associatedDocuments] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgage_documents WHERE notary_id = ?`,
        [id]
      );
      
      if (associatedDocuments[0].count > 0) {
        throw new Error(`No se puede eliminar la notaría "${existingNotary[0].name}" porque tiene ${associatedDocuments[0].count} documento(s) asociado(s)`);
      }
      
      // Eliminar la notaría
      await connection.query(`DELETE FROM Cr_notaries WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { id, deleted: true, name: existingNotary[0].name };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar notaría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un código de notaría está disponible
   * @param {string} code - Código a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isCodeAvailable(code, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_notaries WHERE notary_code = ?`;
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
   * Obtener ciudades únicas de las notarías
   * @returns {Promise<Array>} Lista de ciudades
   */
  static async getCities() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT city, state, COUNT(*) as notaries_count
         FROM Cr_notaries 
         WHERE is_active = TRUE
         GROUP BY city, state
         ORDER BY state ASC, city ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener ciudades de notarías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estados únicos de las notarías
   * @returns {Promise<Array>} Lista de estados
   */
  static async getStates() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT state, COUNT(*) as notaries_count
         FROM Cr_notaries 
         WHERE is_active = TRUE
         GROUP BY state
         ORDER BY state ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener estados de notarías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notarías
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_notaries,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_notaries,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_notaries,
          COUNT(DISTINCT state) as different_states,
          COUNT(DISTINCT city) as different_cities
        FROM Cr_notaries
      `);

      const [byState] = await pool.query(`
        SELECT 
          state,
          COUNT(*) as notaries_count,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count,
          COUNT(DISTINCT city) as cities_count
        FROM Cr_notaries
        GROUP BY state
        ORDER BY notaries_count DESC
      `);

      const [withDocuments] = await pool.query(`
        SELECT 
          n.name as notary_name,
          n.city,
          n.state,
          COUNT(md.id) as documents_count
        FROM Cr_notaries n
        LEFT JOIN Cr_mortgage_documents md ON n.id = md.notary_id
        WHERE n.is_active = TRUE
        GROUP BY n.id, n.name, n.city, n.state
        HAVING documents_count > 0
        ORDER BY documents_count DESC
        LIMIT 10
      `);

      return {
        general: stats[0],
        by_state: byState,
        top_with_documents: withDocuments
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de notarías: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Notaries;