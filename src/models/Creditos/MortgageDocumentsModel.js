/**
 * Modelo para gestionar los documentos de créditos hipotecarios del sistema de créditos
 * @module models/Creditos/MortgageDocumentsModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los documentos de créditos hipotecarios en el sistema
 */
class MortgageDocuments {
  /**
   * Obtener todos los documentos con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de documentos
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT md.*, 
               dt.name as document_type_name,
               dt.code as document_type_code,
               dt.requires_notarization,
               dt.requires_registration,
               dt.is_required as type_is_required,
               dc.name as category_name,
               dc.is_required as category_is_required,
               m.credit_number,
               u1.username as created_by_name,
               u2.username as updated_by_name,
               u3.username as verified_by_name
        FROM Cr_mortgage_documents md
        INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
        INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
        LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
        LEFT JOIN users u1 ON md.created_by = u1.id
        LEFT JOIN users u2 ON md.updated_by = u2.id
        LEFT JOIN users u3 ON md.verified_by = u3.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.mortgage_id) {
        conditions.push("md.mortgage_id = ?");
        queryParams.push(parseInt(filters.mortgage_id));
      }

      if (filters.credit_number) {
        conditions.push("m.credit_number LIKE ?");
        queryParams.push(`%${filters.credit_number}%`);
      }

      if (filters.document_type_id) {
        conditions.push("md.document_type_id = ?");
        queryParams.push(parseInt(filters.document_type_id));
      }

      if (filters.category_id) {
        conditions.push("dt.category_id = ?");
        queryParams.push(parseInt(filters.category_id));
      }

      if (filters.document_number) {
        conditions.push("md.document_number LIKE ?");
        queryParams.push(`%${filters.document_number}%`);
      }

      if (filters.status) {
        conditions.push("md.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.is_verified !== undefined) {
        conditions.push("md.is_verified = ?");
        queryParams.push(filters.is_verified);
      }

      if (filters.verified_by) {
        conditions.push("md.verified_by = ?");
        queryParams.push(parseInt(filters.verified_by));
      }

      if (filters.file_type) {
        conditions.push("md.file_type = ?");
        queryParams.push(filters.file_type);
      }

      if (filters.document_date_from) {
        conditions.push("md.document_date >= ?");
        queryParams.push(filters.document_date_from);
      }

      if (filters.document_date_to) {
        conditions.push("md.document_date <= ?");
        queryParams.push(filters.document_date_to);
      }

      if (filters.expiry_date_from) {
        conditions.push("md.expiry_date >= ?");
        queryParams.push(filters.expiry_date_from);
      }

      if (filters.expiry_date_to) {
        conditions.push("md.expiry_date <= ?");
        queryParams.push(filters.expiry_date_to);
      }

      if (filters.expired_documents !== undefined) {
        if (filters.expired_documents) {
          conditions.push("md.expiry_date < CURDATE()");
        } else {
          conditions.push("(md.expiry_date IS NULL OR md.expiry_date >= CURDATE())");
        }
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY md.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos de créditos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un documento por ID
   * @param {number} id - ID del documento
   * @returns {Promise<Object>} Documento
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                dt.name as document_type_name,
                dt.code as document_type_code,
                dt.description as document_type_description,
                dt.requires_notarization,
                dt.requires_registration,
                dt.is_required as type_is_required,
                dt.validation_period_days,
                dt.file_types_allowed,
                dt.max_file_size_mb,
                dc.name as category_name,
                dc.description as category_description,
                dc.is_required as category_is_required,
                m.credit_number,
                m.principal_amount,
                m.status as mortgage_status,
                u1.username as created_by_name,
                u2.username as updated_by_name,
                u3.username as verified_by_name
         FROM Cr_mortgage_documents md
         INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
         LEFT JOIN users u1 ON md.created_by = u1.id
         LEFT JOIN users u2 ON md.updated_by = u2.id
         LEFT JOIN users u3 ON md.verified_by = u3.id
         WHERE md.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener documento con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener documentos por crédito hipotecario
   * @param {number} mortgageId - ID del crédito hipotecario
   * @returns {Promise<Array>} Lista de documentos del crédito
   */
  static async getByMortgageId(mortgageId) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                dt.name as document_type_name,
                dt.code as document_type_code,
                dt.is_required as type_is_required,
                dc.name as category_name,
                u1.username as created_by_name,
                u3.username as verified_by_name
         FROM Cr_mortgage_documents md
         INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN users u1 ON md.created_by = u1.id
         LEFT JOIN users u3 ON md.verified_by = u3.id
         WHERE md.mortgage_id = ?
         ORDER BY dc.name ASC, dt.name ASC`,
        [mortgageId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos por crédito ${mortgageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener documentos por tipo de documento
   * @param {number} documentTypeId - ID del tipo de documento
   * @returns {Promise<Array>} Lista de documentos del tipo
   */
  static async getByDocumentTypeId(documentTypeId) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                m.credit_number,
                u1.username as created_by_name,
                u3.username as verified_by_name
         FROM Cr_mortgage_documents md
         LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
         LEFT JOIN users u1 ON md.created_by = u1.id
         LEFT JOIN users u3 ON md.verified_by = u3.id
         WHERE md.document_type_id = ?
         ORDER BY md.created_at DESC`,
        [documentTypeId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos por tipo ${documentTypeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener documentos vencidos
   * @returns {Promise<Array>} Lista de documentos vencidos
   */
  static async getExpiredDocuments() {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                dt.name as document_type_name,
                dt.code as document_type_code,
                dc.name as category_name,
                m.credit_number,
                DATEDIFF(CURDATE(), md.expiry_date) as days_expired
         FROM Cr_mortgage_documents md
         INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
         WHERE md.expiry_date < CURDATE() AND md.status != 'expired'
         ORDER BY md.expiry_date ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos vencidos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener documentos próximos a vencer
   * @param {number} daysAhead - Días de anticipación (default: 30)
   * @returns {Promise<Array>} Lista de documentos próximos a vencer
   */
  static async getDocumentsExpiringSoon(daysAhead = 30) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                dt.name as document_type_name,
                dt.code as document_type_code,
                dc.name as category_name,
                m.credit_number,
                DATEDIFF(md.expiry_date, CURDATE()) as days_until_expiry
         FROM Cr_mortgage_documents md
         INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
         INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
         LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
         WHERE md.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND md.status IN ('uploaded', 'validated')
         ORDER BY md.expiry_date ASC`,
        [daysAhead]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos próximos a vencer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo documento de crédito
   * @param {Object} documentData - Datos del documento
   * @returns {Promise<Object>} Documento creado
   */
  static async create(documentData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el crédito hipotecario exista
      const [existingMortgage] = await connection.query(
        `SELECT id, credit_number FROM Cr_mortgages WHERE id = ?`,
        [documentData.mortgage_id]
      );
      
      if (existingMortgage.length === 0) {
        throw new Error(`El crédito hipotecario con ID ${documentData.mortgage_id} no existe`);
      }

      // Verificar que el tipo de documento exista
      const [existingDocumentType] = await connection.query(
        `SELECT id, name, validation_period_days FROM Cr_document_types WHERE id = ? AND is_active = TRUE`,
        [documentData.document_type_id]
      );
      
      if (existingDocumentType.length === 0) {
        throw new Error(`El tipo de documento con ID ${documentData.document_type_id} no existe o no está activo`);
      }

      // Verificar que no exista ya un documento del mismo tipo para este crédito
      const [existingDocument] = await connection.query(
        `SELECT id FROM Cr_mortgage_documents 
         WHERE mortgage_id = ? AND document_type_id = ? AND status != 'rejected'`,
        [documentData.mortgage_id, documentData.document_type_id]
      );
      
      if (existingDocument.length > 0) {
        throw new Error(`Ya existe un documento del tipo "${existingDocumentType[0].name}" para este crédito`);
      }

      // Calcular fecha de vencimiento si el tipo de documento tiene período de validación
      let expiryDate = documentData.expiry_date || null;
      if (!expiryDate && existingDocumentType[0].validation_period_days && documentData.document_date) {
        const docDate = new Date(documentData.document_date);
        docDate.setDate(docDate.getDate() + existingDocumentType[0].validation_period_days);
        expiryDate = docDate.toISOString().split('T')[0];
      }
      
      // Insertar el documento
      const [result] = await connection.query(
        `INSERT INTO Cr_mortgage_documents 
        (mortgage_id, document_type_id, document_number, document_date, expiry_date,
         file_path, file_name, file_size, file_type, description, status, 
         validation_notes, is_verified, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          documentData.mortgage_id,
          documentData.document_type_id,
          documentData.document_number || null,
          documentData.document_date || null,
          expiryDate,
          documentData.file_path || null,
          documentData.file_name || null,
          documentData.file_size || null,
          documentData.file_type || null,
          documentData.description || null,
          documentData.status || 'pending',
          documentData.validation_notes || null,
          documentData.is_verified || false,
          documentData.created_by
        ]
      );
      
      const documentId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdDocument = await this.getById(documentId);
      
      return createdDocument;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear documento: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un documento existente
   * @param {number} id - ID del documento
   * @param {Object} documentData - Datos actualizados del documento
   * @returns {Promise<Object>} Documento actualizado
   */
  static async update(id, documentData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [existingDocument] = await connection.query(
        `SELECT id, mortgage_id, document_type_id FROM Cr_mortgage_documents WHERE id = ?`,
        [id]
      );
      
      if (existingDocument.length === 0) {
        throw new Error(`El documento con ID ${id} no existe`);
      }

      // Si se está cambiando el tipo de documento, verificar que no exista duplicado
      if (documentData.document_type_id && documentData.document_type_id !== existingDocument[0].document_type_id) {
        const [duplicateDocument] = await connection.query(
          `SELECT id FROM Cr_mortgage_documents 
           WHERE mortgage_id = ? AND document_type_id = ? AND id != ? AND status != 'rejected'`,
          [existingDocument[0].mortgage_id, documentData.document_type_id, id]
        );
        
        if (duplicateDocument.length > 0) {
          throw new Error('Ya existe un documento de este tipo para el crédito');
        }
      }
      
      // Actualizar el documento
      await connection.query(
        `UPDATE Cr_mortgage_documents SET
         document_type_id = ?,
         document_number = ?,
         document_date = ?,
         expiry_date = ?,
         file_path = ?,
         file_name = ?,
         file_size = ?,
         file_type = ?,
         description = ?,
         status = ?,
         validation_notes = ?,
         is_verified = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          documentData.document_type_id || existingDocument[0].document_type_id,
          documentData.document_number,
          documentData.document_date,
          documentData.expiry_date,
          documentData.file_path,
          documentData.file_name,
          documentData.file_size,
          documentData.file_type,
          documentData.description,
          documentData.status || 'pending',
          documentData.validation_notes,
          documentData.is_verified || false,
          documentData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedDocument = await this.getById(id);
      
      return updatedDocument;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar un documento
   * @param {number} id - ID del documento
   * @param {number} userId - ID del usuario que verifica
   * @param {string} validationNotes - Notas de validación
   * @returns {Promise<Object>} Documento verificado
   */
  static async verifyDocument(id, userId, validationNotes = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [existingDocument] = await connection.query(
        `SELECT id, status FROM Cr_mortgage_documents WHERE id = ?`,
        [id]
      );
      
      if (existingDocument.length === 0) {
        throw new Error(`El documento con ID ${id} no existe`);
      }

      if (existingDocument[0].status !== 'uploaded') {
        throw new Error('Solo se pueden verificar documentos en estado "uploaded"');
      }
      
      // Verificar el documento
      await connection.query(
        `UPDATE Cr_mortgage_documents SET
         status = 'validated',
         is_verified = TRUE,
         verified_at = NOW(),
         verified_by = ?,
         validation_notes = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [userId, validationNotes, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const verifiedDocument = await this.getById(id);
      
      return verifiedDocument;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al verificar documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Rechazar un documento
   * @param {number} id - ID del documento
   * @param {number} userId - ID del usuario que rechaza
   * @param {string} validationNotes - Razón del rechazo
   * @returns {Promise<Object>} Documento rechazado
   */
  static async rejectDocument(id, userId, validationNotes) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [existingDocument] = await connection.query(
        `SELECT id, status FROM Cr_mortgage_documents WHERE id = ?`,
        [id]
      );
      
      if (existingDocument.length === 0) {
        throw new Error(`El documento con ID ${id} no existe`);
      }

      if (!validationNotes || validationNotes.trim() === '') {
        throw new Error('Las notas de validación son obligatorias para rechazar un documento');
      }
      
      // Rechazar el documento
      await connection.query(
        `UPDATE Cr_mortgage_documents SET
         status = 'rejected',
         is_verified = FALSE,
         verified_at = NOW(),
         verified_by = ?,
         validation_notes = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [userId, validationNotes, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const rejectedDocument = await this.getById(id);
      
      return rejectedDocument;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al rechazar documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Marcar documentos como vencidos
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async markExpiredDocuments() {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Marcar como vencidos los documentos que superaron su fecha de vencimiento
      const [result] = await connection.query(
        `UPDATE Cr_mortgage_documents 
         SET status = 'expired', updated_at = NOW()
         WHERE expiry_date < CURDATE() AND status IN ('pending', 'uploaded', 'validated')`
      );
      
      await connection.commit();
      
      return {
        success: true,
        documents_marked_expired: result.affectedRows,
        marked_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al marcar documentos vencidos: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un documento
   * @param {number} id - ID del documento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [existingDocument] = await connection.query(
        `SELECT md.id, md.file_name, dt.name as document_type_name, m.credit_number
         FROM Cr_mortgage_documents md
         INNER JOIN Cr_document_types dt ON md.document_type_id = dt.id
         LEFT JOIN Cr_mortgages m ON md.mortgage_id = m.id
         WHERE md.id = ?`,
        [id]
      );
      
      if (existingDocument.length === 0) {
        throw new Error(`El documento con ID ${id} no existe`);
      }
      
      // Eliminar el documento
      await connection.query(`DELETE FROM Cr_mortgage_documents WHERE id = ?`, [id]);
      
      await connection.commit();
      
      return { 
        id, 
        deleted: true, 
        file_name: existingDocument[0].file_name,
        document_type_name: existingDocument[0].document_type_name,
        credit_number: existingDocument[0].credit_number
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar documento ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de documentos
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(DISTINCT mortgage_id) as mortgages_with_documents,
          COUNT(DISTINCT document_type_id) as different_document_types,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_documents,
          SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) as uploaded_documents,
          SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated_documents,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_documents,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_documents,
          SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified_documents,
          AVG(file_size) as avg_file_size,
          SUM(file_size) as total_file_size
        FROM Cr_mortgage_documents
      `);

      const [byDocumentType] = await pool.query(`
        SELECT 
          dt.name as document_type_name,
          dc.name as category_name,
          COUNT(md.id) as documents_count,
          SUM(CASE WHEN md.status = 'validated' THEN 1 ELSE 0 END) as validated_count,
          SUM(CASE WHEN md.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM Cr_document_types dt
        INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
        LEFT JOIN Cr_mortgage_documents md ON dt.id = md.document_type_id
        WHERE dt.is_active = TRUE
        GROUP BY dt.id, dt.name, dc.name
        ORDER BY documents_count DESC
      `);

      const [byStatus] = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Cr_mortgage_documents), 2) as percentage
        FROM Cr_mortgage_documents
        GROUP BY status
        ORDER BY count DESC
      `);

      const [expiryReport] = await pool.query(`
        SELECT 
          COUNT(CASE WHEN expiry_date < CURDATE() THEN 1 END) as expired_count,
          COUNT(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_30_days,
          COUNT(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 END) as expiring_90_days,
          COUNT(CASE WHEN expiry_date IS NULL THEN 1 END) as no_expiry_date
        FROM Cr_mortgage_documents
        WHERE status IN ('uploaded', 'validated')
      `);

      return {
        general: generalStats[0],
        by_document_type: byDocumentType,
        by_status: byStatus,
        expiry_report: expiryReport[0]
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener opciones para formularios
   * @returns {Promise<Object>} Opciones estructuradas para formularios
   */
  static async getFormOptions() {
    try {
      const [documentTypes] = await pool.query(`
        SELECT dt.id, dt.name, dt.code, dt.is_required, 
               dc.name as category_name, dc.id as category_id
        FROM Cr_document_types dt
        INNER JOIN Cr_document_categories dc ON dt.category_id = dc.id
        WHERE dt.is_active = TRUE AND dc.is_active = TRUE
        ORDER BY dc.name ASC, dt.name ASC
      `);

      const [statuses] = await pool.query(`
        SELECT DISTINCT status as value, status as label
        FROM Cr_mortgage_documents
        ORDER BY 
          CASE status
            WHEN 'pending' THEN 1
            WHEN 'uploaded' THEN 2
            WHEN 'validated' THEN 3
            WHEN 'expired' THEN 4
            WHEN 'rejected' THEN 5
            ELSE 6
          END
      `);
      
      return {
        document_types: documentTypes.map(dt => ({
          value: dt.id,
          label: dt.name,
          code: dt.code,
          category_name: dt.category_name,
          category_id: dt.category_id,
          is_required: dt.is_required
        })),
        statuses: statuses.length > 0 ? statuses : [
          { value: 'pending', label: 'Pendiente' },
          { value: 'uploaded', label: 'Subido' },
          { value: 'validated', label: 'Validado' },
          { value: 'expired', label: 'Vencido' },
          { value: 'rejected', label: 'Rechazado' }
        ],
        file_types: [
          { value: 'pdf', label: 'PDF' },
          { value: 'jpg', label: 'JPG' },
          { value: 'jpeg', label: 'JPEG' },
          { value: 'png', label: 'PNG' },
          { value: 'doc', label: 'DOC' },
          { value: 'docx', label: 'DOCX' }
        ]
      };
    } catch (error) {
      logger.error(`Error al obtener opciones para formularios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MortgageDocuments; 