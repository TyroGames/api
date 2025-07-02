/**
 * Controlador para gestión de arqueos de efectivo
 * @module controllers/Contabilidad/Tesoreria/cashReconciliationController
 */

const CashReconciliation = require('../../../models/Contabilidad/Tesoreria/cashReconciliationModel');
const logger = require('../../../utils/logger');

/**
 * Clase controladora para gestionar los arqueos de efectivo
 */
class CashReconciliationController {
  /**
   * Obtener todos los arqueos de efectivo con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        cash_account_id: req.query.cash_account_id ? parseInt(req.query.cash_account_id) : undefined,
        status: req.query.status,
        difference_type: req.query.difference_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        reconciled_by: req.query.reconciled_by ? parseInt(req.query.reconciled_by) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const reconciliations = await CashReconciliation.getAll(filters);

      logger.info(`Arqueos de efectivo obtenidos: ${reconciliations.length} registros`);

      res.json({
        success: true,
        data: reconciliations,
        message: 'Arqueos de efectivo obtenidos exitosamente',
        total: reconciliations.length
      });
    } catch (error) {
      logger.error(`Error al obtener arqueos de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener arqueos de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener un arqueo de efectivo por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de arqueo de efectivo inválido'
        });
      }

      const reconciliation = await CashReconciliation.getById(parseInt(id));

      if (!reconciliation) {
        return res.status(404).json({
          success: false,
          message: 'Arqueo de efectivo no encontrado'
        });
      }

      logger.info(`Arqueo de efectivo ${id} obtenido`);

      res.json({
        success: true,
        data: reconciliation,
        message: 'Arqueo de efectivo obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener arqueo de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener arqueo de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo arqueo de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        cash_account_id,
        reconciliation_date,
        physical_count,
        notes
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!cash_account_id || isNaN(parseInt(cash_account_id))) {
        validationErrors.push('ID de cuenta de efectivo es requerido y debe ser un número');
      }

      if (!reconciliation_date) {
        validationErrors.push('Fecha del arqueo es requerida');
      } else {
        const reconcDate = new Date(reconciliation_date);
        if (isNaN(reconcDate.getTime())) {
          validationErrors.push('Fecha del arqueo tiene formato inválido');
        } else if (reconcDate > new Date()) {
          validationErrors.push('La fecha del arqueo no puede ser futura');
        }
      }

      if (physical_count === undefined || physical_count === null || isNaN(parseFloat(physical_count)) || parseFloat(physical_count) < 0) {
        validationErrors.push('Conteo físico es requerido y debe ser un número positivo o cero');
      }

      if (notes && notes.length > 1000) {
        validationErrors.push('Las notas no pueden exceder 1000 caracteres');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      const reconciliationData = {
        cash_account_id: parseInt(cash_account_id),
        reconciliation_date,
        physical_count: parseFloat(physical_count),
        notes: notes ? notes.trim() : null,
        created_by: req.user.id
      };

      const reconciliation = await CashReconciliation.create(reconciliationData);

      logger.info(`Arqueo de efectivo creado: ID ${reconciliation.id}, Cuenta ${cash_account_id}`);

      res.status(201).json({
        success: true,
        data: reconciliation,
        message: 'Arqueo de efectivo creado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear arqueo de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('inactiva') ||
          error.message.includes('Ya existe un arqueo pendiente')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear arqueo de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Aprobar un arqueo de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async approve(req, res) {
    try {
      const { id } = req.params;
      const { create_adjustment } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de arqueo de efectivo inválido'
        });
      }

      const createAdjustment = create_adjustment === true || create_adjustment === 'true';

      const result = await CashReconciliation.approve(parseInt(id), req.user.id, createAdjustment);

      logger.info(`Arqueo de efectivo ${id} aprobado por usuario ${req.user.id}${createAdjustment ? ' con ajuste automático' : ''}`);

      res.json({
        success: true,
        data: result,
        message: `Arqueo de efectivo aprobado exitosamente${result.adjustment_created ? ' con ajuste automático aplicado' : ''}`
      });
    } catch (error) {
      logger.error(`Error al aprobar arqueo de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está en estado') ||
          error.message.includes('no puede ser aprobado')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al aprobar arqueo de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Obtener arqueos de efectivo por cuenta
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
        status: req.query.status,
        difference_type: req.query.difference_type,
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

      const reconciliations = await CashReconciliation.getByCashAccount(parseInt(accountId), filters);

      logger.info(`Arqueos de efectivo por cuenta ${accountId} obtenidos: ${reconciliations.length} registros`);

      res.json({
        success: true,
        data: reconciliations,
        message: 'Arqueos de efectivo por cuenta obtenidos exitosamente',
        total: reconciliations.length,
        cash_account_id: parseInt(accountId)
      });
    } catch (error) {
      logger.error(`Error al obtener arqueos por cuenta de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener arqueos por cuenta de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Buscar arqueos de efectivo
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
      const reconciliations = await CashReconciliation.search(searchText);

      logger.info(`Búsqueda de arqueos de efectivo completada: "${searchText}" - ${reconciliations.length} resultados`);

      res.json({
        success: true,
        data: reconciliations,
        message: 'Búsqueda completada exitosamente',
        total: reconciliations.length,
        search_term: searchText
      });
    } catch (error) {
      logger.error(`Error en búsqueda de arqueos de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en búsqueda de arqueos de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de arqueos por período
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
      let cashAccountId = null;
      if (accountId) {
        if (isNaN(parseInt(accountId))) {
          return res.status(400).json({
            success: false,
            message: 'ID de cuenta de efectivo inválido'
          });
        }
        cashAccountId = parseInt(accountId);
      }

      const summary = await CashReconciliation.getSummaryByPeriod(cashAccountId, date_from, date_to);

      logger.info(`Resumen de arqueos obtenido ${cashAccountId ? `para cuenta ${cashAccountId}` : 'global'} del ${date_from} al ${date_to}`);

      res.json({
        success: true,
        data: summary,
        message: 'Resumen de arqueos obtenido exitosamente',
        period: {
          from: date_from,
          to: date_to
        },
        cash_account_id: cashAccountId
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de arqueos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener resumen de arqueos',
        error: error.message
      });
    }
  }

  /**
   * Obtener arqueos pendientes críticos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPendingCritical(req, res) {
    try {
      const { days_threshold } = req.query;
      const daysThreshold = days_threshold ? parseInt(days_threshold) : 3;

      if (isNaN(daysThreshold) || daysThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'El umbral de días debe ser un número positivo'
        });
      }

      const criticalReconciliations = await CashReconciliation.getPendingCritical(daysThreshold);

      logger.info(`Arqueos críticos obtenidos: ${criticalReconciliations.length} registros (${daysThreshold}+ días)`);

      res.json({
        success: true,
        data: criticalReconciliations,
        message: 'Arqueos pendientes críticos obtenidos exitosamente',
        total: criticalReconciliations.length,
        days_threshold: daysThreshold
      });
    } catch (error) {
      logger.error(`Error al obtener arqueos críticos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener arqueos críticos',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de arqueos por cuenta
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAccountStatistics(req, res) {
    try {
      const { accountId } = req.params;
      const { last_months } = req.query;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const lastMonths = last_months ? parseInt(last_months) : 6;

      if (isNaN(lastMonths) || lastMonths < 1 || lastMonths > 24) {
        return res.status(400).json({
          success: false,
          message: 'El número de meses debe estar entre 1 y 24'
        });
      }

      const statistics = await CashReconciliation.getAccountStatistics(parseInt(accountId), lastMonths);

      logger.info(`Estadísticas de arqueos obtenidas para cuenta ${accountId} (últimos ${lastMonths} meses)`);

      res.json({
        success: true,
        data: statistics,
        message: 'Estadísticas de arqueos obtenidas exitosamente',
        cash_account_id: parseInt(accountId),
        period_months: lastMonths
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas de arqueos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas de arqueos',
        error: error.message
      });
    }
  }
}

module.exports = CashReconciliationController;