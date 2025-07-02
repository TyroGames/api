/**
 * Controlador para gestionar los comprobantes contables
 * @module controllers/Contabilidad/General/Comprobantes_Contables/voucherController
 */

const Voucher = require('../../../../models/Contabilidad/General/Comprobantes_Contables/voucherModel');
const VoucherType = require('../../../../models/Contabilidad/General/Comprobantes_Contables/voucherTypeModel');
const VoucherTemplate = require('../../../../models/Contabilidad/General/Comprobantes_Contables/voucherTemplateModel');
const VoucherPdfService = require('../../../../services/reports/voucherPdfService');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar comprobantes contables
 */
class VoucherController {
  /**
   * Obtener todos los comprobantes contables con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const vouchers = await Voucher.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: vouchers,
        count: vouchers.length,
        message: 'Comprobantes contables obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener comprobantes contables: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comprobantes contables',
        error: error.message
      });
    }
  }

  /**
   * Obtener un comprobante contable por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const voucher = await Voucher.getById(id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: voucher,
        message: 'Comprobante contable obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener comprobante contable ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Obtener un comprobante contable por tipo y consecutivo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByTypeAndConsecutive(req, res) {
    try {
      const { type, consecutive } = req.params;
      const voucher = await Voucher.getByTipoConsecutivo(type, consecutive);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable tipo ${type} consecutivo ${consecutive} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: voucher,
        message: 'Comprobante contable obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener comprobante contable tipo ${req.params.type} consecutivo ${req.params.consecutive}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los tipos de comprobantes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllTypes(req, res) {
    try {
      const types = await Voucher.getAllTypes();
      
      res.status(200).json({
        success: true,
        data: types,
        count: types.length,
        message: 'Tipos de comprobantes obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de comprobantes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const voucherData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!voucherData.voucher_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de comprobante es requerido'
        });
      }
      
      if (!voucherData.date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha del comprobante es requerida'
        });
      }
      
      if (!voucherData.fiscal_period_id) {
        return res.status(400).json({
          success: false,
          message: 'El periodo fiscal es requerido'
        });
      }
      
      // Formatear y validar campos adicionales
      if (voucherData.voucher_number) {
        // Si se proporciona un voucher_number, validar que tenga un formato válido
        if (!/^[A-Z0-9\-]{1,50}$/.test(voucherData.voucher_number)) {
          return res.status(400).json({
            success: false,
            message: 'El número de comprobante tiene un formato inválido'
          });
        }
      }
      
      // Validar las líneas del comprobante si están presentes
      if (voucherData.voucher_lines && Array.isArray(voucherData.voucher_lines)) {
        // Validar que haya al menos una línea
        if (voucherData.voucher_lines.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El comprobante debe tener al menos una línea'
          });
        }

        // Validar cada línea
        for (let i = 0; i < voucherData.voucher_lines.length; i++) {
          const line = voucherData.voucher_lines[i];
          
          if (!line.account_id) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener una cuenta contable`
            });
          }

          const debitAmount = parseFloat(line.debit_amount || 0);
          const creditAmount = parseFloat(line.credit_amount || 0);

          if (debitAmount === 0 && creditAmount === 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener un monto de débito o crédito`
            });
          }

          if (debitAmount > 0 && creditAmount > 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
            });
          }
        }

        // Verificar cuadre del comprobante
        let totalDebit = 0;
        let totalCredit = 0;

        voucherData.voucher_lines.forEach(line => {
          totalDebit += parseFloat(line.debit_amount || 0);
          totalCredit += parseFloat(line.credit_amount || 0);
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return res.status(400).json({
            success: false,
            message: 'El comprobante no está cuadrado. El total de débitos debe ser igual al total de créditos.'
          });
        }

        // Actualizar los totales en el objeto voucherData
        voucherData.total_debit = totalDebit;
        voucherData.total_credit = totalCredit;
        voucherData.total_amount = totalDebit;
      } else {
        // Si no hay líneas pero hay totales, verificar que coincidan
      if (voucherData.total_debit !== voucherData.total_credit) {
        return res.status(400).json({
          success: false,
          message: 'Los totales de débito y crédito deben ser iguales'
        });
        }
      }
      
      // Establecer el total_amount como el total de débitos (o créditos, es el mismo valor)
      if (!voucherData.total_amount && voucherData.total_debit) {
        voucherData.total_amount = voucherData.total_debit;
      }
      
      const newVoucher = await Voucher.create(voucherData);
      
      res.status(201).json({
        success: true,
        data: newVoucher,
        message: 'Comprobante contable creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear comprobante contable: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const voucherData = {
        ...req.body,
        updated_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar que el comprobante exista
      const existingVoucher = await Voucher.getById(id);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Validar que el comprobante esté en estado DRAFT para poder modificarlo
      if (existingVoucher.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden modificar comprobantes en estado DRAFT'
        });
      }
      
      // Validar las líneas del comprobante si están presentes
      if (voucherData.voucher_lines && Array.isArray(voucherData.voucher_lines)) {
        // Validar que haya al menos una línea
        if (voucherData.voucher_lines.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'El comprobante debe tener al menos una línea'
          });
        }

        // Validar cada línea
        for (let i = 0; i < voucherData.voucher_lines.length; i++) {
          const line = voucherData.voucher_lines[i];
          
          if (!line.account_id) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener una cuenta contable`
            });
          }

          const debitAmount = parseFloat(line.debit_amount || 0);
          const creditAmount = parseFloat(line.credit_amount || 0);

          if (debitAmount === 0 && creditAmount === 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener un monto de débito o crédito`
            });
          }

          if (debitAmount > 0 && creditAmount > 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
            });
          }
        }

        // Verificar cuadre del comprobante
        let totalDebit = 0;
        let totalCredit = 0;

        voucherData.voucher_lines.forEach(line => {
          totalDebit += parseFloat(line.debit_amount || 0);
          totalCredit += parseFloat(line.credit_amount || 0);
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return res.status(400).json({
            success: false,
            message: 'El comprobante no está cuadrado. El total de débitos debe ser igual al total de créditos.'
          });
        }

        // Actualizar los totales en el objeto voucherData
        voucherData.total_debit = totalDebit;
        voucherData.total_credit = totalCredit;
        voucherData.total_amount = totalDebit;
      } else {
        // Si no hay líneas pero hay totales, verificar que coincidan
      if (voucherData.total_debit !== voucherData.total_credit) {
        return res.status(400).json({
          success: false,
          message: 'Los totales de débito y crédito deben ser iguales'
        });
        }
      }
      
      // Establecer el total_amount como el total de débitos (o créditos, es el mismo valor)
      if (!voucherData.total_amount && voucherData.total_debit) {
        voucherData.total_amount = voucherData.total_debit;
      }
      
      const updatedVoucher = await Voucher.updateWithLines(id, voucherData);
      
      res.status(200).json({
        success: true,
        data: updatedVoucher,
        message: 'Comprobante contable actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar comprobante contable ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado de un comprobante contable
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
      const validStatus = ['DRAFT', 'VALIDATED', 'APPROVED', 'CANCELLED'];
      if (!validStatus.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Estado no válido. Estados permitidos: ${validStatus.join(', ')}`
        });
      }
      
      // Validar que el comprobante exista
      const existingVoucher = await Voucher.getById(id);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      const result = await Voucher.changeStatus(id, newStatus, req.user.id, comments || '');
      
      // Mensaje personalizado según el nuevo estado
      let statusMessage = `Estado del comprobante cambiado a ${newStatus} correctamente`;
      if (newStatus === 'APPROVED') {
        statusMessage = 'Comprobante aprobado correctamente';
      } else if (newStatus === 'VALIDATED') {
        statusMessage = 'Comprobante validado correctamente';
      } else if (newStatus === 'CANCELLED') {
        statusMessage = 'Comprobante anulado correctamente';
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: statusMessage
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del comprobante ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del comprobante',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el comprobante exista
      const existingVoucher = await Voucher.getById(id);
      if (!existingVoucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Validar que el comprobante esté en estado DRAFT para poder eliminarlo
      if (existingVoucher.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar comprobantes en estado DRAFT'
        });
      }
      
      const result = await Voucher.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Comprobante contable eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar comprobante contable ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Generar consecutivo para un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateConsecutive(req, res) {
    try {
      const { voucher_type_id } = req.params;
      
      // Generar consecutivo
      const consecutive = await Voucher.generateConsecutivo(voucher_type_id);
      
      res.status(200).json({
        success: true,
        data: { consecutive },
        message: 'Consecutivo generado correctamente'
      });
    } catch (error) {
      logger.error(`Error al generar consecutivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar consecutivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener el historial de estados de un comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStatusHistory(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener historial
      const history = await Voucher.getStatusHistory(id);
      
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
   * Obtener asientos contables asociados a un comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getRelatedJournalEntries(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener asientos relacionados
      const entries = await Voucher.getRelatedJournalEntries(id);
      
      res.status(200).json({
        success: true,
        data: entries,
        count: entries.length,
        message: 'Asientos contables relacionados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener asientos contables relacionados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener asientos contables relacionados',
        error: error.message
      });
    }
  }

  /**
   * Obtener documentos asociados a un comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getRelatedDocuments(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener documentos relacionados
      const documents = await Voucher.getRelatedDocuments(id);
      
      res.status(200).json({
        success: true,
        data: documents,
        count: documents.length,
        message: 'Documentos relacionados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener documentos relacionados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener documentos relacionados',
        error: error.message
      });
    }
  }

  /**
   * Asociar un asiento contable a un comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async associateJournalEntry(req, res) {
    try {
      const { id } = req.params;
      const { journal_entry_id } = req.body;
      
      // Validar datos requeridos
      if (!journal_entry_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del asiento contable es requerido'
        });
      }
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Verificar que el comprobante esté en estado VALIDATED o APPROVED
      if (voucher.status !== 'VALIDATED' && voucher.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden asociar asientos a comprobantes validados o aprobados'
        });
      }
      
      // Asociar asiento contable
      const result = await Voucher.associateJournalEntry(id, journal_entry_id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Asiento contable asociado correctamente'
      });
    } catch (error) {
      logger.error(`Error al asociar asiento contable: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al asociar asiento contable',
        error: error.message
      });
    }
  }

  /**
   * Asociar un documento legal a un comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async associateDocument(req, res) {
    try {
      const { id } = req.params;
      const { legal_document_id } = req.body;
      
      // Validar datos requeridos
      if (!legal_document_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del documento legal es requerido'
        });
      }
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Asociar documento legal
      const result = await Voucher.associateDocument(id, legal_document_id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Documento legal asociado correctamente'
      });
    } catch (error) {
      logger.error(`Error al asociar documento legal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al asociar documento legal',
        error: error.message
      });
    }
  }

  /**
   * Aprobación masiva de comprobantes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async bulkApprove(req, res) {
    try {
      const { voucher_ids, comments } = req.body;
      
      // Validar datos requeridos
      if (!voucher_ids || !Array.isArray(voucher_ids) || voucher_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere al menos un ID de comprobante para aprobación masiva'
        });
      }
      
      // Aprobar comprobantes en masa
      const results = [];
      const errors = [];
      
      // Realizar la aprobación en una transacción para garantizar integridad
      for (const id of voucher_ids) {
        try {
          const result = await Voucher.changeStatus(id, 'APPROVED', req.user.id, comments || 'Aprobación masiva');
          results.push({ id, status: 'success', data: result });
        } catch (error) {
          errors.push({ id, status: 'error', message: error.message });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          success_count: results.length,
          error_count: errors.length,
          results,
          errors
        },
        message: `${results.length} comprobantes aprobados correctamente, ${errors.length} con errores`
      });
    } catch (error) {
      logger.error(`Error en aprobación masiva de comprobantes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error en aprobación masiva de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Generar comprobantes a partir de múltiples documentos (contabilización masiva)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async bulkGenerateFromDocuments(req, res) {
    try {
      const { document_ids, voucher_type_id, date, description, consolidate_by_account } = req.body;
      
      // Validar datos requeridos
      if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere al menos un ID de documento para contabilización masiva'
        });
      }
      
      if (!voucher_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de comprobante es requerido'
        });
      }
      
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha del comprobante es requerida'
        });
      }
      
      // Generar comprobante(s) a partir de los documentos
      const result = await Voucher.bulkGenerateFromDocuments({
        document_ids,
        voucher_type_id,
        date,
        description: description || 'Contabilización masiva de documentos',
        consolidate_by_account: consolidate_by_account || false,
        created_by: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Comprobante(s) generado(s) correctamente a partir de documentos'
      });
    } catch (error) {
      logger.error(`Error en contabilización masiva de documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error en contabilización masiva de documentos',
        error: error.message
      });
    }
  }

  /**
   * Generar comprobante de reversión
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateReversal(req, res) {
    try {
      const { id } = req.params;
      const { date, description, reverse_journal_entry } = req.body;
      
      // Validar datos requeridos
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de reversión es requerida'
        });
      }
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Verificar que el comprobante esté en estado APPROVED
      if (voucher.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden reversar comprobantes aprobados'
        });
      }
      
      // Generar comprobante de reversión
      const result = await Voucher.generateReversal({
        voucher_id: id,
        date,
        description: description || `Reversión del comprobante ${voucher.voucher_number || id}`,
        reverse_journal_entry: reverse_journal_entry !== false, // Por defecto, reversar también el asiento
        created_by: req.user.id
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Comprobante de reversión generado correctamente'
      });
    } catch (error) {
      logger.error(`Error al generar comprobante de reversión: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar comprobante de reversión',
        error: error.message
      });
    }
  }

  /**
   * Obtener líneas de un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getVoucherLines(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el comprobante exista
      const voucher = await Voucher.getById(id);
      
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener líneas del comprobante
      const lines = await Voucher.getVoucherLines(id);
      
      res.status(200).json({
        success: true,
        data: lines,
        count: lines.length,
        message: 'Líneas del comprobante obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener líneas del comprobante ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener líneas del comprobante',
        error: error.message
      });
    }
  }

  // ============================================================
  // Métodos para Tipos de Comprobantes
  // ============================================================

  /**
   * Obtener todos los tipos de comprobantes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllVoucherTypes(req, res) {
    try {
      const filters = {
        name: req.query.name,
        code: req.query.code,
        nature_id: req.query.nature_id,
        is_active: req.query.is_active
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const types = await VoucherType.findAll(filters);
      
      res.status(200).json({
        success: true,
        data: types,
        count: types.length,
        message: 'Tipos de comprobantes obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de comprobantes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tipo de comprobante por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getVoucherTypeById(req, res) {
    try {
      const { id } = req.params;
      
      const type = await VoucherType.findById(id);
      
      if (!type) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: type,
        message: 'Tipo de comprobante obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async createVoucherType(req, res) {
    try {
      const typeData = req.body;
      const userId = req.user.id;
      
      // Validar datos requeridos
      if (!typeData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código del tipo de comprobante es requerido'
        });
      }
      
      if (!typeData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo de comprobante es requerido'
        });
      }
      
      if (!typeData.nature_id) {
        return res.status(400).json({
          success: false,
          message: 'La naturaleza del comprobante es requerida'
        });
      }
      
      const newType = await VoucherType.create(typeData, userId);
      
      res.status(201).json({
        success: true,
        data: newType,
        message: 'Tipo de comprobante creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear tipo de comprobante: ${error.message}`);
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear tipo de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un tipo de comprobante existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updateVoucherType(req, res) {
    try {
      const { id } = req.params;
      const typeData = req.body;
      const userId = req.user.id;
      
      // Validar datos requeridos
      if (!typeData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código del tipo de comprobante es requerido'
        });
      }
      
      if (!typeData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo de comprobante es requerido'
        });
      }
      
      if (!typeData.nature_id) {
        return res.status(400).json({
          success: false,
          message: 'La naturaleza del comprobante es requerida'
        });
      }
      
      const updatedType = await VoucherType.update(id, typeData, userId);
      
      res.status(200).json({
        success: true,
        data: updatedType,
        message: 'Tipo de comprobante actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar tipo de comprobante: ${error.message}`);
      
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
        message: 'Error al actualizar tipo de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async deleteVoucherType(req, res) {
    try {
      const { id } = req.params;
      
      const result = await VoucherType.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Tipo de comprobante eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar tipo de comprobante: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tiene') && error.message.includes('comprobantes')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async toggleVoucherTypeActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser un valor booleano'
        });
      }
      
      const updatedType = await VoucherType.toggleActive(id, is_active);
      
      res.status(200).json({
        success: true,
        data: updatedType,
        message: `Tipo de comprobante ${is_active ? 'activado' : 'desactivado'} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del tipo de comprobante: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del tipo de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Obtener naturalezas de comprobantes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getVoucherNatures(req, res) {
    try {
      const natures = await VoucherType.getNatures();
      
      res.status(200).json({
        success: true,
        data: natures,
        count: natures.length,
        message: 'Naturalezas de comprobantes obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener naturalezas de comprobantes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener naturalezas de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Obtener todas las naturalezas de comprobantes con paginación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllVoucherNatures(req, res) {
    try {
      const filters = req.query;
      const natures = await VoucherType.getAllNatures(filters);
      
      res.status(200).json({
        success: true,
        data: natures,
        count: natures.length,
        message: 'Naturalezas de comprobantes obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener naturalezas de comprobantes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener naturalezas de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Obtener una naturaleza de comprobante por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getVoucherNatureById(req, res) {
    try {
      const { id } = req.params;
      const nature = await VoucherType.getNatureById(id);
      
      if (!nature) {
        return res.status(404).json({
          success: false,
          message: `Naturaleza de comprobante con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: nature,
        message: 'Naturaleza de comprobante obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener naturaleza de comprobante ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener naturaleza de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva naturaleza de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async createVoucherNature(req, res) {
    try {
      const natureData = req.body;
      
      // Validar datos requeridos
      if (!natureData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código de la naturaleza es requerido'
        });
      }
      
      if (!natureData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la naturaleza es requerido'
        });
      }
      
      if (!natureData.accounting_effect) {
        return res.status(400).json({
          success: false,
          message: 'El efecto contable es requerido'
        });
      }
      
      if (!['increase', 'decrease'].includes(natureData.accounting_effect)) {
        return res.status(400).json({
          success: false,
          message: 'El efecto contable debe ser "increase" o "decrease"'
        });
      }
      
      if (!natureData.financial_statement_section) {
        return res.status(400).json({
          success: false,
          message: 'La sección del estado financiero es requerida'
        });
      }
      
      const newNature = await VoucherType.createNature(natureData);
      
      res.status(201).json({
        success: true,
        data: newNature,
        message: 'Naturaleza de comprobante creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear naturaleza de comprobante: ${error.message}`);
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear naturaleza de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una naturaleza de comprobante existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updateVoucherNature(req, res) {
    try {
      const { id } = req.params;
      const natureData = req.body;
      
      // Validar datos requeridos
      if (!natureData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código de la naturaleza es requerido'
        });
      }
      
      if (!natureData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la naturaleza es requerido'
        });
      }
      
      if (!natureData.accounting_effect) {
        return res.status(400).json({
          success: false,
          message: 'El efecto contable es requerido'
        });
      }
      
      if (!['increase', 'decrease'].includes(natureData.accounting_effect)) {
        return res.status(400).json({
          success: false,
          message: 'El efecto contable debe ser "increase" o "decrease"'
        });
      }
      
      if (!natureData.financial_statement_section) {
        return res.status(400).json({
          success: false,
          message: 'La sección del estado financiero es requerida'
        });
      }
      
      const updatedNature = await VoucherType.updateNature(id, natureData);
      
      res.status(200).json({
        success: true,
        data: updatedNature,
        message: 'Naturaleza de comprobante actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar naturaleza de comprobante: ${error.message}`);
      
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
        message: 'Error al actualizar naturaleza de comprobante',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una naturaleza de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async deleteVoucherNature(req, res) {
    try {
      const { id } = req.params;
      
      const result = await VoucherType.deleteNature(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Naturaleza de comprobante eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar naturaleza de comprobante: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tiene') && error.message.includes('tipos')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar naturaleza de comprobante',
        error: error.message
      });
    }
  }

  // ============================================================
  // MÉTODOS PARA PLANTILLAS DE COMPROBANTES
  // ============================================================

  /**
   * Obtener todas las plantillas de comprobantes
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllTemplates(req, res) {
    try {
      const filters = req.query;
      const templates = await VoucherTemplate.findAll(filters);
      
      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
        message: 'Plantillas de comprobantes obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener plantillas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener plantillas de comprobantes',
        error: error.message
      });
    }
  }

  /**
   * Obtener una plantilla por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await VoucherTemplate.findById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: `Plantilla con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: template,
        message: 'Plantilla obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener plantilla ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener plantilla',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva plantilla
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async createTemplate(req, res) {
    try {
      const templateData = req.body;
      const userId = req.user.id;
      
      // Validar datos requeridos
      if (!templateData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la plantilla es requerido'
        });
      }
      
      if (!templateData.voucher_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de comprobante es requerido'
        });
      }
      
      // Validar líneas si existen
      if (templateData.lines && Array.isArray(templateData.lines)) {
        for (let i = 0; i < templateData.lines.length; i++) {
          const line = templateData.lines[i];
          
          if (!line.account_id) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener una cuenta contable`
            });
          }
          
          const debitAmount = parseFloat(line.debit_amount || 0);
          const creditAmount = parseFloat(line.credit_amount || 0);
          
          if (debitAmount < 0 || creditAmount < 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener montos negativos`
            });
          }
          
          if (debitAmount > 0 && creditAmount > 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
            });
          }
        }
      }
      
      const newTemplate = await VoucherTemplate.create(templateData, userId);
      
      res.status(201).json({
        success: true,
        data: newTemplate,
        message: 'Plantilla creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear plantilla: ${error.message}`);
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear plantilla',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una plantilla existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const templateData = req.body;
      const userId = req.user.id;
      
      // Validar datos requeridos
      if (!templateData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la plantilla es requerido'
        });
      }
      
      if (!templateData.voucher_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de comprobante es requerido'
        });
      }
      
      // Validar líneas si existen
      if (templateData.lines && Array.isArray(templateData.lines)) {
        for (let i = 0; i < templateData.lines.length; i++) {
          const line = templateData.lines[i];
          
          if (!line.account_id) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} debe tener una cuenta contable`
            });
          }
          
          const debitAmount = parseFloat(line.debit_amount || 0);
          const creditAmount = parseFloat(line.credit_amount || 0);
          
          if (debitAmount < 0 || creditAmount < 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener montos negativos`
            });
          }
          
          if (debitAmount > 0 && creditAmount > 0) {
            return res.status(400).json({
              success: false,
              message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
            });
          }
        }
      }
      
      const updatedTemplate = await VoucherTemplate.update(id, templateData, userId);
      
      res.status(200).json({
        success: true,
        data: updatedTemplate,
        message: 'Plantilla actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar plantilla: ${error.message}`);
      
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
        message: 'Error al actualizar plantilla',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una plantilla
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const result = await VoucherTemplate.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Plantilla eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar plantilla: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar plantilla',
        error: error.message
      });
    }
  }

  /**
   * Generar comprobante a partir de una plantilla
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateFromTemplate(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user.id;
      
      const voucherData = await VoucherTemplate.generateVoucher(id, data, userId);
      
      // Opcional: crear el comprobante directamente
      if (req.query.create === 'true') {
        voucherData.created_by = userId;
        const createdVoucher = await Voucher.create(voucherData);
        
        res.status(201).json({
          success: true,
          data: createdVoucher,
          message: 'Comprobante generado y creado correctamente desde plantilla'
        });
      } else {
        // Solo devolver los datos para que el usuario pueda revisarlos antes de crear
        res.status(200).json({
          success: true,
          data: voucherData,
          message: 'Datos de comprobante generados desde plantilla'
        });
      }
    } catch (error) {
      logger.error(`Error al generar desde plantilla: ${error.message}`);
      
      if (error.message.includes('no encontrada') || error.message.includes('no está activa')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al generar comprobante desde plantilla',
        error: error.message
      });
    }
  }

  /**
   * Generar PDF de un comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generatePDF(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el comprobante exista
      const voucher = await Voucher.getById(id);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Generar el PDF
      const pdfBuffer = await VoucherPdfService.generateVoucherPDF(id);
      
      // Configurar headers para respuesta PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="comprobante-${voucher.voucher_number || id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar el PDF como respuesta
      res.send(pdfBuffer);
      
    } catch (error) {
      logger.error(`Error al generar PDF del comprobante ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar PDF del comprobante',
        error: error.message
      });
    }
  }
}

module.exports = VoucherController; 