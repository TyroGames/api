/**
 * Modelo para gestionar los roles de usuario
 * @module models/Configuracion/roleModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los roles en el sistema
 */
class Role {
  /**
   * Obtener todos los roles
   * @returns {Promise<Array>} Lista de roles
   */
  static async getAll() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM roles ORDER BY name`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener roles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un rol por ID
   * @param {number} id - ID del rol
   * @returns {Promise<Object>} Rol
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM roles WHERE id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener rol con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo rol
   * @param {Object} roleData - Datos del rol
   * @returns {Promise<Object>} Rol creado
   */
  static async create(roleData) {
    try {
      const { name, description } = roleData;
      
      const [result] = await pool.query(
        `INSERT INTO roles (name, description) VALUES (?, ?)`,
        [name, description]
      );
      
      const id = result.insertId;
      return { id, name, description };
    } catch (error) {
      logger.error(`Error al crear rol: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un rol existente
   * @param {number} id - ID del rol
   * @param {Object} roleData - Datos actualizados del rol
   * @returns {Promise<Object>} Rol actualizado
   */
  static async update(id, roleData) {
    try {
      const { name, description } = roleData;
      
      await pool.query(
        `UPDATE roles SET name = ?, description = ? WHERE id = ?`,
        [name, description, id]
      );
      
      return { id, ...roleData };
    } catch (error) {
      logger.error(`Error al actualizar rol ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un rol
   * @param {number} id - ID del rol
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    try {
      // Verificar que no haya usuarios asignados a este rol
      const [userCheck] = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role_id = ?`,
        [id]
      );
      
      if (userCheck[0].count > 0) {
        throw new Error('No se puede eliminar el rol porque tiene usuarios asignados');
      }
      
      await pool.query(
        `DELETE FROM role_permissions WHERE role_id = ?`,
        [id]
      );
      
      await pool.query(
        `DELETE FROM roles WHERE id = ?`,
        [id]
      );
      
      return { id, deleted: true };
    } catch (error) {
      logger.error(`Error al eliminar rol ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener permisos asociados a un rol
   * @param {number} roleId - ID del rol
   * @returns {Promise<Array>} Lista de permisos
   */
  static async getPermissions(roleId) {
    try {
      const [rows] = await pool.query(
        `SELECT p.* 
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = ?
         ORDER BY p.module, p.name`,
        [roleId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener permisos del rol ${roleId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asignar permisos a un rol
   * @param {number} roleId - ID del rol
   * @param {Array<number>} permissionIds - IDs de los permisos
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async assignPermissions(roleId, permissionIds) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Eliminar permisos actuales
      await connection.query(
        `DELETE FROM role_permissions WHERE role_id = ?`,
        [roleId]
      );
      
      // Asignar nuevos permisos
      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map(permId => [roleId, permId]);
        
        await connection.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
          [values]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al asignar permisos al rol ${roleId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Role; 