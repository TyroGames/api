/**
 * Controlador para gestión de transferencias interbancarias
 * @module controllers/Contabilidad/Tesoreria/interBankTransferController
 */

const InterBankTransfer = require('../../../models/Contabilidad/Tesoreria/interBankTransferModel');
const logger = require('../../../utils/logger');

/**
 * Clase controladora para gestionar las transferencias interbancarias
 */
class InterBankTransferController {
  /**
   * Obtener todas las transferencias interbancarias con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        from_bank_account_id: req.query.from_bank_account_id ? parseInt(req.query.from_bank_account_id) : undefined,
        to_bank_account_id: req.query.to_bank_account_id ? parseInt(req.query.to_bank_account_id) : undefined,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        amount_min: req.query.amount_min ? parseFloat(req.query.amount_min) : undefined,
        amount_max: req.query.amount_max ? parseFloat(req.query.amount_max) : undefined,
        transfer_number: req.query.transfer_number,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transfers = await InterBankTransfer.getAll(filters);

      logger.info(`Transferencias interbancarias obtenidas: ${transfers.length} registros`);

      res.json({
        success: true,
        data: transfers,
        message: 'Transferencias interbancarias obtenidas exitosamente',
        total: transfers.length
      });
    } catch (error) {
      logger.error(`Error al obtener transferencias interbancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener transferencias interbancarias',
        error: error.message
      });
    }
  }

  /**
   * Obtener una transferencia interbancaria por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de transferencia interbancaria inválido'
        });
      }

      const transfer = await InterBankTransfer.getById(parseInt(id));

      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transferencia interbancaria no encontrada'
        });
      }

      logger.info(`Transferencia interbancaria ${id} obtenida`);

      res.json({
        success: true,
        data: transfer,
        message: 'Transferencia interbancaria obtenida exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener transferencia interbancaria: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener transferencia interbancaria',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva transferencia interbancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        from_bank_account_id,
        to_bank_account_id,
        transfer_date,
        amount,
        fee_amount,
        description,
        reference
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!from_bank_account_id || isNaN(parseInt(from_bank_account_id))) {
        validationErrors.push('ID de cuenta bancaria origen es requerido y debe ser un número');
      }

      if (!to_bank_account_id || isNaN(parseInt(to_bank_account_id))) {
        validationErrors.push('ID de cuenta bancaria destino es requerido y debe ser un número');
      }

      if (from_bank_account_id && to_bank_account_id && parseInt(from_bank_account_id) === parseInt(to_bank_account_id)) {
        validationErrors.push('La cuenta origen y destino no pueden ser la misma');
      }

      if (!transfer_date) {
        validationErrors.push('Fecha de transferencia es requerida');
      } else {
        const transferDate = new Date(transfer_date);
        if (isNaN(transferDate.getTime())) {
          validationErrors.push('Fecha de transferencia tiene formato inválido');
        } else if (transferDate > new Date()) {
          validationErrors.push('La fecha de transferencia no puede ser futura');
        }
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        validationErrors.push('Monto de transferencia es requerido y debe ser mayor que cero');
      }

      if (fee_amount && (isNaN(parseFloat(fee_amount)) || parseFloat(fee_amount) < 0)) {
        validationErrors.push('Monto de comisión debe ser un número positivo o cero');
      }

      if (description && description.length > 500) {
        validationErrors.push('La descripción no puede exceder 500 caracteres');
      }

      if (reference && reference.length > 50) {
        validationErrors.push('La referencia no puede exceder 50 caracteres');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      const transferData = {
        from_bank_account_id: parseInt(from_bank_account_id),
        to_bank_account_id: parseInt(to_bank_account_id),
        transfer_date,
        amount: parseFloat(amount),
        fee_amount: fee_amount ? parseFloat(fee_amount) : 0.00,
        description: description ? description.trim() : null,
        reference: reference ? reference.trim() : null,
        created_by: req.user.id
      };

      const transfer = await InterBankTransfer.create(transferData);

      logger.info(`Transferencia interbancaria creada: ID ${transfer.id}, ${from_bank_account_id} → ${to_bank_account_id}, Monto ${amount}`);

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Transferencia interbancaria creada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear transferencia interbancaria: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('no está activa') ||
          error.message.includes('no pueden ser la misma') ||
          error.message.includes('Fondos insuficientes') ||
          error.message.includes('misma moneda')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear transferencia interbancaria',
          error: error.message
        });
      }
    }
  }

  /**
   * Procesar una transferencia interbancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async process(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de transferencia interbancaria inválido'
        });
      }

      const result = await InterBankTransfer.process(parseInt(id), req.user.id);

      logger.info(`Transferencia interbancaria ${id} procesada por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: result,
        message: 'Transferencia interbancaria procesada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al procesar transferencia interbancaria: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está en estado') ||
          error.message.includes('no puede ser procesada') ||
          error.message.includes('Fondos insuficientes')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al procesar transferencia interbancaria',
          error: error.message
        });
      }
    }
  }

  /**
   * Cancelar una transferencia interbancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de transferencia interbancaria inválido'
        });
      }

      if (reason && reason.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'La razón de cancelación no puede exceder 255 caracteres'
        });
      }

      const result = await InterBankTransfer.cancel(parseInt(id), req.user.id, reason);

      logger.info(`Transferencia interbancaria ${id} cancelada por usuario ${req.user.id}${reason ? ` - Razón: ${reason}` : ''}`);

      res.json({
        success: true,
        data: result,
        message: 'Transferencia interbancaria cancelada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al cancelar transferencia interbancaria: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está cancelada') ||
          error.message.includes('No se puede cancelar')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al cancelar transferencia interbancaria',
          error: error.message
        });
      }
    }
  }

  /**
   * Obtener transferencias interbancarias por cuenta bancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByBankAccount(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }

      const filters = {
        status: req.query.status,
        direction: req.query.direction, // 'incoming', 'outgoing', o sin filtro
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transfers = await InterBankTransfer.getByBankAccount(parseInt(accountId), filters);

      logger.info(`Transferencias interbancarias por cuenta ${accountId} obtenidas: ${transfers.length} registros`);

      res.json({
        success: true,
        data: transfers,
        message: 'Transferencias interbancarias por cuenta obtenidas exitosamente',
        total: transfers.length,
        bank_account_id: parseInt(accountId)
      });
    } catch (error) {
      logger.error(`Error al obtener transferencias por cuenta bancaria: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener transferencias por cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Buscar transferencias interbancarias
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async search(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const searchText = q.trim();
      const transfers = await InterBankTransfer.search(searchText);

      logger.info(`Búsqueda de transferencias interbancarias completada: "${searchText}" - ${transfers.length} resultados`);

      res.json({
        success: true,
        data: transfers,
        message: 'Búsqueda completada exitosamente',
        total: transfers.length,
        search_term: searchText
      });
    } catch (error) {
      logger.error(`Error en búsqueda de transferencias interbancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en búsqueda de transferencias interbancarias',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de transferencias por período
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSummaryByPeriod(req, res) {
    try {
      const { date_from, date_to } = req.query;
      const { accountId } = req.params;

      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas'
        });
      }

      // Validar formato de fechas
      const dateFromObj = new Date(date_from);
      const dateToObj = new Date(date_to);

      if (isNaN(dateFromObj.getTime()) || isNaN(dateToObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fechas inválido'
        });
      }

      if (dateFromObj > dateToObj) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio no puede ser mayor que la fecha de fin'
        });
      }

      // Validar accountId si se proporciona
      let bankAccountId = null;
      if (accountId) {
        if (isNaN(parseInt(accountId))) {
          return res.status(400).json({
            success: false,
            message: 'ID de cuenta bancaria inválido'
          });
        }
        bankAccountId = parseInt(accountId);
      }

      const summary = await InterBankTransfer.getSummaryByPeriod(date_from, date_to, bankAccountId);

      logger.info(`Resumen de transferencias obtenido ${bankAccountId ? `para cuenta ${bankAccountId}` : 'global'} del ${date_from} al ${date_to}`);

      res.json({
        success: true,
        data: summary,
        message: 'Resumen de transferencias obtenido exitosamente',
        period: {
          from: date_from,
          to: date_to
        },
        bank_account_id: bankAccountId
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de transferencias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener resumen de transferencias',
        error: error.message
      });
    }
  }

  /**
   * Obtener transferencias pendientes críticas
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPendingCritical(req, res) {
    try {
      const { days_threshold } = req.query;
      const daysThreshold = days_threshold ? parseInt(days_threshold) : 2;

      if (isNaN(daysThreshold) || daysThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'El umbral de días debe ser un número positivo'
        });
      }

      const criticalTransfers = await InterBankTransfer.getPendingCritical(daysThreshold);

      logger.info(`Transferencias críticas obtenidas: ${criticalTransfers.length} registros (${daysThreshold}+ días)`);

      res.json({
        success: true,
        data: criticalTransfers,
        message: 'Transferencias pendientes críticas obtenidas exitosamente',
        total: criticalTransfers.length,
        days_threshold: daysThreshold
      });
    } catch (error) {
      logger.error(`Error al obtener transferencias críticas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener transferencias críticas',
        error: error.message
      });
    }
  }
}

module.exports = InterBankTransferController;