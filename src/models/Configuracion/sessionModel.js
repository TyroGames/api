/**
 * Modelo para gestionar las sesiones de usuario
 * @module models/Configuracion/sessionModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las sesiones de usuario en el sistema
 */
class Session {
  /**
   * Crear una nueva sesión de usuario
   * @param {Object} sessionData - Datos de la sesión
   * @returns {Promise<Object>} Sesión creada
   */
  static async create(sessionData) {
    try {
      const { user_id, token, ip_address, user_agent, expires_at } = sessionData;
      
      const [result] = await pool.query(
        `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, token, ip_address, user_agent, expires_at]
      );
      
      const id = result.insertId;
      return { id, ...sessionData };
    } catch (error) {
      logger.error(`Error al crear sesión de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una sesión por token
   * @param {string} token - Token de sesión
   * @returns {Promise<Object>} Sesión
   */
  static async getByToken(token) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, u.username, u.full_name, u.role_id
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > NOW()`,
        [token]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener sesión por token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todas las sesiones activas de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de sesiones
   */
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM user_sessions 
         WHERE user_id = ? AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener sesiones del usuario ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidar una sesión específica
   * @param {string} token - Token de sesión
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async invalidate(token) {
    try {
      // Establecer fecha de expiración en el pasado
      const [result] = await pool.query(
        `UPDATE user_sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR)
         WHERE token = ?`,
        [token]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al invalidar sesión: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidar todas las sesiones de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async invalidateAllForUser(userId) {
    try {
      const [result] = await pool.query(
        `UPDATE user_sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR)
         WHERE user_id = ?`,
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al invalidar sesiones del usuario ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpiar sesiones expiradas
   * @returns {Promise<number>} Número de sesiones eliminadas
   */
  static async cleanExpired() {
    try {
      const [result] = await pool.query(
        `DELETE FROM user_sessions WHERE expires_at < NOW()`
      );
      
      return result.affectedRows;
    } catch (error) {
      logger.error(`Error al limpiar sesiones expiradas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extender la duración de una sesión
   * @param {string} token - Token de sesión
   * @param {Date} newExpiryDate - Nueva fecha de expiración
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async extend(token, newExpiryDate) {
    try {
      const [result] = await pool.query(
        `UPDATE user_sessions SET expires_at = ?
         WHERE token = ? AND expires_at > NOW()`,
        [newExpiryDate, token]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`Error al extender sesión: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Session; 