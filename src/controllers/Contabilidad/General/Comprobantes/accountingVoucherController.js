/**
 * Controlador para gestionar los comprobantes contables
 * @module controllers/Contabilidad/General/Comprobantes/accountingVoucherController
 */

const AccountingVoucher = require('../../../../models/Contabilidad/General/Comprobantes/accountingVoucherModel');
const logger = require('../../../../utils/logger');

/**
 * Clase que gestiona las operaciones de la API para comprobantes contables
 */
class AccountingVoucherController {
  /**
   * Obtener todos los comprobantes con filtros
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async getAll(req, res) {
    try {
      // Extraer filtros de la consulta
      const filters = {
        voucher_number: req.query.voucher_number,
        voucher_type_id: req.query.voucher_type_id,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        document_type_id: req.query.document_type_id,
        document_number: req.query.document_number,
        entity_type: req.query.entity_type,
        entity_id: req.query.entity_id,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      };

      // Obtener comprobantes y conteo total
      const [vouchers, total] = await Promise.all([
        AccountingVoucher.findAll(filters),
        AccountingVoucher.countAll(filters)
      ]);

      // Calcular metadatos de paginación
      const page = parseInt(filters.page);
      const limit = parseInt(filters.limit);
      const totalPages = Math.ceil(total / limit);

      return res.json({
        status: 'success',
        data: vouchers,
        meta: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      logger.error(`Error al obtener comprobantes contables: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener los comprobantes contables',
        error: error.message
      });
    }
  }

  /**
   * Obtener un comprobante por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async getById(req, res) {
    try {
      const voucherId = req.params.id;
      const voucher = await AccountingVoucher.findById(voucherId);

      if (!voucher) {
        return res.status(404).json({
          status: 'error',
          message: `Comprobante contable con ID ${voucherId} no encontrado`
        });
      }

      return res.json({
        status: 'success',
        data: voucher
      });
    } catch (error) {
      logger.error(`Error al obtener comprobante contable por ID: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener el comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Obtener un comprobante por su número
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async getByNumber(req, res) {
    try {
      const voucherNumber = req.params.voucherNumber;
      const voucher = await AccountingVoucher.findByNumber(voucherNumber);

      if (!voucher) {
        return res.status(404).json({
          status: 'error',
          message: `Comprobante contable con número ${voucherNumber} no encontrado`
        });
      }

      return res.json({
        status: 'success',
        data: voucher
      });
    } catch (error) {
      logger.error(`Error al obtener comprobante contable por número: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener el comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo comprobante contable
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async create(req, res) {
    try {
      // Validar campos requeridos
      const { voucherData, linesData } = req.body;

      if (!voucherData) {
        return res.status(400).json({
          status: 'error',
          message: 'Los datos del comprobante son obligatorios'
        });
      }

      // Validar tipo de comprobante y fecha
      if (!voucherData.voucher_type_id) {
        return res.status(400).json({
          status: 'error',
          message: 'El tipo de comprobante es obligatorio'
        });
      }

      if (!voucherData.date) {
        return res.status(400).json({
          status: 'error',
          message: 'La fecha del comprobante es obligatoria'
        });
      }

      if (!voucherData.fiscal_period_id) {
        return res.status(400).json({
          status: 'error',
          message: 'El período fiscal es obligatorio'
        });
      }

      if (!voucherData.currency_id) {
        return res.status(400).json({
          status: 'error',
          message: 'La moneda es obligatoria'
        });
      }

      // Validar líneas
      if (!linesData || !Array.isArray(linesData) || linesData.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'El comprobante debe tener al menos una línea'
        });
      }

      // Validar que cada línea tenga cuenta y montos
      for (let i = 0; i < linesData.length; i++) {
        const line = linesData[i];
        
        if (!line.account_id) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} debe tener una cuenta contable`
          });
        }

        if ((line.debit_amount || 0) === 0 && (line.credit_amount || 0) === 0) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} debe tener un monto de débito o crédito`
          });
        }

        if ((line.debit_amount || 0) > 0 && (line.credit_amount || 0) > 0) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
          });
        }
      }

      // Verificar cuadre del comprobante
      let totalDebit = 0;
      let totalCredit = 0;

      linesData.forEach(line => {
        totalDebit += parseFloat(line.debit_amount || 0);
        totalCredit += parseFloat(line.credit_amount || 0);
      });

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          status: 'error',
          message: 'El comprobante no está cuadrado. El total de débitos debe ser igual al total de créditos.'
        });
      }

      // Crear comprobante con sus líneas
      const userId = req.user.id;
      const newVoucher = await AccountingVoucher.create(voucherData, linesData, userId);

      return res.status(201).json({
        status: 'success',
        message: 'Comprobante contable creado exitosamente',
        data: newVoucher
      });
    } catch (error) {
      logger.error(`Error al crear comprobante contable: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear el comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un comprobante existente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async update(req, res) {
    try {
      const voucherId = req.params.id;
      const { voucherData, linesData } = req.body;

      if (!voucherData) {
        return res.status(400).json({
          status: 'error',
          message: 'Los datos del comprobante son obligatorios'
        });
      }

      // Validar líneas
      if (!linesData || !Array.isArray(linesData) || linesData.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'El comprobante debe tener al menos una línea'
        });
      }

      // Validar que cada línea tenga cuenta y montos
      for (let i = 0; i < linesData.length; i++) {
        const line = linesData[i];
        
        if (!line.account_id) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} debe tener una cuenta contable`
          });
        }

        if ((line.debit_amount || 0) === 0 && (line.credit_amount || 0) === 0) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} debe tener un monto de débito o crédito`
          });
        }

        if ((line.debit_amount || 0) > 0 && (line.credit_amount || 0) > 0) {
          return res.status(400).json({
            status: 'error',
            message: `La línea ${i + 1} no puede tener débito y crédito simultáneamente`
          });
        }
      }

      // Verificar cuadre del comprobante
      let totalDebit = 0;
      let totalCredit = 0;

      linesData.forEach(line => {
        totalDebit += parseFloat(line.debit_amount || 0);
        totalCredit += parseFloat(line.credit_amount || 0);
      });

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          status: 'error',
          message: 'El comprobante no está cuadrado. El total de débitos debe ser igual al total de créditos.'
        });
      }

      // Actualizar comprobante con sus líneas
      const userId = req.user.id;
      await AccountingVoucher.update(voucherId, voucherData, linesData, userId);

      return res.json({
        status: 'success',
        message: 'Comprobante contable actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar comprobante contable: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('estado borrador')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar el comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Aprobar y contabilizar un comprobante
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async approve(req, res) {
    try {
      const voucherId = req.params.id;
      const userId = req.user.id;
      
      const result = await AccountingVoucher.approve(voucherId, userId);

      return res.json({
        status: 'success',
        message: 'Comprobante contable aprobado y contabilizado exitosamente',
        data: result
      });
    } catch (error) {
      logger.error(`Error al aprobar comprobante contable: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('estado borrador') || 
          error.message.includes('ya tiene un asiento') ||
          error.message.includes('sin líneas') ||
          error.message.includes('no está cuadrado')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Error al aprobar el comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Anular un comprobante
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async cancel(req, res) {
    try {
      const voucherId = req.params.id;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe proporcionar un motivo para anular el comprobante'
        });
      }
      
      const userId = req.user.id;
      await AccountingVoucher.cancel(voucherId, reason, userId);

      return res.json({
        status: 'success',
        message: 'Comprobante contable anulado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al anular comprobante contable: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('ya ha sido anulado')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Error al anular el comprobante contable',
        error: error.message
      });
    }
  }
}

module.exports = AccountingVoucherController; 