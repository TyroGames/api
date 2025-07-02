/**
 * Modelo para gestionar los tipos de documentos del sistema de créditos
 * @module models/Creditos/DocumentTypesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los tipos de documentos en el sistema
 */
class DocumentTypes {
  /**
   * Obtener todos los tipos de documentos con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de tipos de documentos
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT dt.*, 
               dc.name as category_name,
               dc.is_required as category_is_required,
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT md.id) as documents_count
        FROM Cr_document_types dt
        INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
        LEFT JOIN users u1 ON dt.created_by = u1.id
        LEFT JOIN users u2 ON dt.updated_by = u2.id
        LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("dt.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.code) {
        conditions.push("dt.code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.category_id) {
        conditions.push("dt.category_id = ?");
        queryParams.push(parseInt(filters.category_id));
      }

      if (filters.category_name) {
        conditions.push("dc.name LIKE ?");
        queryParams.push(`%${filters.category_name}%`);
      }

      if (filters.is_required !== undefined) {
        conditions.push("dt.is_required = ?");
        queryParams.push(filters.is_required);
      }

      if (filters.is_active !== undefined) {
        conditions.push("dt.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.requires_notarization !== undefined) {
        conditions.push("dt.requires_notarization = ?");
        queryParams.push(filters.requires_notarization);
      }

      if (filters.requires_registration !== undefined) {
        conditions.push("dt.requires_registration = ?");
        queryParams.push(filters.requires_registration);
      }

      if (filters.has_validation_period !== undefined) {
        if (filters.has_validation_period) {
          conditions.push("dt.validation_period_days IS NOT NULL");
        } else {
          conditions.push("dt.validation_period_days IS NULL");
        }
      }

      if (filters.max_file_size_mb) {
        conditions.push("dt.max_file_size_mb <= ?");
        queryParams.push(parseInt(filters.max_file_size_mb));
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY dt.id ORDER BY dc.name ASC, dt.name ASC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de documento por ID
   * @param {number} id - ID del tipo de documento
   * @returns {Promise<Object>} Tipo de documento
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT dt.*, 
                dc.name as category_name,
                dc.description as category_description,
                dc.is_required as category_is_required,
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT md.id) as documents_count
         FROM Cr_document_types dt
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN users u1 ON dt.created_by = u1.id
         LEFT JOIN users u2 ON dt.updated_by = u2.id
         LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
         WHERE dt.id = ?
         GROUP BY dt.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de documento con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de documento por código
   * @param {string} code - Código del tipo de documento
   * @returns {Promise<Object>} Tipo de documento
   */
  static async getByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT dt.*, 
                dc.name as category_name,
                dc.description as category_description,
                u1.username as created_by_name,
                u2.username as updated_by_name
         FROM Cr_document_types dt
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN users u1 ON dt.created_by = u1.id
         LEFT JOIN users u2 ON dt.updated_by = u2.id
         WHERE dt.code = ?`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de documento con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener tipos de documentos por categoría
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<Array>} Lista de tipos de documentos
   */
  static async getByCategoryId(categoryId) {
    try {
      const [rows] = await pool.query(
        `SELECT dt.*, 
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT md.id) as documents_count
         FROM Cr_document_types dt
         LEFT JOIN users u1 ON dt.created_by = u1.id
         LEFT JOIN users u2 ON dt.updated_by = u2.id
         LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
         WHERE dt.category_id = ? AND dt.is_active = TRUE
         GROUP BY dt.id
         ORDER BY dt.name ASC`,
        [categoryId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos por categoría ${categoryId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo tipos de documentos activos
   * @returns {Promise<Array>} Lista de tipos de documentos activos
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT dt.*, 
                dc.name as category_name,
                u1.username as created_by_name,
                COUNT(DISTINCT md.id) as documents_count
         FROM Cr_document_types dt
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN users u1 ON dt.created_by = u1.id
         LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
         WHERE dt.is_active = TRUE AND dc.is_active = TRUE
         GROUP BY dt.id
         ORDER BY dc.name ASC, dt.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos activos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener tipos de documentos requeridos
   * @returns {Promise<Array>} Lista de tipos de documentos requeridos
   */
  static async getRequired() {
    try {
      const [rows] = await pool.query(
        `SELECT dt.*, 
                dc.name as category_name,
                u1.username as created_by_name,
                COUNT(DISTINCT md.id) as documents_count
         FROM Cr_document_types dt
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN users u1 ON dt.created_by = u1.id
         LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
         WHERE dt.is_required = TRUE AND dt.is_active = TRUE AND dc.is_active = TRUE
         GROUP BY dt.id
         ORDER BY dc.name ASC, dt.name ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos requeridos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tipo de documento
   * @param {Object} documentTypeData - Datos del tipo de documento
   * @returns {Promise<Object>} Tipo de documento creado
   */
  static async create(documentTypeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la categoría exista
      const [existingCategory] = await connection.query(
        `SELECT id, name FROM Cr_document_categories WHERE id = ? AND is_active = TRUE`,
        [documentTypeData.category_id]
      );
      
      if (existingCategory.length === 0) {
        throw new Error(`La categoría con ID ${documentTypeData.category_id} no existe o no está activa`);
      }

      // Verificar que el código no exista
      const [existingCode] = await connection.query(
        `SELECT id FROM Cr_document_types WHERE code = ?`,
        [documentTypeData.code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe un tipo de documento con el código "${documentTypeData.code}"`);
      }

      // Verificar que el nombre no exista en la misma categoría
      const [existingName] = await connection.query(
        `SELECT id FROM Cr_document_types WHERE name = ? AND category_id = ?`,
        [documentTypeData.name, documentTypeData.category_id]
      );
      
      if (existingName.length > 0) {
        throw new Error(`Ya existe un tipo de documento con el nombre "${documentTypeData.name}" en la categoría "${existingCategory[0].name}"`);
      }
      
      // Insertar el tipo de documento
      const [result] = await connection.query(
        `INSERT INTO Cr_document_types 
        (category_id, name, description, code, is_required, validation_period_days,
         requires_notarization, requires_registration, file_types_allowed, max_file_size_mb,
         is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          documentTypeData.category_id,
          documentTypeData.name,
          documentTypeData.description || null,
          documentTypeData.code,
          documentTypeData.is_required !== false,
          documentTypeData.validation_period_days || null,
          documentTypeData.requires_notarization || false,
          documentTypeData.requires_registration || false,
          documentTypeData.file_types_allowed || 'pdf,jpg,jpeg,png',
          documentTypeData.max_file_size_mb || 10,
          documentTypeData.is_active !== false,
          documentTypeData.created_by
        ]
      );
      
      const documentTypeId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdDocumentType = await this.getById(documentTypeId);
      
      return createdDocumentType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear tipo de documento: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un tipo de documento existente
   * @param {number} id - ID del tipo de documento
   * @param {Object} documentTypeData - Datos actualizados del tipo de documento
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  static async update(id, documentTypeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de documento exista
      const [existingDocumentType] = await connection.query(
        `SELECT id, category_id FROM Cr_document_types WHERE id = ?`,
        [id]
      );
      
      if (existingDocumentType.length === 0) {
        throw new Error(`El tipo de documento con ID ${id} no existe`);
      }

      // Si se está cambiando la categoría, verificar que exista
      if (documentTypeData.category_id && documentTypeData.category_id !== existingDocumentType[0].category_id) {
        const [existingCategory] = await connection.query(
          `SELECT id, name FROM Cr_document_categories WHERE id = ? AND is_active = TRUE`,
          [documentTypeData.category_id]
        );
        
        if (existingCategory.length === 0) {
          throw new Error(`La categoría con ID ${documentTypeData.category_id} no existe o no está activa`);
        }
      }

      // Verificar que el código no esté en uso por otro tipo de documento
      if (documentTypeData.code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM Cr_document_types WHERE code = ? AND id != ?`,
          [documentTypeData.code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otro tipo de documento con el código "${documentTypeData.code}"`);
        }
      }

      // Verificar que el nombre no esté en uso en la misma categoría
      if (documentTypeData.name) {
        const categoryId = documentTypeData.category_id || existingDocumentType[0].category_id;
        const [existingName] = await connection.query(
          `SELECT id FROM Cr_document_types WHERE name = ? AND category_id = ? AND id != ?`,
          [documentTypeData.name, categoryId, id]
        );
        
        if (existingName.length > 0) {
          throw new Error(`Ya existe otro tipo de documento con el nombre "${documentTypeData.name}" en esta categoría`);
        }
      }
      
      // Actualizar el tipo de documento
      await connection.query(
        `UPDATE Cr_document_types SET
         category_id = ?,
         name = ?,
         description = ?,
         code = ?,
         is_required = ?,
         validation_period_days = ?,
         requires_notarization = ?,
         requires_registration = ?,
         file_types_allowed = ?,
         max_file_size_mb = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          documentTypeData.category_id || existingDocumentType[0].category_id,
          documentTypeData.name,
          documentTypeData.description,
          documentTypeData.code,
          documentTypeData.is_required !== false,
          documentTypeData.validation_period_days,
          documentTypeData.requires_notarization || false,
          documentTypeData.requires_registration || false,
          documentTypeData.file_types_allowed || 'pdf,jpg,jpeg,png',
          documentTypeData.max_file_size_mb || 10,
          documentTypeData.is_active !== false,
          documentTypeData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedDocumentType = await this.getById(id);
      
      return updatedDocumentType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar tipo de documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Alternar estado activo/inactivo de un tipo de documento
   * @param {number} id - ID del tipo de documento
   * @param {boolean} isActive - Nuevo estado activo
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Tipo de documento actualizado
   */
  static async toggleActive(id, isActive, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de documento exista
      const [existingDocumentType] = await connection.query(
        `SELECT id, name, is_active FROM Cr_document_types WHERE id = ?`,
        [id]
      );
      
      if (existingDocumentType.length === 0) {
        throw new Error(`El tipo de documento con ID ${id} no existe`);
      }

      // Si se está desactivando, verificar que no tenga documentos asociados
      if (!isActive) {
        const [associatedDocuments] = await connection.query(
          `SELECT COUNT(*) as count FROM Cr_mortgage_documents 
           WHERE document_type_id = ?`,
          [id]
        );
        
        if (associatedDocuments[0].count > 0) {
          throw new Error('No se puede desactivar un tipo de documento que tiene documentos asociados');
        }
      }
      
      // Actualizar el estado
      await connection.query(
        `UPDATE Cr_document_types SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedDocumentType = await this.getById(id);
      
      return updatedDocumentType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado del tipo de documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un tipo de documento (solo si no tiene documentos asociados)
   * @param {number} id - ID del tipo de documento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de documento exista
      const [existingDocumentType] = await connection.query(
        `SELECT id, name, code FROM Cr_document_types WHERE id = ?`,
        [id]
      );
      
      if (existingDocumentType.length === 0) {
        throw new Error(`El tipo de documento con ID ${id} no existe`);
      }

      // Verificar que no tenga documentos asociados
      const [associatedDocuments] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgage_documents WHERE document_type_id = ?`,
        [id]
      );
      
      if (associatedDocuments[0].count > 0) {
        throw new Error(`No se puede eliminar el tipo de documento "${existingDocumentType[0].name}" porque tiene ${associatedDocuments[0].count} documento(s) asociado(s)`);
      }
      
      // Eliminar el tipo de documento
      await connection.query(`DELETE FROM Cr_document_types WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { 
        id, 
        deleted: true, 
        name: existingDocumentType[0].name,
        code: existingDocumentType[0].code
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar tipo de documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un código de tipo de documento está disponible
   * @param {string} code - Código a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isCodeAvailable(code, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_document_types WHERE code = ?`;
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
   * Obtener estadísticas de tipos de documentos
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_document_types,
          SUM(CASE WHEN dt.is_active = TRUE THEN 1 ELSE 0 END) as active_document_types,
          SUM(CASE WHEN dt.is_active = FALSE THEN 1 ELSE 0 END) as inactive_document_types,
          SUM(CASE WHEN dt.is_required = TRUE THEN 1 ELSE 0 END) as required_document_types,
          SUM(CASE WHEN dt.requires_notarization = TRUE THEN 1 ELSE 0 END) as notarization_required,
          SUM(CASE WHEN dt.requires_registration = TRUE THEN 1 ELSE 0 END) as registration_required,
          AVG(dt.max_file_size_mb) as avg_max_file_size,
          AVG(dt.validation_period_days) as avg_validation_period
        FROM Cr_document_types dt
      `);

      const [byCategory] = await pool.query(`
        SELECT 
          dc.name as category_name,
          COUNT(dt.id) as document_types_count,
          SUM(CASE WHEN dt.is_active = TRUE THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN dt.is_required = TRUE THEN 1 ELSE 0 END) as required_count
        FROM Cr_document_categories dc
        LEFT JOIN Cr_document_types dt ON dc.id = dt.category_id
        WHERE dc.is_active = TRUE
        GROUP BY dc.id, dc.name
        ORDER BY document_types_count DESC
      `);

      const [fileTypes] = await pool.query(`
        SELECT 
          file_types_allowed,
          COUNT(*) as count
        FROM Cr_document_types
        WHERE is_active = TRUE
        GROUP BY file_types_allowed
        ORDER BY count DESC
      `);

      const [fileSizes] = await pool.query(`
        SELECT 
          CASE 
            WHEN max_file_size_mb <= 5 THEN 'Hasta 5MB'
            WHEN max_file_size_mb <= 10 THEN '6-10MB'
            WHEN max_file_size_mb <= 20 THEN '11-20MB'
            WHEN max_file_size_mb <= 50 THEN '21-50MB'
            ELSE 'Más de 50MB'
          END as file_size_range,
          COUNT(*) as count
        FROM Cr_document_types
        WHERE is_active = TRUE
        GROUP BY 
          CASE 
            WHEN max_file_size_mb <= 5 THEN 'Hasta 5MB'
            WHEN max_file_size_mb <= 10 THEN '6-10MB'
            WHEN max_file_size_mb <= 20 THEN '11-20MB'
            WHEN max_file_size_mb <= 50 THEN '21-50MB'
            ELSE 'Más de 50MB'
          END
        ORDER BY count DESC
      `);

      return {
        general: generalStats[0],
        by_category: byCategory,
        file_types: fileTypes,
        file_sizes: fileSizes
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de tipos de documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener opciones para formularios
   * @returns {Promise<Object>} Opciones estructuradas para formularios
   */
  static async getFormOptions() {
    try {
      const [categories] = await pool.query(`
        SELECT id, name, description, is_required 
        FROM Cr_document_categories 
        WHERE is_active = TRUE 
        ORDER BY name ASC
      `);

      const activeDocumentTypes = await this.getActive();
      
      return {
        categories: categories.map(cat => ({
          value: cat.id,
          label: cat.name,
          description: cat.description,
          is_required: cat.is_required
        })),
        document_types_by_category: categories.reduce((acc, cat) => {
          acc[cat.id] = activeDocumentTypes
            .filter(dt => dt.category_id === cat.id)
            .map(dt => ({
              value: dt.id,
              label: dt.name,
              code: dt.code,
              description: dt.description,
              is_required: dt.is_required,
              requires_notarization: dt.requires_notarization,
              requires_registration: dt.requires_registration,
              file_types_allowed: dt.file_types_allowed.split(','),
              max_file_size_mb: dt.max_file_size_mb
            }));
          return acc;
        }, {}),
        file_types: [
          { value: 'pdf', label: 'PDF' },
          { value: 'jpg', label: 'JPG' },
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' },
          { value: 'doc', label: 'DOC' },
          { value: 'docx', label: 'DOCX' },
          { value: 'xls', label: 'XLS' },
          { value: 'xlsx', label: 'XLSX' }
        ],
        max_file_sizes: [
          { value: 5, label: '5 MB' },
          { value: 10, label: '10 MB' },
          { value: 15, label: '15 MB' },
          { value: 20, label: '20 MB' },
          { value: 50, label: '50 MB' },
          { value: 100, label: '100 MB' }
        ],
        validation_periods: [
          { value: null, label: 'Sin período de validación' },
          { value: 30, label: '30 días' },
          { value: 60, label: '60 días' },
          { value: 90, label: '90 días' },
          { value: 180, label: '180 días' },
          { value: 365, label: '1 año' },
          { value: 730, label: '2 años' }
        ]
      };
    } catch (error) {
      logger.error(`Error al obtener opciones para formularios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DocumentTypes; 