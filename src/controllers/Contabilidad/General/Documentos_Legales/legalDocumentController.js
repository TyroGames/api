/**
 * Controlador para gestionar los documentos legales
 * @module controllers/Contabilidad/General/Documentos_Legales/legalDocumentController
 */

const LegalDocument = require('../../../../models/Contabilidad/General/Documentos_Legales/legalDocumentModel');
const Voucher = require('../../../../models/Contabilidad/General/Comprobantes_Contables/voucherModel');
const logger = require('../../../../utils/logger');
const path = require('path');

/**
 * Clase de controlador para gestionar documentos legales
 */
class LegalDocumentController {
  /**
   * Obtener todos los documentos legales con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const documents = await LegalDocument.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: documents,
        count: documents.length,
        message: 'Documentos legales obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener documentos legales: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener documentos legales',
        error: error.message
      });
    }
  }

  /**
   * Obtener un documento legal por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: document,
        message: 'Documento legal obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener documento legal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener documento legal',
        error: error.message
      });
    }
  }

  /**
   * Obtener un documento legal por tipo y número
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByTipoNumero(req, res) {
    try {
      const { tipo, numero } = req.params;
      const document = await LegalDocument.getByTipoNumero(tipo, numero);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento tipo ${tipo} número ${numero} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: document,
        message: 'Documento legal obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener documento por tipo y número: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener documento legal',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los tipos de documentos legales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllDocumentTypes(req, res) {
    try {
      const types = await LegalDocument.getAllDocumentTypes();
      
      res.status(200).json({
        success: true,
        data: types,
        count: types.length,
        message: 'Tipos de documentos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de documentos',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const documentData = {
        ...req.body,
        uploaded_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!documentData.document_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de documento es requerido'
        });
      }
      
      if (!documentData.document_number) {
        return res.status(400).json({
          success: false,
          message: 'El número de documento es requerido'
        });
      }
      
      if (!documentData.document_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha del documento es requerida'
        });
      }
      
      // Manejar carga de archivo si existe
      let fileData = null;
      if (req.file) {
        fileData = req.file;
      }
      
      const newDocument = await LegalDocument.create(documentData, fileData);
      
      res.status(201).json({
        success: true,
        data: newDocument,
        message: 'Documento legal creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear documento legal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear documento legal',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const documentData = req.body;
      
      // Validar que el documento exista
      const existingDocument = await LegalDocument.getById(id);
      if (!existingDocument) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Manejar carga de archivo si existe
      let fileData = null;
      if (req.file) {
        fileData = req.file;
      }
      
      const updatedDocument = await LegalDocument.update(id, documentData, fileData);
      
      res.status(200).json({
        success: true,
        data: updatedDocument,
        message: 'Documento legal actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar documento legal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar documento legal',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado de un documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { newStatus, comments } = req.body;
      
      // Validar datos requeridos
      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo estado es requerido'
        });
      }
      
      // Validar que el estado sea válido
      const validStatus = ['ACTIVE', 'CANCELLED'];
      if (!validStatus.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Estado no válido. Estados permitidos: ${validStatus.join(', ')}`
        });
      }
      
      // Validar que el documento exista
      const existingDocument = await LegalDocument.getById(id);
      if (!existingDocument) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      const result = await LegalDocument.changeStatus(id, newStatus, req.user.id, comments || '');
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Estado del documento cambiado a ${newStatus} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del documento ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del documento',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el documento exista
      const existingDocument = await LegalDocument.getById(id);
      if (!existingDocument) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      const result = await LegalDocument.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Documento legal eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar documento legal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar documento legal',
        error: error.message
      });
    }
  }

  /**
   * Descargar un archivo de documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async downloadFile(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Verificar que tenga un archivo
      if (!document.file_path) {
        return res.status(404).json({
          success: false,
          message: 'Este documento no tiene un archivo adjunto'
        });
      }
      
      // Obtener la ruta completa del archivo
      const filePath = path.join(process.cwd(), document.file_path);
      
      // Enviar el archivo como descarga
      res.download(filePath, document.file_name);
    } catch (error) {
      logger.error(`Error al descargar archivo del documento ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al descargar archivo',
        error: error.message
      });
    }
  }

  /**
   * Asociar un documento legal a un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async associateWithVoucher(req, res) {
    try {
      const { id } = req.params;
      const { voucher_id } = req.body;
      
      // Validar datos requeridos
      if (!voucher_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del comprobante es requerido'
        });
      }
      
      // Validar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Validar que el comprobante exista
      const voucher = await Voucher.getById(voucher_id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${voucher_id} no encontrado`
        });
      }
      
      const result = await LegalDocument.associateWithVoucher(id, voucher_id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Documento asociado al comprobante correctamente'
      });
    } catch (error) {
      logger.error(`Error al asociar documento ${req.params.id} con comprobante: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al asociar documento con comprobante',
        error: error.message
      });
    }
  }

  /**
   * Desasociar un documento legal de un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async dissociateFromVoucher(req, res) {
    try {
      const { id, voucher_id } = req.params;
      
      // Validar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Validar que el comprobante exista
      const voucher = await Voucher.getById(voucher_id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${voucher_id} no encontrado`
        });
      }
      
      const result = await LegalDocument.dissociateFromVoucher(id, voucher_id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Documento desasociado del comprobante correctamente'
      });
    } catch (error) {
      logger.error(`Error al desasociar documento ${req.params.id} de comprobante ${req.params.voucher_id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al desasociar documento de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Obtener el historial de estados de un documento
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStatusHistory(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Obtener historial
      const history = await LegalDocument.getStatusHistory(id);
      
      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
        message: 'Historial de estados obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener historial de estados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de estados',
        error: error.message
      });
    }
  }

  /**
   * Obtener comprobantes asociados a un documento
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getRelatedVouchers(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Obtener comprobantes relacionados
      const vouchers = await LegalDocument.getRelatedVouchers(id);
      
      res.status(200).json({
        success: true,
        data: vouchers,
        count: vouchers.length,
        message: 'Comprobantes relacionados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener comprobantes relacionados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comprobantes relacionados',
        error: error.message
      });
    }
  }

  /**
   * Generar un comprobante contable a partir de un documento legal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateVoucher(req, res) {
    try {
      const { id } = req.params;
      const { voucher_type_id, fiscal_period_id, concept } = req.body;
      
      // Validar datos requeridos
      if (!voucher_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de comprobante es requerido'
        });
      }
      
      if (!fiscal_period_id) {
        return res.status(400).json({
          success: false,
          message: 'El periodo fiscal es requerido'
        });
      }
      
      // Verificar que el documento exista
      const document = await LegalDocument.getById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Documento legal con ID ${id} no encontrado`
        });
      }
      
      // Crear comprobante con datos del documento
      const voucherData = {
        voucher_type_id,
        date: document.document_date,
        fiscal_period_id,
        third_party_id: document.third_party_id,
        concept: concept || `Comprobante generado a partir del documento ${document.document_number}`,
        status: 'DRAFT',
        created_by: req.user.id
      };
      
      const newVoucher = await Voucher.create(voucherData);
      
      // Asociar documento con el comprobante
      await LegalDocument.associateWithVoucher(id, newVoucher.id, req.user.id);
      
      res.status(201).json({
        success: true,
        data: newVoucher,
        message: 'Comprobante generado y asociado correctamente'
      });
    } catch (error) {
      logger.error(`Error al generar comprobante desde documento ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar comprobante',
        error: error.message
      });
    }
  }
}

module.exports = LegalDocumentController; 