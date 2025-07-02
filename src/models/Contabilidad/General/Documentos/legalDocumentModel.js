/**
 * Modelo para gestionar los documentos legales
 * @module models/Contabilidad/General/Documentos/legalDocumentModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const DocumentType = require('../documentTypeModel');

/**
 * Clase para gestionar los documentos legales en el sistema
 */
class LegalDocument {
  /**
   * Obtener todos los documentos legales con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de documentos legales
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT ld.*, 
               dt.name as document_type_name,
               CONCAT(u1.full_name) as created_by_name,
               CONCAT(u2.full_name) as approved_by_name
        FROM legal_documents ld
        LEFT JOIN document_types dt ON ld.document_type_id = dt.id
        LEFT JOIN users u1 ON ld.created_by = u1.id
        LEFT JOIN users u2 ON ld.approved_by = u2.id
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Aplicar filtros
      if (filters.document_number) {
        query += ' AND ld.document_number LIKE ?';
        queryParams.push(`%${filters.document_number}%`);
      }
      
      if (filters.document_type_id) {
        query += ' AND ld.document_type_id = ?';
        queryParams.push(filters.document_type_id);
      }
      
      if (filters.status) {
        query += ' AND ld.status = ?';
        queryParams.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND ld.date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND ld.date <= ?';
        queryParams.push(filters.end_date);
      }
      
      if (filters.entity_type) {
        query += ' AND ld.entity_type = ?';
        queryParams.push(filters.entity_type);
      }
      
      if (filters.entity_id) {
        query += ' AND ld.entity_id = ?';
        queryParams.push(filters.entity_id);
      }
      
      if (filters.reference) {
        query += ' AND ld.reference LIKE ?';
        queryParams.push(`%${filters.reference}%`);
      }
      
      // Aplicar ordenamiento
      query += ' ORDER BY ld.date DESC, ld.document_number DESC';
      
      // Aplicar paginación
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(filters.limit), parseInt(offset));
      }
      
      const [results] = await pool.query(query, queryParams);
      return results;
    } catch (error) {
      logger.error(`Error al obtener documentos legales: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Contar el total de documentos según filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<number>} Total de documentos
   */
  static async countAll(filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM legal_documents ld
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Aplicar los mismos filtros que en findAll
      if (filters.document_number) {
        query += ' AND ld.document_number LIKE ?';
        queryParams.push(`%${filters.document_number}%`);
      }
      
      if (filters.document_type_id) {
        query += ' AND ld.document_type_id = ?';
        queryParams.push(filters.document_type_id);
      }
      
      if (filters.status) {
        query += ' AND ld.status = ?';
        queryParams.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND ld.date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND ld.date <= ?';
        queryParams.push(filters.end_date);
      }
      
      if (filters.entity_type) {
        query += ' AND ld.entity_type = ?';
        queryParams.push(filters.entity_type);
      }
      
      if (filters.entity_id) {
        query += ' AND ld.entity_id = ?';
        queryParams.push(filters.entity_id);
      }
      
      if (filters.reference) {
        query += ' AND ld.reference LIKE ?';
        queryParams.push(`%${filters.reference}%`);
      }
      
      const [result] = await pool.query(query, queryParams);
      return result[0].total;
    } catch (error) {
      logger.error(`Error al contar documentos legales: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtener un documento legal por su ID
   * @param {number} id - ID del documento legal
   * @returns {Promise<Object>} Documento legal con sus detalles
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      // Obtener el encabezado del documento
      const [headerResult] = await connection.query(`
        SELECT ld.*, 
               dt.name as document_type_name,
               CONCAT(u1.full_name) as created_by_name,
               CONCAT(u2.full_name) as approved_by_name
        FROM legal_documents ld
        LEFT JOIN document_types dt ON ld.document_type_id = dt.id
        LEFT JOIN users u1 ON ld.created_by = u1.id
        LEFT JOIN users u2 ON ld.approved_by = u2.id
        WHERE ld.id = ?
      `, [id]);
      
      if (!headerResult.length) {
        return null;
      }
      
      const document = headerResult[0];
      
      // Obtener los detalles del documento
      const [detailsResult] = await connection.query(`
        SELECT * 
        FROM legal_document_details
        WHERE document_id = ?
        ORDER BY line_number ASC
      `, [id]);
      
      document.details = detailsResult;
      
      // Obtener comprobantes asociados al documento
      const [vouchersResult] = await connection.query(`
        SELECT av.*, vt.name as voucher_type_name
        FROM accounting_vouchers av
        JOIN voucher_types vt ON av.voucher_type_id = vt.id
        WHERE av.document_type_id = ? AND av.document_id = ?
      `, [document.document_type_id, id]);
      
      document.vouchers = vouchersResult;
      
      // Obtener archivos adjuntos si existen
      const [attachmentsResult] = await connection.query(`
        SELECT * 
        FROM attachments
        WHERE entity_type = 'legal_document' AND entity_id = ?
      `, [id]);
      
      document.attachments = attachmentsResult;
      
      return document;
    } catch (error) {
      logger.error(`Error al obtener documento legal por ID: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener un documento legal por su número
   * @param {string} documentNumber - Número del documento
   * @returns {Promise<Object>} Documento legal con sus detalles
   */
  static async findByNumber(documentNumber) {
    try {
      const [result] = await pool.query(
        'SELECT id FROM legal_documents WHERE document_number = ?',
        [documentNumber]
      );
      
      if (!result.length) {
        return null;
      }
      
      return await this.findById(result[0].id);
    } catch (error) {
      logger.error(`Error al obtener documento legal por número: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crear un nuevo documento legal
   * @param {Object} documentData - Datos del documento
   * @param {Array} detailsData - Detalles del documento
   * @param {number} userId - ID del usuario que crea el documento
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(documentData, detailsData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Generar número de documento si no se proporciona
      if (!documentData.document_number) {
        documentData.document_number = await DocumentType.generateNextNumber(documentData.document_type_id);
      }
      
      // Calcular totales si no se proporcionan
      if (!documentData.total_amount) {
        let total = 0;
        
        detailsData.forEach(detail => {
          total += parseFloat(detail.amount || 0);
        });
        
        documentData.total_amount = total;
      }
      
      // Insertar el encabezado del documento
      const [headerResult] = await connection.query(
        `INSERT INTO legal_documents (
          document_type_id, document_number, date, due_date, reference,
          entity_type, entity_id, entity_name, total_amount, tax_amount,
          description, status, currency_id, exchange_rate, 
          fiscal_period_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          documentData.document_type_id,
          documentData.document_number,
          documentData.date,
          documentData.due_date || null,
          documentData.reference || null,
          documentData.entity_type,
          documentData.entity_id,
          documentData.entity_name,
          documentData.total_amount,
          documentData.tax_amount || 0,
          documentData.description || null,
          documentData.status || 'draft',
          documentData.currency_id,
          documentData.exchange_rate || 1,
          documentData.fiscal_period_id,
          userId
        ]
      );
      
      const documentId = headerResult.insertId;
      
      // Insertar los detalles del documento
      for (let i = 0; i < detailsData.length; i++) {
        const detail = detailsData[i];
        
        await connection.query(
          `INSERT INTO legal_document_details (
            document_id, line_number, description, quantity,
            unit_price, amount, tax_percentage, tax_amount,
            discount_percentage, discount_amount, account_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            documentId,
            i + 1,
            detail.description,
            detail.quantity || 1,
            detail.unit_price || detail.amount,
            detail.amount,
            detail.tax_percentage || 0,
            detail.tax_amount || 0,
            detail.discount_percentage || 0,
            detail.discount_amount || 0,
            detail.account_id || null
          ]
        );
      }
      
      await connection.commit();
      
      // Devolver el documento creado con su ID asignado
      return {
        id: documentId,
        document_number: documentData.document_number,
        ...documentData,
        details: detailsData.map((detail, index) => ({
          ...detail,
          document_id: documentId,
          line_number: index + 1
        }))
      };
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
   * @param {number} id - ID del documento
   * @param {Object} documentData - Datos del documento a actualizar
   * @param {Array} detailsData - Detalles del documento
   * @param {number} userId - ID del usuario que actualiza el documento
   * @returns {Promise<boolean>} Resultado de la actualización
   */
  static async update(id, documentData, detailsData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el documento existe y su estado
      const [docCheck] = await connection.query(
        'SELECT status FROM legal_documents WHERE id = ?',
        [id]
      );
      
      if (!docCheck.length) {
        throw new Error(`Documento legal con ID ${id} no encontrado`);
      }
      
      if (docCheck[0].status !== 'draft') {
        throw new Error('Solo se pueden modificar documentos en estado borrador');
      }
      
      // Calcular totales si no se proporcionan
      if (!documentData.total_amount) {
        let total = 0;
        
        detailsData.forEach(detail => {
          total += parseFloat(detail.amount || 0);
        });
        
        documentData.total_amount = total;
      }
      
      // Actualizar el encabezado del documento
      await connection.query(
        `UPDATE legal_documents SET
          date = ?,
          due_date = ?,
          reference = ?,
          entity_type = ?,
          entity_id = ?,
          entity_name = ?,
          total_amount = ?,
          tax_amount = ?,
          description = ?,
          currency_id = ?,
          exchange_rate = ?,
          fiscal_period_id = ?,
          updated_at = NOW(),
          updated_by = ?
        WHERE id = ?`,
        [
          documentData.date,
          documentData.due_date || null,
          documentData.reference || null,
          documentData.entity_type,
          documentData.entity_id,
          documentData.entity_name,
          documentData.total_amount,
          documentData.tax_amount || 0,
          documentData.description || null,
          documentData.currency_id,
          documentData.exchange_rate || 1,
          documentData.fiscal_period_id,
          userId,
          id
        ]
      );
      
      // Eliminar los detalles actuales
      await connection.query(
        'DELETE FROM legal_document_details WHERE document_id = ?',
        [id]
      );
      
      // Insertar los nuevos detalles
      for (let i = 0; i < detailsData.length; i++) {
        const detail = detailsData[i];
        
        await connection.query(
          `INSERT INTO legal_document_details (
            document_id, line_number, description, quantity,
            unit_price, amount, tax_percentage, tax_amount,
            discount_percentage, discount_amount, account_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            i + 1,
            detail.description,
            detail.quantity || 1,
            detail.unit_price || detail.amount,
            detail.amount,
            detail.tax_percentage || 0,
            detail.tax_amount || 0,
            detail.discount_percentage || 0,
            detail.discount_amount || 0,
            detail.account_id || null
          ]
        );
      }
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar documento legal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Aprobar un documento legal
   * @param {number} id - ID del documento legal
   * @param {number} userId - ID del usuario que aprueba el documento
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async approve(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el documento existe y su estado
      const [docCheck] = await connection.query(
        'SELECT status FROM legal_documents WHERE id = ?',
        [id]
      );
      
      if (!docCheck.length) {
        throw new Error(`Documento legal con ID ${id} no encontrado`);
      }
      
      if (docCheck[0].status !== 'draft') {
        throw new Error('El documento ya ha sido procesado previamente');
      }
      
      // Verificar que el documento tenga detalles
      const [detailCount] = await connection.query(
        'SELECT COUNT(*) as count FROM legal_document_details WHERE document_id = ?',
        [id]
      );
      
      if (detailCount[0].count === 0) {
        throw new Error('No se puede aprobar un documento sin detalles');
      }
      
      // Actualizar el estado del documento a "approved"
      await connection.query(
        `UPDATE legal_documents SET
          status = 'approved',
          approved_at = NOW(),
          approved_by = ?
        WHERE id = ?`,
        [userId, id]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al aprobar documento legal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Anular un documento legal
   * @param {number} id - ID del documento legal
   * @param {string} reason - Motivo de la anulación
   * @param {number} userId - ID del usuario que anula el documento
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async cancel(id, reason, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el documento existe y su estado
      const [docCheck] = await connection.query(
        'SELECT status FROM legal_documents WHERE id = ?',
        [id]
      );
      
      if (!docCheck.length) {
        throw new Error(`Documento legal con ID ${id} no encontrado`);
      }
      
      if (docCheck[0].status === 'cancelled') {
        throw new Error('El documento ya ha sido anulado previamente');
      }
      
      // Verificar si hay comprobantes asociados y su estado
      const [vouchersCheck] = await connection.query(
        `SELECT id, status
         FROM accounting_vouchers
         WHERE document_type_id = (SELECT document_type_id FROM legal_documents WHERE id = ?)
         AND document_id = ?`,
        [id, id]
      );
      
      for (const voucher of vouchersCheck) {
        if (voucher.status === 'posted') {
          throw new Error('No se puede anular el documento porque tiene comprobantes contabilizados asociados');
        }
      }
      
      // Actualizar el estado del documento a "cancelled"
      await connection.query(
        `UPDATE legal_documents SET
          status = 'cancelled',
          cancellation_reason = ?,
          cancelled_at = NOW(),
          cancelled_by = ?
        WHERE id = ?`,
        [reason, userId, id]
      );
      
      // Anular los comprobantes asociados
      for (const voucher of vouchersCheck) {
        await connection.query(
          `UPDATE accounting_vouchers SET
            status = 'cancelled',
            cancellation_reason = ?,
            cancelled_at = NOW(),
            cancelled_by = ?
          WHERE id = ?`,
          [`Anulación automática por cancelación del documento ${id}`, userId, voucher.id]
        );
      }
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al anular documento legal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Generar comprobante contable a partir de un documento legal
   * @param {number} id - ID del documento legal
   * @param {number} voucherTypeId - ID del tipo de comprobante a generar
   * @param {number} userId - ID del usuario que genera el comprobante
   * @returns {Promise<Object>} Resultado de la operación con el ID del comprobante generado
   */
  static async generateVoucher(id, voucherTypeId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el documento existe y su estado
      const [documentCheck] = await connection.query(
        `SELECT ld.*, dt.name as document_type_name
         FROM legal_documents ld
         JOIN document_types dt ON ld.document_type_id = dt.id
         WHERE ld.id = ?`,
        [id]
      );
      
      if (!documentCheck.length) {
        throw new Error(`Documento legal con ID ${id} no encontrado`);
      }
      
      const document = documentCheck[0];
      
      if (document.status !== 'approved') {
        throw new Error('Solo se pueden generar comprobantes para documentos aprobados');
      }
      
      // Verificar si ya existe un comprobante del mismo tipo para este documento
      const [existingVoucher] = await connection.query(
        `SELECT id FROM accounting_vouchers
         WHERE document_type_id = ? AND document_id = ? AND voucher_type_id = ?`,
        [document.document_type_id, id, voucherTypeId]
      );
      
      if (existingVoucher.length > 0) {
        throw new Error('Ya existe un comprobante de este tipo para el documento');
      }
      
      // Obtener los detalles del documento
      const [details] = await connection.query(
        `SELECT * FROM legal_document_details WHERE document_id = ?`,
        [id]
      );
      
      // Obtener información del tipo de comprobante
      const [voucherTypeInfo] = await connection.query(
        `SELECT * FROM voucher_types WHERE id = ?`,
        [voucherTypeId]
      );
      
      if (!voucherTypeInfo.length) {
        throw new Error('Tipo de comprobante no encontrado');
      }
      
      // Generar número para el comprobante
      const Voucher = require('../voucherModel');
      const VoucherType = require('../voucherTypeModel');
      
      const voucherNumber = await VoucherType.generateNextNumber(voucherTypeId);
      
      // Preparar datos del comprobante y sus líneas
      const voucherData = {
        voucher_type_id: voucherTypeId,
        voucher_number: voucherNumber,
        date: document.date,
        description: `Comprobante generado a partir del documento ${document.document_type_name} ${document.document_number}`,
        reference: document.reference,
        currency_id: document.currency_id,
        exchange_rate: document.exchange_rate,
        document_type_id: document.document_type_id,
        document_id: id,
        document_number: document.document_number,
        total_amount: document.total_amount,
        fiscal_period_id: document.fiscal_period_id,
        entity_type: document.entity_type,
        entity_id: document.entity_id,
        entity_name: document.entity_name,
        status: 'draft'
      };
      
      // Las líneas del comprobante dependen del tipo de documento
      // Este es un modelo genérico, la implementación específica deberá hacerse según las reglas de negocio
      // Por ahora, solo creamos líneas básicas a partir de los detalles del documento
      
      const voucherLines = [];
      
      // Crear comprobante usando el modelo de comprobantes
      const result = await Voucher.create(voucherData, voucherLines, userId);
      
      await connection.commit();
      
      return {
        document_id: id,
        voucher_id: result.id,
        voucher_number: voucherNumber
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al generar comprobante desde documento legal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = LegalDocument; 