/**
 * Controlador para gestión de movimientos de efectivo
 * @module controllers/Contabilidad/Tesoreria/cashMovementController
 */

const CashMovement = require('../../../models/Contabilidad/Tesoreria/cashMovementModel');
const logger = require('../../../utils/logger');

/**
 * Clase controladora para gestionar los movimientos de efectivo
 */
class CashMovementController {
  /**
   * Obtener todos los movimientos de efectivo con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        cash_account_id: req.query.cash_account_id ? parseInt(req.query.cash_account_id) : undefined,
        movement_type: req.query.movement_type,
        status: req.query.status,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        amount_min: req.query.amount_min ? parseFloat(req.query.amount_min) : undefined,
        amount_max: req.query.amount_max ? parseFloat(req.query.amount_max) : undefined,
        third_party_id: req.query.third_party_id ? parseInt(req.query.third_party_id) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const movements = await CashMovement.getAll(filters);

      logger.info(`Movimientos de efectivo obtenidos: ${movements.length} registros`);

      res.json({
        success: true,
        data: movements,
        message: 'Movimientos de efectivo obtenidos exitosamente',
        total: movements.length
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener movimientos de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener un movimiento de efectivo por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento de efectivo inválido'
        });
      }

      const movement = await CashMovement.getById(parseInt(id));

      if (!movement) {
        return res.status(404).json({
          success: false,
          message: 'Movimiento de efectivo no encontrado'
        });
      }

      logger.info(`Movimiento de efectivo ${id} obtenido`);

      res.json({
        success: true,
        data: movement,
        message: 'Movimiento de efectivo obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener movimiento de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener movimiento de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo movimiento de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        cash_account_id,
        movement_type,
        reference_number,
        date,
        description,
        amount,
        document_type,
        document_id,
        third_party_id,
        auto_confirm
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!cash_account_id || isNaN(parseInt(cash_account_id))) {
        validationErrors.push('ID de cuenta de efectivo es requerido y debe ser un número');
      }

      const validMovementTypes = ['income', 'expense', 'transfer_in', 'transfer_out'];
      if (!movement_type || !validMovementTypes.includes(movement_type)) {
        validationErrors.push(`Tipo de movimiento es requerido y debe ser uno de: ${validMovementTypes.join(', ')}`);
      }

      if (!date) {
        validationErrors.push('Fecha del movimiento es requerida');
      } else {
        const movementDate = new Date(date);
        if (isNaN(movementDate.getTime())) {
          validationErrors.push('Fecha del movimiento tiene formato inválido');
        } else if (movementDate > new Date()) {
          validationErrors.push('La fecha del movimiento no puede ser futura');
        }
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        validationErrors.push('Monto es requerido y debe ser un número positivo');
      }

      if (third_party_id && isNaN(parseInt(third_party_id))) {
        validationErrors.push('ID de tercero debe ser un número válido');
      }

      if (document_id && isNaN(parseInt(document_id))) {
        validationErrors.push('ID de documento debe ser un número válido');
      }

      if (reference_number && reference_number.length > 50) {
        validationErrors.push('El número de referencia no puede exceder 50 caracteres');
      }

      if (description && description.length > 500) {
        validationErrors.push('La descripción no puede exceder 500 caracteres');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      const movementData = {
        cash_account_id: parseInt(cash_account_id),
        movement_type,
        reference_number: reference_number || null,
        date,
        description: description || null,
        amount: parseFloat(amount),
        document_type: document_type || null,
        document_id: document_id ? parseInt(document_id) : null,
        third_party_id: third_party_id ? parseInt(third_party_id) : null,
        auto_confirm: auto_confirm === true || auto_confirm === 'true',
        created_by: req.user.id
      };

      const movement = await CashMovement.create(movementData);

      logger.info(`Movimiento de efectivo creado: ID ${movement.id}, Referencia ${movement.reference_number}`);

      res.status(201).json({
        success: true,
        data: movement,
        message: 'Movimiento de efectivo creado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear movimiento de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('inactiva') ||
          error.message.includes('Saldo insuficiente') ||
          error.message.includes('excede el límite')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear movimiento de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Confirmar un movimiento de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async confirm(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento de efectivo inválido'
        });
      }

      const result = await CashMovement.confirm(parseInt(id), req.user.id);

      logger.info(`Movimiento de efectivo ${id} confirmado por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: result,
        message: 'Movimiento de efectivo confirmado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al confirmar movimiento de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está en estado') ||
          error.message.includes('no puede ser confirmado')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al confirmar movimiento de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Cancelar un movimiento de efectivo
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
          message: 'ID de movimiento de efectivo inválido'
        });
      }

      const result = await CashMovement.cancel(parseInt(id), req.user.id, reason);

      logger.info(`Movimiento de efectivo ${id} cancelado por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: result,
        message: 'Movimiento de efectivo cancelado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al cancelar movimiento de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está cancelado')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al cancelar movimiento de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Obtener movimientos de efectivo por cuenta
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByCashAccount(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const filters = {
        movement_type: req.query.movement_type,
        status: req.query.status,
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

      const movements = await CashMovement.getByCashAccount(parseInt(accountId), filters);

      logger.info(`Movimientos de efectivo por cuenta ${accountId} obtenidos: ${movements.length} registros`);

      res.json({
        success: true,
        data: movements,
        message: 'Movimientos de efectivo por cuenta obtenidos exitosamente',
        total: movements.length,
        cash_account_id: parseInt(accountId)
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos por cuenta de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener movimientos por cuenta de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Buscar movimientos de efectivo
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
      const movements = await CashMovement.search(searchText);

      logger.info(`Búsqueda de movimientos de efectivo completada: "${searchText}" - ${movements.length} resultados`);

      res.json({
        success: true,
        data: movements,
        message: 'Búsqueda completada exitosamente',
        total: movements.length,
        search_term: searchText
      });
    } catch (error) {
      logger.error(`Error en búsqueda de movimientos de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en búsqueda de movimientos de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de movimientos por período
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSummaryByPeriod(req, res) {
    try {
      const { accountId } = req.params;
      const { date_from, date_to } = req.query;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

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

      const summary = await CashMovement.getSummaryByPeriod(parseInt(accountId), date_from, date_to);

      logger.info(`Resumen de movimientos obtenido para cuenta ${accountId} del ${date_from} al ${date_to}`);

      res.json({
        success: true,
        data: summary,
        message: 'Resumen de movimientos obtenido exitosamente',
        period: {
          from: date_from,
          to: date_to
        }
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de movimientos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener resumen de movimientos',
        error: error.message
      });
    }
  }

  /**
   * Transferir efectivo entre cuentas
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async transfer(req, res) {
    try {
      const {
        from_cash_account_id,
        to_cash_account_id,
        amount,
        description,
        date
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!from_cash_account_id || isNaN(parseInt(from_cash_account_id))) {
        validationErrors.push('ID de cuenta de efectivo origen es requerido y debe ser un número');
      }

      if (!to_cash_account_id || isNaN(parseInt(to_cash_account_id))) {
        validationErrors.push('ID de cuenta de efectivo destino es requerido y debe ser un número');
      }

      if (from_cash_account_id && to_cash_account_id && parseInt(from_cash_account_id) === parseInt(to_cash_account_id)) {
        validationErrors.push('Las cuentas origen y destino no pueden ser la misma');
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        validationErrors.push('Monto es requerido y debe ser un número positivo');
      }

      if (!date) {
        validationErrors.push('Fecha de la transferencia es requerida');
      } else {
        const transferDate = new Date(date);
        if (isNaN(transferDate.getTime())) {
          validationErrors.push('Fecha de la transferencia tiene formato inválido');
        } else if (transferDate > new Date()) {
          validationErrors.push('La fecha de la transferencia no puede ser futura');
        }
      }

      if (!description || description.trim().length === 0) {
        validationErrors.push('Descripción de la transferencia es requerida');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      const transferData = {
        from_cash_account_id: parseInt(from_cash_account_id),
        to_cash_account_id: parseInt(to_cash_account_id),
        amount: parseFloat(amount),
        description: description.trim(),
        date,
        created_by: req.user.id
      };

      const result = await CashMovement.transfer(transferData);

      logger.info(`Transferencia de efectivo realizada: ${amount} de cuenta ${from_cash_account_id} a cuenta ${to_cash_account_id}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Transferencia de efectivo realizada exitosamente'
      });
    } catch (error) {
      logger.error(`Error en transferencia de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('no está activa') ||
          error.message.includes('no pueden ser la misma') ||
          error.message.includes('Saldo insuficiente')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor en transferencia de efectivo',
          error: error.message
        });
      }
    }
  }
}

module.exports = CashMovementController;