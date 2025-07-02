/**
 * Controlador para la gestión de documentos de créditos hipotecarios
 * @module controllers/Creditos/MortgageDocumentsController
 */

const MortgageDocuments = require('../../models/Creditos/MortgageDocumentsModel');
const logger = require('../../utils/logger');

/**
 * Clase controladora para documentos de créditos hipotecarios
 */
class MortgageDocumentsController {

  /**
   * Obtener todos los documentos con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = {
        mortgage_id: req.query.mortgage_id,
        credit_number: req.query.credit_number,
        document_type_id: req.query.document_type_id,
        category_id: req.query.category_id,
        document_number: req.query.document_number,
        status: req.query.status,
        is_verified: req.query.is_verified !== undefined ? req.query.is_verified === 'true' : undefined,
        verified_by: req.query.verified_by,
        file_type: req.query.file_type,
        document_date_from: req.query.document_date_from,
        document_date_to: req.query.document_date_to,
        expiry_date_from: req.query.expiry_date_from,
        expiry_date_to: req.query.expiry_date_to,
        expired_documents: req.query.expired_documents !== undefined ? req.query.expired_documents === 'true' : undefined,
        limit: req.query.limit
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      const documents = await MortgageDocuments.getAll(filters);

      res.status(200).json({
        success: true,
        message: 'Documentos de créditos obtenidos exitosamente',
        data: documents,
        filters_applied: filters,
        count: documents.length
      });

    } catch (error) {
      logger.error(`Error en getAll documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener un documento específico por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const document = await MortgageDocuments.getById(parseInt(id));

      if (!document) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el documento con ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Documento obtenido exitosamente',
        data: document
      });

    } catch (error) {
      logger.error(`Error en getById documento: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener documentos por ID de crédito hipotecario
   */
  static async getByMortgageId(req, res) {
    try {
      const { mortgageId } = req.params;

      // Validar ID
      if (!mortgageId || isNaN(parseInt(mortgageId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de crédito hipotecario inválido'
        });
      }

      const documents = await MortgageDocuments.getByMortgageId(parseInt(mortgageId));

      res.status(200).json({
        success: true,
        message: 'Documentos del crédito obtenidos exitosamente',
        data: documents,
        count: documents.length
      });

    } catch (error) {
      logger.error(`Error en getByMortgageId: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener documentos por tipo de documento
   */
  static async getByDocumentTypeId(req, res) {
    try {
      const { documentTypeId } = req.params;

      // Validar ID
      if (!documentTypeId || isNaN(parseInt(documentTypeId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de documento inválido'
        });
      }

      const documents = await MortgageDocuments.getByDocumentTypeId(parseInt(documentTypeId));

      res.status(200).json({
        success: true,
        message: 'Documentos del tipo obtenidos exitosamente',
        data: documents,
        count: documents.length
      });

    } catch (error) {
      logger.error(`Error en getByDocumentTypeId: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener documentos vencidos
   */
  static async getExpiredDocuments(req, res) {
    try {
      const documents = await MortgageDocuments.getExpiredDocuments();

      res.status(200).json({
        success: true,
        message: 'Documentos vencidos obtenidos exitosamente',
        data: documents,
        count: documents.length
      });

    } catch (error) {
      logger.error(`Error en getExpiredDocuments: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener documentos próximos a vencer
   */
  static async getDocumentsExpiringSoon(req, res) {
    try {
      const daysAhead = req.query.days_ahead ? parseInt(req.query.days_ahead) : 30;

      if (daysAhead < 1 || daysAhead > 365) {
        return res.status(400).json({
          success: false,
          message: 'Los días de anticipación deben estar entre 1 y 365'
        });
      }

      const documents = await MortgageDocuments.getDocumentsExpiringSoon(daysAhead);

      res.status(200).json({
        success: true,
        message: `Documentos que vencen en los próximos ${daysAhead} días obtenidos exitosamente`,
        data: documents,
        count: documents.length,
        days_ahead: daysAhead
      });

    } catch (error) {
      logger.error(`Error en getDocumentsExpiringSoon: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear un nuevo documento de crédito
   */
  static async create(req, res) {
    try {
      const documentData = req.body;

      // Validaciones básicas
      const validationErrors = MortgageDocumentsController.validateDocumentData(documentData, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que crea
      documentData.created_by = req.user.id;

      const newDocument = await MortgageDocuments.create(documentData);

      res.status(201).json({
        success: true,
        message: 'Documento creado exitosamente',
        data: newDocument
      });

    } catch (error) {
      logger.error(`Error en create documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') || error.message.includes('no está activo')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar un documento existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const documentData = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      // Validaciones básicas
      const validationErrors = MortgageDocumentsController.validateDocumentData(documentData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que actualiza
      documentData.updated_by = req.user.id;

      const updatedDocument = await MortgageDocuments.update(parseInt(id), documentData);

      res.status(200).json({
        success: true,
        message: 'Documento actualizado exitosamente',
        data: updatedDocument
      });

    } catch (error) {
      logger.error(`Error en update documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verificar un documento
   */
  static async verifyDocument(req, res) {
    try {
      const { id } = req.params;
      const { validation_notes } = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const verifiedDocument = await MortgageDocuments.verifyDocument(
        parseInt(id), 
        req.user.id, 
        validation_notes
      );

      res.status(200).json({
        success: true,
        message: 'Documento verificado exitosamente',
        data: verifiedDocument
      });

    } catch (error) {
      logger.error(`Error en verifyDocument: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Solo se pueden verificar')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Rechazar un documento
   */
  static async rejectDocument(req, res) {
    try {
      const { id } = req.params;
      const { validation_notes } = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      // Validar notas de validación
      if (!validation_notes || validation_notes.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Las notas de validación son obligatorias para rechazar un documento'
        });
      }

      const rejectedDocument = await MortgageDocuments.rejectDocument(
        parseInt(id), 
        req.user.id, 
        validation_notes.trim()
      );

      res.status(200).json({
        success: true,
        message: 'Documento rechazado exitosamente',
        data: rejectedDocument
      });

    } catch (error) {
      logger.error(`Error en rejectDocument: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Marcar documentos como vencidos
   */
  static async markExpiredDocuments(req, res) {
    try {
      const result = await MortgageDocuments.markExpiredDocuments();

      res.status(200).json({
        success: true,
        message: 'Proceso de marcado de documentos vencidos completado',
        data: result
      });

    } catch (error) {
      logger.error(`Error en markExpiredDocuments: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar un documento
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de documento inválido'
        });
      }

      const result = await MortgageDocuments.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Documento eliminado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en delete documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de documentos
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await MortgageDocuments.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: statistics
      });

    } catch (error) {
      logger.error(`Error en getStatistics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener opciones para formularios
   */
  static async getFormOptions(req, res) {
    try {
      const options = await MortgageDocuments.getFormOptions();

      res.status(200).json({
        success: true,
        message: 'Opciones para formularios obtenidas exitosamente',
        data: options
      });

    } catch (error) {
      logger.error(`Error en getFormOptions: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validar datos de documento
   * @param {Object} data - Datos a validar
   * @param {boolean} isUpdate - Indica si es una actualización
   * @returns {Array} Lista de errores de validación
   */
  static validateDocumentData(data, isUpdate = false) {
    const errors = [];

    // Validaciones obligatorias para creación
    if (!isUpdate) {
      if (!data.mortgage_id || isNaN(parseInt(data.mortgage_id))) {
        errors.push('El ID del crédito hipotecario es obligatorio y debe ser un número');
      }
      
      if (!data.document_type_id || isNaN(parseInt(data.document_type_id))) {
        errors.push('El ID del tipo de documento es obligatorio y debe ser un número');
      }
    }

    // Validaciones de número de documento
    if (data.document_number && data.document_number.length > 50) {
      errors.push('El número de documento no puede exceder 50 caracteres');
    }

    // Validaciones de fechas
    if (data.document_date) {
      const docDate = new Date(data.document_date);
      if (isNaN(docDate.getTime())) {
        errors.push('Fecha de documento inválida');
      } else if (docDate > new Date()) {
        errors.push('La fecha del documento no puede ser futura');
      }
    }

    if (data.expiry_date) {
      const expiryDate = new Date(data.expiry_date);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Fecha de vencimiento inválida');
      } else if (data.document_date) {
        const docDate = new Date(data.document_date);
        if (expiryDate <= docDate) {
          errors.push('La fecha de vencimiento debe ser posterior a la fecha del documento');
        }
      }
    }

    // Validaciones de archivo
    if (data.file_name && data.file_name.length > 255) {
      errors.push('El nombre del archivo no puede exceder 255 caracteres');
    }

    if (data.file_path && data.file_path.length > 500) {
      errors.push('La ruta del archivo no puede exceder 500 caracteres');
    }

    if (data.file_size !== undefined && data.file_size !== null) {
      if (isNaN(parseInt(data.file_size))) {
        errors.push('El tamaño del archivo debe ser un número');
      } else if (parseInt(data.file_size) < 0) {
        errors.push('El tamaño del archivo no puede ser negativo');
      } else if (parseInt(data.file_size) > 104857600) { // 100MB en bytes
        errors.push('El tamaño del archivo no puede exceder 100MB');
      }
    }

    if (data.file_type) {
      const validTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
      if (!validTypes.includes(data.file_type.toLowerCase())) {
        errors.push(`Tipo de archivo no válido. Tipos permitidos: ${validTypes.join(', ')}`);
      }
    }

    // Validaciones de descripción
    if (data.description && data.description.length > 1000) {
      errors.push('La descripción no puede exceder 1000 caracteres');
    }

    // Validaciones de estado
    if (data.status) {
      const validStatuses = ['pending', 'uploaded', 'validated', 'expired', 'rejected'];
      if (!validStatuses.includes(data.status)) {
        errors.push(`Estado inválido. Estados válidos: ${validStatuses.join(', ')}`);
      }
    }

    // Validaciones de notas de validación
    if (data.validation_notes && data.validation_notes.length > 1000) {
      errors.push('Las notas de validación no pueden exceder 1000 caracteres');
    }

    // Validaciones de booleanos
    if (data.is_verified !== undefined && typeof data.is_verified !== 'boolean') {
      errors.push('El campo is_verified debe ser verdadero o falso');
    }

    return errors;
  }
}

module.exports = MortgageDocumentsController; 