/**
 * Modelo para gestionar las categorías de documentos del sistema de créditos
 * @module models/Creditos/DocumentCategoriesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar las categorías de documentos en el sistema
 */
class DocumentCategories {
  /**
   * Obtener todas las categorías con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de categorías
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT dc.*, 
               u.username as created_by_name,
               COUNT(DISTINCT dt.id) as document_types_count
        FROM Cr_document_categories dc
        LEFT JOIN users u ON dc.created_by = u.id
        LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id AND dt.is_active = TRUE
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("dc.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.is_required !== undefined) {
        conditions.push("dc.is_required = ?");
        queryParams.push(filters.is_required);
      }

      if (filters.is_active !== undefined) {
        conditions.push("dc.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.has_validation_period !== undefined) {
        if (filters.has_validation_period) {
          conditions.push("dc.validation_period_days IS NOT NULL");
        } else {
          conditions.push("dc.validation_period_days IS NULL");
        }
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY dc.id ORDER BY dc.name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener categorías de documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object>} Categoría
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT dc.*, 
                u.username as created_by_name,
                COUNT(DISTINCT dt.id) as document_types_count
         FROM Cr_document_categories dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id AND dt.is_active = TRUE
         WHERE dc.id = ?
         GROUP BY dc.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener categoría con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una categoría por nombre
   * @param {string} name - Nombre de la categoría
   * @returns {Promise<Object>} Categoría
   */
  static async getByName(name) {
    try {
      const [rows] = await pool.query(
        `SELECT dc.*, 
                u.username as created_by_name,
                COUNT(DISTINCT dt.id) as document_types_count
         FROM Cr_document_categories dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id AND dt.is_active = TRUE
         WHERE dc.name = ?
         GROUP BY dc.id`,
        [name]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener categoría con nombre ${name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo categorías activas
   * @returns {Promise<Array>} Lista de categorías activas
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT dc.*, 
                u.username as created_by_name,
                COUNT(DISTINCT dt.id) as document_types_count
         FROM Cr_document_categories dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id AND dt.is_active = TRUE
         WHERE dc.is_active = TRUE
         GROUP BY dc.id
         ORDER BY dc.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener categorías activas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener categorías requeridas
   * @returns {Promise<Array>} Lista de categorías requeridas
   */
  static async getRequired() {
    try {
      const [rows] = await pool.query(
        `SELECT dc.*, 
                u.username as created_by_name,
                COUNT(DISTINCT dt.id) as document_types_count
         FROM Cr_document_categories dc
         LEFT JOIN users u ON dc.created_by = u.id
         LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id AND dt.is_active = TRUE
         WHERE dc.is_required = TRUE AND dc.is_active = TRUE
         GROUP BY dc.id
         ORDER BY dc.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener categorías requeridas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva categoría
   * @param {Object} categoryData - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  static async create(categoryData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el nombre no exista
      const [existingName] = await connection.query(
        `SELECT id FROM Cr_document_categories WHERE name = ?`,
        [categoryData.name]
      );
      
      if (existingName.length > 0) {
        throw new Error(`Ya existe una categoría con el nombre "${categoryData.name}"`);
      }
      
      // Insertar la categoría
      const [result] = await connection.query(
        `INSERT INTO Cr_document_categories 
        (name, description, is_required, validation_period_days, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          categoryData.name,
          categoryData.description || null,
          categoryData.is_required !== false,
          categoryData.validation_period_days || null,
          categoryData.is_active !== false,
          categoryData.created_by
        ]
      );
      
      const categoryId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdCategory = await this.getById(categoryId);
      
      return createdCategory;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear categoría: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una categoría existente
   * @param {number} id - ID de la categoría
   * @param {Object} categoryData - Datos actualizados de la categoría
   * @returns {Promise<Object>} Categoría actualizada
   */
  static async update(id, categoryData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la categoría exista
      const [existingCategory] = await connection.query(
        `SELECT id FROM Cr_document_categories WHERE id = ?`,
        [id]
      );
      
      if (existingCategory.length === 0) {
        throw new Error(`La categoría con ID ${id} no existe`);
      }

      // Verificar que el nombre no esté en uso por otra categoría
      if (categoryData.name) {
        const [existingName] = await connection.query(
          `SELECT id FROM Cr_document_categories WHERE name = ? AND id != ?`,
          [categoryData.name, id]
        );
        
        if (existingName.length > 0) {
          throw new Error(`Ya existe otra categoría con el nombre "${categoryData.name}"`);
        }
      }
      
      // Actualizar la categoría
      await connection.query(
        `UPDATE Cr_document_categories SET
         name = ?,
         description = ?,
         is_required = ?,
         validation_period_days = ?,
         is_active = ?
         WHERE id = ?`,
        [
          categoryData.name,
          categoryData.description,
          categoryData.is_required !== false,
          categoryData.validation_period_days,
          categoryData.is_active !== false,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedCategory = await this.getById(id);
      
      return updatedCategory;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar categoría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de una categoría
   * @param {number} id - ID de la categoría
   * @param {boolean} isActive - Nuevo estado activo
   * @returns {Promise<Object>} Categoría actualizada
   */
  static async toggleActive(id, isActive) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la categoría exista
      const [existingCategory] = await connection.query(
        `SELECT id, name, is_active FROM Cr_document_categories WHERE id = ?`,
        [id]
      );
      
      if (existingCategory.length === 0) {
        throw new Error(`La categoría con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga tipos de documentos activos
      if (!isActive) {
        const [activeDocumentTypes] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_document_types 
           WHERE category_id = ? AND is_active = TRUE`,
          [id]
        );
        
        if (activeDocumentTypes[0].count > 0) {
          throw new Error('No se puede desactivar una categoría que tiene tipos de documentos activos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_document_categories SET is_active = ? WHERE id = ?`,
        [isActive, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedCategory = await this.getById(id);
      
      return updatedCategory;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado de la categoría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una categoría (solo si no tiene tipos de documentos asociados)
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la categoría exista
      const [existingCategory] = await connection.query(
        `SELECT id, name FROM Cr_document_categories WHERE id = ?`,
        [id]
      );
      
      if (existingCategory.length === 0) {
        throw new Error(`La categoría con ID ${id} no existe`);
      }

      // Verificar que no tenga tipos de documentos asociados
      const [associatedDocumentTypes] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_document_types WHERE category_id = ?`,
        [id]
      );
      
      if (associatedDocumentTypes[0].count > 0) {
        throw new Error(`No se puede eliminar la categoría "${existingCategory[0].name}" porque tiene ${associatedDocumentTypes[0].count} tipo(s) de documento(s) asociado(s)`);
      }
      
      // Eliminar la categoría
      await connection.query(`DELETE FROM Cr_document_categories WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { id, deleted: true, name: existingCategory[0].name };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar categoría ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un nombre de categoría está disponible
   * @param {string} name - Nombre a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isNameAvailable(name, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_document_categories WHERE name = ?`;
      let params = [name];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const [rows] = await pool.query(query, params);
      return rows[0].count === 0;
    } catch (error) {
      logger.error(`Error al verificar disponibilidad del nombre ${name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener categorías con conteo de tipos de documentos
   * @returns {Promise<Array>} Lista de categorías con estadísticas
   */
  static async getCategoriesWithStats() {
    try {
      const [rows] = await pool.query(`
        SELECT dc.*, 
               u.username as created_by_name,
               COUNT(DISTINCT dt.id) as total_document_types,
               COUNT(DISTINCT CASE WHEN dt.is_active = TRUE THEN dt.id END) as active_document_types,
               COUNT(DISTINCT CASE WHEN dt.is_required = TRUE THEN dt.id END) as required_document_types
        FROM Cr_document_categories dc
        LEFT JOIN users u ON dc.created_by = u.id
        LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id
        GROUP BY dc.id
        ORDER BY dc.name ASC
      `);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener categorías con estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales de categorías
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_categories,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_categories,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_categories,
          SUM(CASE WHEN is_required = TRUE THEN 1 ELSE 0 END) as required_categories,
          SUM(CASE WHEN validation_period_days IS NOT NULL THEN 1 ELSE 0 END) as categories_with_validation_period,
          AVG(validation_period_days) as avg_validation_period_days
        FROM Cr_document_categories
      `);

      const [categoriesWithTypes] = await pool.query(`
        SELECT 
          dc.id,
          dc.name,
          dc.is_required,
          dc.is_active,
          COUNT(DISTINCT dt.id) as document_types_count,
          COUNT(DISTINCT CASE WHEN dt.is_active = TRUE THEN dt.id END) as active_types_count
        FROM Cr_document_categories dc
        LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id
        GROUP BY dc.id, dc.name, dc.is_required, dc.is_active
        ORDER BY document_types_count DESC
      `);

      const [validationPeriods] = await pool.query(`
        SELECT 
          CASE 
            WHEN validation_period_days IS NULL THEN 'Sin período de validación'
            WHEN validation_period_days <= 30 THEN 'Hasta 30 días'
            WHEN validation_period_days <= 90 THEN '31-90 días'
            WHEN validation_period_days <= 365 THEN '91-365 días'
            ELSE 'Más de 1 año'
          END as validation_period_range,
          COUNT(*) as count
        FROM Cr_document_categories
        WHERE is_active = TRUE
        GROUP BY 
          CASE 
            WHEN validation_period_days IS NULL THEN 'Sin período de validación'
            WHEN validation_period_days <= 30 THEN 'Hasta 30 días'
            WHEN validation_period_days <= 90 THEN '31-90 días'
            WHEN validation_period_days <= 365 THEN '91-365 días'
            ELSE 'Más de 1 año'
          END
        ORDER BY count DESC
      `);

      return {
        general: generalStats[0],
        categories_with_types: categoriesWithTypes,
        validation_periods: validationPeriods
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de categorías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener opciones para formularios
   * @returns {Promise<Object>} Opciones estructuradas para formularios
   */
  static async getFormOptions() {
    try {
      const activeCategories = await this.getActive();
      
      return {
        categories: activeCategories.map(category => ({
          value: category.id,
          label: category.name,
          description: category.description,
          is_required: category.is_required,
          validation_period_days: category.validation_period_days,
          document_types_count: category.document_types_count
        })),
        required_categories: activeCategories
          .filter(cat => cat.is_required)
          .map(category => ({
            value: category.id,
            label: category.name,
            description: category.description
          })),
        validation_periods: [
          { value: null, label: 'Sin período de validación' },
          { value: 30, label: '30 días' },
          { value: 60, label: '60 días' },
          { value: 90, label: '90 días' },
          { value: 180, label: '180 días' },
          { value: 365, label: '1 año' }
        ]
      };
    } catch (error) {
      logger.error(`Error al obtener opciones para formularios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DocumentCategories; 