/**
 * Modelo para gestionar los permisos del sistema
 * @module models/Configuracion/permissionModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los permisos en el sistema
 */
class Permission {
  /**
   * Obtener todos los permisos
   * @param {Object} filters - Filtros opcionales (módulo, etc.)
   * @returns {Promise<Array>} Lista de permisos
   */
  static async getAll(filters = {}) {
    try {
      let query = `SELECT * FROM permissions`;
      const queryParams = [];
      
      // Aplicar filtros si existen
      if (filters.module) {
        query += ` WHERE module = ?`;
        queryParams.push(filters.module);
      }
      
      query += ` ORDER BY module, name`;
      
      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener permisos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un permiso por ID
   * @param {number} id - ID del permiso
   * @returns {Promise<Object>} Permiso
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM permissions WHERE id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener permiso con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo permiso
   * @param {Object} permissionData - Datos del permiso
   * @returns {Promise<Object>} Permiso creado
   */
  static async create(permissionData) {
    try {
      const { name, description, module } = permissionData;
      
      const [result] = await pool.query(
        `INSERT INTO permissions (name, description, module) VALUES (?, ?, ?)`,
        [name, description, module]
      );
      
      const id = result.insertId;
      return { id, name, description, module };
    } catch (error) {
      logger.error(`Error al crear permiso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un permiso existente
   * @param {number} id - ID del permiso
   * @param {Object} permissionData - Datos actualizados del permiso
   * @returns {Promise<Object>} Permiso actualizado
   */
  static async update(id, permissionData) {
    try {
      const { name, description, module } = permissionData;
      
      await pool.query(
        `UPDATE permissions SET name = ?, description = ?, module = ? WHERE id = ?`,
        [name, description, module, id]
      );
      
      return { id, ...permissionData };
    } catch (error) {
      logger.error(`Error al actualizar permiso ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un permiso
   * @param {number} id - ID del permiso
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el permiso está asignado a algún rol
      const [roleCheck] = await connection.query(
        `SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?`,
        [id]
      );
      
      if (roleCheck[0].count > 0) {
        throw new Error('No se puede eliminar el permiso porque está asignado a uno o más roles');
      }
      
      // Eliminar el permiso
      await connection.query(
        `DELETE FROM permissions WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar permiso ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener permisos por módulo
   * @param {string} module - Nombre del módulo
   * @returns {Promise<Array>} Lista de permisos por módulo
   */
  static async getByModule(module) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM permissions WHERE module = ? ORDER BY name`,
        [module]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener permisos del módulo ${module}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los módulos disponibles
   * @returns {Promise<Array>} Lista de módulos
   */
  static async getAllModules() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT module FROM permissions ORDER BY module`
      );
      return rows.map(row => row.module);
    } catch (error) {
      logger.error(`Error al obtener módulos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Permission; 