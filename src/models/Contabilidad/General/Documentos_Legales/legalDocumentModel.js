/**
 * Modelo para gestionar los documentos legales
 * @module models/Contabilidad/General/Documentos_Legales/legalDocumentModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Clase para gestionar los documentos legales en el sistema
 */
class LegalDocument {
  /**
   * Obtener todos los documentos legales con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de documentos legales
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT d.*, dt.name as document_type_name, 
               u.username as uploaded_by_name,
               t.name as third_party_name
        FROM legal_documents d
        LEFT JOIN legal_document_types dt ON d.document_type_id = dt.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN third_parties t ON d.third_party_id = t.code
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.document_number) {
        conditions.push("d.document_number LIKE ?");
        queryParams.push(`%${filters.document_number}%`);
      }

      if (filters.document_type_id) {
        conditions.push("d.document_type_id = ?");
        queryParams.push(filters.document_type_id);
      }

      if (filters.third_party_id) {
        conditions.push("d.third_party_id = ?");
        queryParams.push(filters.third_party_id);
      }

      if (filters.date_from) {
        conditions.push("d.document_date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("d.document_date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.status) {
        conditions.push("d.status = ?");
        queryParams.push(filters.status);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY d.document_date DESC, d.document_number DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos legales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un documento legal por ID
   * @param {number} id - ID del documento legal
   * @returns {Promise<Object>} Documento legal
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT d.*, dt.name as document_type_name, 
                u.username as uploaded_by_name,
                t.name as third_party_name
         FROM legal_documents d
         LEFT JOIN legal_document_types dt ON d.document_type_id = dt.id
         LEFT JOIN users u ON d.uploaded_by = u.id
         LEFT JOIN third_parties t ON d.third_party_id = t.code
         WHERE d.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener documento legal con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un documento legal por tipo y número
   * @param {number} tipo - ID del tipo de documento
   * @param {string} numero - Número del documento
   * @returns {Promise<Object>} Documento legal
   */
  static async getByTipoNumero(tipo, numero) {
    try {
      const [rows] = await pool.query(
        `SELECT d.*, dt.name as document_type_name, 
                u.username as uploaded_by_name,
                t.name as third_party_name
         FROM legal_documents d
         LEFT JOIN legal_document_types dt ON d.document_type_id = dt.id
         LEFT JOIN users u ON d.uploaded_by = u.id
         LEFT JOIN third_parties t ON d.third_party_id = t.code
         WHERE d.document_type_id = ? AND d.document_number = ?`,
        [tipo, numero]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener documento legal tipo ${tipo} número ${numero}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los tipos de documentos legales
   * @returns {Promise<Array>} Lista de tipos de documentos
   */
  static async getAllDocumentTypes() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM legal_document_types ORDER BY name`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo documento legal
   * @param {Object} documentData - Datos del documento legal
   * @param {Object} fileData - Datos del archivo (si se carga un archivo)
   * @returns {Promise<Object>} Documento legal creado
   */
  static async create(documentData, fileData = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Formatear entrada de datos
      documentData.status = documentData.status || 'ACTIVE';
      
      // Insertar el documento
      const [result] = await connection.query(
        `INSERT INTO legal_documents 
        (document_type_id, document_number, document_date, third_party_id, 
         document_amount, description, file_path, file_name, 
         status, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          documentData.document_type_id,
          documentData.document_number,
          documentData.document_date,
          documentData.third_party_id,
          documentData.document_amount || 0,
          documentData.description || '',
          documentData.file_path || '',
          documentData.file_name || '',
          documentData.status,
          documentData.uploaded_by
        ]
      );
      
      const documentId = result.insertId;
      
      // Si hay un archivo, guardar y actualizar la información del archivo
      if (fileData && fileData.buffer) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documentos');
        
        // Crear el directorio si no existe
        try {
          await fs.mkdir(uploadDir, { recursive: true });
        } catch (mkdirError) {
          logger.error(`Error al crear directorio de uploads: ${mkdirError.message}`);
        }
        
        // Generar nombre de archivo único
        const fileExtension = path.extname(fileData.originalname);
        const fileName = `doc_${documentId}_${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Guardar el archivo
        await fs.writeFile(filePath, fileData.buffer);
        
        // Actualizar el documento con la información del archivo
        const relativeFilePath = path.join('uploads', 'documentos', fileName).replace(/\\/g, '/');
        
        await connection.query(
          `UPDATE legal_documents SET 
           file_path = ?, 
           file_name = ? 
           WHERE id = ?`,
          [relativeFilePath, fileData.originalname, documentId]
        );
        
        documentData.file_path = relativeFilePath;
        documentData.file_name = fileData.originalname;
      }
      
      await connection.commit();
      
      return { id: documentId, ...documentData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear documento legal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un documento legal existente
   * @param {number} id - ID del documento legal
   * @param {Object} documentData - Datos actualizados del documento
   * @param {Object} fileData - Datos del archivo (si se carga un nuevo archivo)
   * @returns {Promise<Object>} Documento legal actualizado
   */
  static async update(id, documentData, fileData = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [documentCheck] = await connection.query(
        `SELECT * FROM legal_documents WHERE id = ?`,
        [id]
      );
      
      if (!documentCheck.length) {
        throw new Error(`El documento con ID ${id} no existe`);
      }
      
      const currentDocument = documentCheck[0];
      
      // Si hay un archivo nuevo, guardar y actualizar la información del archivo
      if (fileData && fileData.buffer) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documentos');
        
        // Crear el directorio si no existe
        try {
          await fs.mkdir(uploadDir, { recursive: true });
        } catch (mkdirError) {
          logger.error(`Error al crear directorio de uploads: ${mkdirError.message}`);
        }
        
        // Eliminar archivo anterior si existe
        if (currentDocument.file_path) {
          const oldFilePath = path.join(process.cwd(), currentDocument.file_path);
          try {
            await fs.unlink(oldFilePath);
          } catch (unlinkError) {
            // No hacer nada si el archivo no existe
            logger.warn(`No se pudo eliminar el archivo anterior: ${unlinkError.message}`);
          }
        }
        
        // Generar nombre de archivo único
        const fileExtension = path.extname(fileData.originalname);
        const fileName = `doc_${id}_${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Guardar el archivo
        await fs.writeFile(filePath, fileData.buffer);
        
        // Actualizar el documento con la información del archivo
        const relativeFilePath = path.join('uploads', 'documentos', fileName).replace(/\\/g, '/');
        
        documentData.file_path = relativeFilePath;
        documentData.file_name = fileData.originalname;
      }
      
      // Actualizar el documento
      await connection.query(
        `UPDATE legal_documents SET
         document_type_id = ?,
         document_number = ?,
         document_date = ?,
         third_party_id = ?,
         document_amount = ?,
         description = ?,
         status = ?,
         file_path = COALESCE(?, file_path),
         file_name = COALESCE(?, file_name),
         updated_at = NOW()
         WHERE id = ?`,
        [
          documentData.document_type_id,
          documentData.document_number,
          documentData.document_date,
          documentData.third_party_id,
          documentData.document_amount || 0,
          documentData.description || '',
          documentData.status,
          documentData.file_path || null,
          documentData.file_name || null,
          id
        ]
      );
      
      await connection.commit();
      
      return { id, ...documentData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar documento legal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar el estado de un documento legal
   * @param {number} id - ID del documento legal
   * @param {string} newStatus - Nuevo estado ('ACTIVE', 'CANCELLED')
   * @param {number} userId - ID del usuario que realiza el cambio
   * @param {string} comentario - Comentario opcional sobre el cambio de estado
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async changeStatus(id, newStatus, userId, comentario = '') {
    try {
      // Verificar que el documento exista
      const [documentCheck] = await pool.query(
        `SELECT status FROM legal_documents WHERE id = ?`,
        [id]
      );
      
      if (!documentCheck.length) {
        throw new Error(`El documento con ID ${id} no existe`);
      }
      
      const currentStatus = documentCheck[0].status;
      
      // Validar cambios de estado permitidos
      if (currentStatus === newStatus) {
        throw new Error(`El documento ya se encuentra en estado ${newStatus}`);
      }
      
      // Actualizar estado del documento
      await pool.query(
        `UPDATE legal_documents SET status = ?, updated_at = NOW() WHERE id = ?`,
        [newStatus, id]
      );
      
      // Registrar historial de cambio de estado
      await pool.query(
        `INSERT INTO legal_document_status_history 
         (document_id, previous_status, new_status, user_id, comments)
         VALUES (?, ?, ?, ?, ?)`,
        [id, currentStatus, newStatus, userId, comentario]
      );
      
      return { 
        id, 
        previous_status: currentStatus, 
        new_status: newStatus, 
        updated_by: userId,
        update_date: new Date()
      };
    } catch (error) {
      logger.error(`Error al cambiar estado del documento ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un documento legal
   * @param {number} id - ID del documento legal
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el documento exista
      const [documentCheck] = await connection.query(
        `SELECT file_path FROM legal_documents WHERE id = ?`,
        [id]
      );
      
      if (!documentCheck.length) {
        throw new Error(`El documento con ID ${id} no existe`);
      }
      
      // Verificar si está asociado a algún comprobante
      const [asociacionesCheck] = await connection.query(
        `SELECT COUNT(*) as total FROM accounting_voucher_documents WHERE document_id = ?`,
        [id]
      );
      
      if (asociacionesCheck[0].total > 0) {
        throw new Error(`No se puede eliminar el documento porque está asociado a ${asociacionesCheck[0].total} comprobantes`);
      }
      
      // Eliminar archivo físico si existe
      if (documentCheck[0].file_path) {
        const filePath = path.join(process.cwd(), documentCheck[0].file_path);
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          // No hacer nada si el archivo no existe
          logger.warn(`No se pudo eliminar el archivo: ${unlinkError.message}`);
        }
      }
      
      // Eliminar historial de estados
      await connection.query(
        `DELETE FROM legal_document_status_history WHERE document_id = ?`,
        [id]
      );
      
      // Eliminar el documento
      await connection.query(
        `DELETE FROM legal_documents WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar documento legal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Asociar un documento legal a un comprobante contable
   * @param {number} documentId - ID del documento legal
   * @param {number} voucherId - ID del comprobante contable
   * @param {number} userId - ID del usuario que realiza la asociación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async associateWithVoucher(documentId, voucherId, userId) {
    try {
      // Verificar que no exista ya la asociación
      const [existingAssociation] = await pool.query(
        `SELECT * FROM accounting_voucher_documents 
         WHERE voucher_id = ? AND document_id = ?`,
        [voucherId, documentId]
      );
      
      if (existingAssociation.length > 0) {
        throw new Error('El documento ya está asociado a este comprobante');
      }
      
      // Crear la asociación
      await pool.query(
        `INSERT INTO accounting_voucher_documents 
         (voucher_id, document_id, association_user_id)
         VALUES (?, ?, ?)`,
        [voucherId, documentId, userId]
      );
      
      return { 
        voucher_id: voucherId, 
        document_id: documentId, 
        association_user_id: userId,
        association_date: new Date()
      };
    } catch (error) {
      logger.error(`Error al asociar documento ${documentId} con comprobante ${voucherId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desasociar un documento legal de un comprobante contable
   * @param {number} documentId - ID del documento legal
   * @param {number} voucherId - ID del comprobante contable
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async dissociateFromVoucher(documentId, voucherId) {
    try {
      // Eliminar la asociación
      await pool.query(
        `DELETE FROM accounting_voucher_documents 
         WHERE voucher_id = ? AND document_id = ?`,
        [voucherId, documentId]
      );
      
      return { 
        voucher_id: voucherId, 
        document_id: documentId, 
        dissociated: true
      };
    } catch (error) {
      logger.error(`Error al desasociar documento ${documentId} de comprobante ${voucherId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener el historial de estados de un documento
   * @param {number} id - ID del documento legal
   * @returns {Promise<Array>} Historial de estados
   */
  static async getStatusHistory(id) {
    try {
      const [rows] = await pool.query(
        `SELECT h.*, u.username as user_name
         FROM legal_document_status_history h
         LEFT JOIN users u ON h.user_id = u.id
         WHERE h.document_id = ?
         ORDER BY h.created_at DESC`,
        [id]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener historial de estados del documento ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener comprobantes asociados a un documento
   * @param {number} id - ID del documento legal
   * @returns {Promise<Array>} Comprobantes asociados
   */
  static async getRelatedVouchers(id) {
    try {
      const [rows] = await pool.query(
        `SELECT v.*, vt.name as voucher_type_name, vd.created_at as association_date
         FROM accounting_voucher_documents vd
         JOIN accounting_vouchers v ON vd.voucher_id = v.id
         JOIN accounting_voucher_types vt ON v.voucher_type_id = vt.id
         WHERE vd.document_id = ?
         ORDER BY vd.created_at DESC`,
        [id]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener comprobantes asociados al documento ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LegalDocument; 