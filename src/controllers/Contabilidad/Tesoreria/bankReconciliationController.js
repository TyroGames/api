/**
 * Controlador para gestión de conciliaciones bancarias
 * @module controllers/Contabilidad/Tesoreria/bankReconciliationController
 */

const BankReconciliation = require('../../../models/Contabilidad/Tesoreria/bankReconciliationModel');
const logger = require('../../../utils/logger');

/**
 * Clase controladora para gestionar las conciliaciones bancarias
 */
class BankReconciliationController {
  /**
   * Obtener todas las conciliaciones bancarias con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        bank_account_id: req.query.bank_account_id ? parseInt(req.query.bank_account_id) : undefined,
        statement_date_from: req.query.statement_date_from,
        statement_date_to: req.query.statement_date_to,
        is_reconciled: req.query.is_reconciled !== undefined ? req.query.is_reconciled === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const reconciliations = await BankReconciliation.getAll(filters);

      logger.info(`Conciliaciones bancarias obtenidas: ${reconciliations.length} registros`);

      res.json({
        success: true,
        data: reconciliations,
        message: 'Conciliaciones bancarias obtenidas exitosamente',
        total: reconciliations.length
      });
    } catch (error) {
      logger.error(`Error al obtener conciliaciones bancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener conciliaciones bancarias',
        error: error.message
      });
    }
  }

  /**
   * Obtener una conciliación bancaria por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de conciliación bancaria inválido'
        });
      }

      const reconciliation = await BankReconciliation.getById(parseInt(id));

      if (!reconciliation) {
        return res.status(404).json({
          success: false,
          message: 'Conciliación bancaria no encontrada'
        });
      }

      // Obtener items de la conciliación
      const items = await BankReconciliation.getReconciliationItems(parseInt(id));

      logger.info(`Conciliación bancaria ${id} obtenida con ${items.length} items`);

      res.json({
        success: true,
        data: {
          ...reconciliation,
          items: items
        },
        message: 'Conciliación bancaria obtenida exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener conciliación bancaria: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener conciliación bancaria',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva conciliación bancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        bank_account_id,
        statement_date,
        statement_balance,
        reconciled_balance,
        transactions
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!bank_account_id || isNaN(parseInt(bank_account_id))) {
        validationErrors.push('ID de cuenta bancaria es requerido y debe ser un número');
      }

      if (!statement_date) {
        validationErrors.push('Fecha del extracto es requerida');
      } else {
        const statementDate = new Date(statement_date);
        if (isNaN(statementDate.getTime())) {
          validationErrors.push('Fecha del extracto tiene formato inválido');
        } else if (statementDate > new Date()) {
          validationErrors.push('La fecha del extracto no puede ser futura');
        }
      }

      if (statement_balance === undefined || statement_balance === null || isNaN(parseFloat(statement_balance))) {
        validationErrors.push('Balance del extracto es requerido y debe ser un número');
      }

      if (reconciled_balance !== undefined && reconciled_balance !== null && isNaN(parseFloat(reconciled_balance))) {
        validationErrors.push('Balance reconciliado debe ser un número válido');
      }

      if (transactions && !Array.isArray(transactions)) {
        validationErrors.push('Las transacciones deben ser un array');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      const reconciliationData = {
        bank_account_id: parseInt(bank_account_id),
        statement_date,
        statement_balance: parseFloat(statement_balance),
        reconciled_balance: reconciled_balance ? parseFloat(reconciled_balance) : 0,
        transactions: transactions || [],
        created_by: req.user.id
      };

      const reconciliation = await BankReconciliation.create(reconciliationData);

      logger.info(`Conciliación bancaria creada: ID ${reconciliation.id} para cuenta ${bank_account_id}`);

      res.status(201).json({
        success: true,
        data: reconciliation,
        message: 'Conciliación bancaria creada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear conciliación bancaria: ${error.message}`);
      
      if (error.message.includes('Ya existe una conciliación') || 
          error.message.includes('cuenta bancaria especificada no existe') ||
          error.message.includes('cuentas bancarias inactivas')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear conciliación bancaria',
          error: error.message
        });
      }
    }
  }

  /**
   * Realizar conciliación automática
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async performAutoReconciliation(req, res) {
    try {
      const { id } = req.params;
      const criteria = req.body || {};

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de conciliación bancaria inválido'
        });
      }

      // Validar criterios de conciliación automática
      if (criteria.max_days_diff && (isNaN(parseInt(criteria.max_days_diff)) || parseInt(criteria.max_days_diff) < 0)) {
        return res.status(400).json({
          success: false,
          message: 'La diferencia máxima de días debe ser un número positivo'
        });
      }

      const result = await BankReconciliation.performAutoReconciliation(parseInt(id), criteria);

      logger.info(`Conciliación automática completada para ID ${id}: ${result.matched_transactions} transacciones conciliadas`);

      res.json({
        success: true,
        data: result,
        message: 'Conciliación automática completada exitosamente'
      });
    } catch (error) {
      logger.error(`Error en conciliación automática: ${error.message}`);
      
      if (error.message.includes('no existe') || error.message.includes('ya está completada')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor en conciliación automática',
          error: error.message
        });
      }
    }
  }

  /**
   * Conciliar transacciones manualmente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async reconcileTransactions(req, res) {
    try {
      const { id } = req.params;
      const { transaction_ids } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de conciliación bancaria inválido'
        });
      }

      if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array con IDs de transacciones válidos'
        });
      }

      // Validar que todos los IDs sean números
      const invalidIds = transaction_ids.filter(txId => isNaN(parseInt(txId)));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Todos los IDs de transacciones deben ser números válidos',
          invalid_ids: invalidIds
        });
      }

      const validTransactionIds = transaction_ids.map(txId => parseInt(txId));
      const result = await BankReconciliation.reconcileTransactions(parseInt(id), validTransactionIds, req.user.id);

      logger.info(`Conciliación manual completada para ID ${id}: ${result.reconciled_transactions} transacciones conciliadas`);

      res.json({
        success: true,
        data: result,
        message: 'Transacciones conciliadas exitosamente'
      });
    } catch (error) {
      logger.error(`Error en conciliación manual: ${error.message}`);
      
      if (error.message.includes('no existe') || error.message.includes('ya está completada')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor en conciliación manual',
          error: error.message
        });
      }
    }
  }

  /**
   * Completar una conciliación bancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async completeReconciliation(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de conciliación bancaria inválido'
        });
      }

      const result = await BankReconciliation.completeReconciliation(parseInt(id), req.user.id);

      logger.info(`Conciliación bancaria ${id} completada por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: result,
        message: 'Conciliación bancaria completada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al completar conciliación bancaria: ${error.message}`);
      
      if (error.message.includes('no existe') || error.message.includes('ya está completada')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al completar conciliación bancaria',
          error: error.message
        });
      }
    }
  }

  /**
   * Obtener transacciones no conciliadas de una cuenta
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getUnreconciledTransactions(req, res) {
    try {
      const { accountId } = req.params;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }

      const filters = {
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        transaction_type: req.query.transaction_type,
        amount_min: req.query.amount_min ? parseFloat(req.query.amount_min) : undefined,
        amount_max: req.query.amount_max ? parseFloat(req.query.amount_max) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transactions = await BankReconciliation.getUnreconciledTransactions(parseInt(accountId), filters);

      logger.info(`Transacciones no conciliadas obtenidas para cuenta ${accountId}: ${transactions.length} registros`);

      res.json({
        success: true,
        data: transactions,
        message: 'Transacciones no conciliadas obtenidas exitosamente',
        total: transactions.length
      });
    } catch (error) {
      logger.error(`Error al obtener transacciones no conciliadas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener transacciones no conciliadas',
        error: error.message
      });
    }
  }

  /**
   * Buscar conciliaciones bancarias
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
      const reconciliations = await BankReconciliation.search(searchText);

      logger.info(`Búsqueda de conciliaciones completada: "${searchText}" - ${reconciliations.length} resultados`);

      res.json({
        success: true,
        data: reconciliations,
        message: 'Búsqueda completada exitosamente',
        total: reconciliations.length,
        search_term: searchText
      });
    } catch (error) {
      logger.error(`Error en búsqueda de conciliaciones: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en búsqueda de conciliaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de conciliaciones por cuenta
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSummaryByAccount(req, res) {
    try {
      const { accountId } = req.params;
      const { date_from, date_to } = req.query;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
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

      const summary = await BankReconciliation.getSummaryByAccount(parseInt(accountId), date_from, date_to);

      logger.info(`Resumen de conciliaciones obtenido para cuenta ${accountId} del ${date_from} al ${date_to}`);

      res.json({
        success: true,
        data: summary,
        message: 'Resumen de conciliaciones obtenido exitosamente',
        period: {
          from: date_from,
          to: date_to
        }
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de conciliaciones: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener resumen de conciliaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener items de una conciliación bancaria
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getReconciliationItems(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de conciliación bancaria inválido'
        });
      }

      // Verificar que la conciliación existe
      const reconciliation = await BankReconciliation.getById(parseInt(id));
      if (!reconciliation) {
        return res.status(404).json({
          success: false,
          message: 'Conciliación bancaria no encontrada'
        });
      }

      const items = await BankReconciliation.getReconciliationItems(parseInt(id));

      logger.info(`Items de conciliación obtenidos: ${items.length} items para conciliación ${id}`);

      res.json({
        success: true,
        data: items,
        message: 'Items de conciliación obtenidos exitosamente',
        total: items.length,
        reconciliation_info: {
          id: reconciliation.id,
          statement_date: reconciliation.statement_date,
          statement_balance: reconciliation.statement_balance,
          is_reconciled: reconciliation.is_reconciled
        }
      });
    } catch (error) {
      logger.error(`Error al obtener items de conciliación: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener items de conciliación',
        error: error.message
      });
    }
  }
}

module.exports = BankReconciliationController;