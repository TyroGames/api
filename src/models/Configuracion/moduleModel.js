/**
 * Modelo para gestionar los módulos del sistema
 * @module models/Configuracion/moduleModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los módulos del sistema
 */
class Module {
  /**
   * Obtener todos los módulos con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de módulos
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT m.*, parent.name as parent_name
        FROM modules m
        LEFT JOIN modules parent ON m.parent_id = parent.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("m.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.display_name) {
        conditions.push("m.display_name LIKE ?");
        queryParams.push(`%${filters.display_name}%`);
      }

      if (filters.is_active !== undefined) {
        conditions.push("m.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.parent_id) {
        conditions.push("m.parent_id = ?");
        queryParams.push(filters.parent_id);
      }

      if (filters.requires_license !== undefined) {
        conditions.push("m.requires_license = ?");
        queryParams.push(filters.requires_license);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY m.order_index ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener módulos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un módulo por ID
   * @param {number} id - ID del módulo
   * @returns {Promise<Object>} Módulo
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, parent.name as parent_name
         FROM modules m
         LEFT JOIN modules parent ON m.parent_id = parent.id
         WHERE m.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener módulo con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un módulo por nombre
   * @param {string} name - Nombre del módulo
   * @returns {Promise<Object>} Módulo
   */
  static async getByName(name) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, parent.name as parent_name
         FROM modules m
         LEFT JOIN modules parent ON m.parent_id = parent.id
         WHERE m.name = ?`,
        [name]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener módulo con nombre ${name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo módulo
   * @param {Object} moduleData - Datos del módulo
   * @returns {Promise<Object>} Módulo creado
   */
  static async create(moduleData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO modules 
        (name, display_name, description, icon, route, parent_id, 
         order_index, is_active, requires_license)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          moduleData.name,
          moduleData.display_name,
          moduleData.description,
          moduleData.icon,
          moduleData.route,
          moduleData.parent_id,
          moduleData.order_index || 0,
          moduleData.is_active !== undefined ? moduleData.is_active : true,
          moduleData.requires_license !== undefined ? moduleData.requires_license : false
        ]
      );
      
      const moduleId = result.insertId;
      
      await connection.commit();
      
      return { id: moduleId, ...moduleData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear módulo: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un módulo existente
   * @param {number} id - ID del módulo
   * @param {Object} moduleData - Datos actualizados del módulo
   * @returns {Promise<Object>} Módulo actualizado
   */
  static async update(id, moduleData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      await connection.query(
        `UPDATE modules SET
         name = ?,
         display_name = ?,
         description = ?,
         icon = ?,
         route = ?,
         parent_id = ?,
         order_index = ?,
         is_active = ?,
         requires_license = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          moduleData.name,
          moduleData.display_name,
          moduleData.description,
          moduleData.icon,
          moduleData.route,
          moduleData.parent_id,
          moduleData.order_index,
          moduleData.is_active,
          moduleData.requires_license,
          id
        ]
      );
      
      await connection.commit();
      
      return { id, ...moduleData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar módulo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar el estado activo/inactivo de un módulo
   * @param {number} id - ID del módulo
   * @param {boolean} isActive - Nuevo estado
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async changeStatus(id, isActive) {
    try {
      await pool.query(
        `UPDATE modules SET is_active = ?, updated_at = NOW() WHERE id = ?`,
        [isActive, id]
      );
      
      return { 
        id, 
        is_active: isActive,
        update_date: new Date()
      };
    } catch (error) {
      logger.error(`Error al cambiar estado del módulo ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un módulo
   * @param {number} id - ID del módulo
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si hay módulos hijos
      const [childModules] = await connection.query(
        `SELECT COUNT(*) as count FROM modules WHERE parent_id = ?`,
        [id]
      );
      
      if (childModules[0].count > 0) {
        throw new Error('No se puede eliminar un módulo que tiene submódulos asociados');
      }
      
      // Verificar si hay permisos asociados al módulo
      const [permissions] = await connection.query(
        `SELECT COUNT(*) as count FROM permissions WHERE module = (SELECT name FROM modules WHERE id = ?)`,
        [id]
      );
      
      if (permissions[0].count > 0) {
        throw new Error('No se puede eliminar un módulo que tiene permisos asociados');
      }
      
      // Eliminar el módulo
      await connection.query(
        `DELETE FROM modules WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar módulo ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener la estructura jerárquica de módulos
   * @returns {Promise<Array>} Estructura jerárquica de módulos
   */
  static async getModuleTree() {
    try {
      // Primero obtenemos todos los módulos
      const [allModules] = await pool.query(
        `SELECT * FROM modules ORDER BY order_index ASC`
      );
      
      // Función para construir el árbol de forma recursiva
      const buildTree = (modules, parentId = null) => {
        return modules
          .filter(module => module.parent_id === parentId)
          .map(module => ({
            ...module,
            children: buildTree(modules, module.id)
          }));
      };
      
      // Construir el árbol desde los módulos raíz (sin padre)
      const moduleTree = buildTree(allModules);
      
      return moduleTree;
    } catch (error) {
      logger.error(`Error al obtener estructura de módulos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reordenar un módulo
   * @param {number} id - ID del módulo
   * @param {number} newOrder - Nuevo orden
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async reorder(id, newOrder) {
    try {
      await pool.query(
        `UPDATE modules SET order_index = ?, updated_at = NOW() WHERE id = ?`,
        [newOrder, id]
      );
      
      return { 
        id, 
        order_index: newOrder,
        update_date: new Date()
      };
    } catch (error) {
      logger.error(`Error al reordenar módulo ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Module; 