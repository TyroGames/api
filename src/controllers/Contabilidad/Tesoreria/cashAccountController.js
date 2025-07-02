/**
 * Controlador para gestión de cuentas de efectivo y cajas
 * @module controllers/Contabilidad/Tesoreria/cashAccountController
 */

const CashAccount = require('../../../models/Contabilidad/Tesoreria/cashAccountModel');
const logger = require('../../../utils/logger');

/**
 * Clase controladora para gestionar las cuentas de efectivo
 */
class CashAccountController {
  /**
   * Obtener todas las cuentas de efectivo con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        is_petty_cash: req.query.is_petty_cash !== undefined ? req.query.is_petty_cash === 'true' : undefined,
        location: req.query.location,
        responsible_user_id: req.query.responsible_user_id ? parseInt(req.query.responsible_user_id) : undefined,
        currency_id: req.query.currency_id ? parseInt(req.query.currency_id) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const accounts = await CashAccount.getAll(filters);

      logger.info(`Cuentas de efectivo obtenidas: ${accounts.length} registros`);

      res.json({
        success: true,
        data: accounts,
        message: 'Cuentas de efectivo obtenidas exitosamente',
        total: accounts.length
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener cuentas de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener una cuenta de efectivo por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const account = await CashAccount.getById(parseInt(id));

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Cuenta de efectivo no encontrada'
        });
      }

      logger.info(`Cuenta de efectivo ${id} obtenida`);

      res.json({
        success: true,
        data: account,
        message: 'Cuenta de efectivo obtenida exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener cuenta de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva cuenta de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        code,
        name,
        description,
        currency_id,
        gl_account_id,
        location,
        responsible_user_id,
        max_amount,
        current_balance,
        is_petty_cash
      } = req.body;

      // Validaciones de entrada
      const validationErrors = [];

      if (!code || code.trim().length === 0) {
        validationErrors.push('Código de cuenta de efectivo es requerido');
      } else if (code.length > 20) {
        validationErrors.push('El código no puede exceder 20 caracteres');
      }

      if (!name || name.trim().length === 0) {
        validationErrors.push('Nombre de cuenta de efectivo es requerido');
      } else if (name.length > 100) {
        validationErrors.push('El nombre no puede exceder 100 caracteres');
      }

      if (!currency_id || isNaN(parseInt(currency_id))) {
        validationErrors.push('ID de moneda es requerido y debe ser un número');
      }

      if (!gl_account_id || isNaN(parseInt(gl_account_id))) {
        validationErrors.push('ID de cuenta contable es requerido y debe ser un número');
      }

      if (responsible_user_id && isNaN(parseInt(responsible_user_id))) {
        validationErrors.push('ID de usuario responsable debe ser un número válido');
      }

      if (max_amount !== undefined && (isNaN(parseFloat(max_amount)) || parseFloat(max_amount) < 0)) {
        validationErrors.push('Monto máximo debe ser un número positivo');
      }

      if (current_balance !== undefined && (isNaN(parseFloat(current_balance)) || parseFloat(current_balance) < 0)) {
        validationErrors.push('Saldo actual debe ser un número positivo');
      }

      if (location && location.length > 100) {
        validationErrors.push('La ubicación no puede exceder 100 caracteres');
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

      const accountData = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description ? description.trim() : null,
        currency_id: parseInt(currency_id),
        gl_account_id: parseInt(gl_account_id),
        location: location ? location.trim() : null,
        responsible_user_id: responsible_user_id ? parseInt(responsible_user_id) : null,
        max_amount: max_amount ? parseFloat(max_amount) : 0,
        current_balance: current_balance ? parseFloat(current_balance) : 0,
        is_petty_cash: is_petty_cash === true || is_petty_cash === 'true',
        created_by: req.user.id
      };

      const account = await CashAccount.create(accountData);

      logger.info(`Cuenta de efectivo creada: ID ${account.id}, Código ${account.code}`);

      res.status(201).json({
        success: true,
        data: account,
        message: 'Cuenta de efectivo creada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear cuenta de efectivo: ${error.message}`);
      
      if (error.message.includes('Ya existe una cuenta') || 
          error.message.includes('no existe') ||
          error.message.includes('no permite movimientos') ||
          error.message.includes('no está activo')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al crear cuenta de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Actualizar una cuenta de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const updateData = { ...req.body };
      
      // Validaciones de campos específicos si están presentes
      const validationErrors = [];

      if (updateData.code !== undefined) {
        if (!updateData.code || updateData.code.trim().length === 0) {
          validationErrors.push('Código de cuenta de efectivo no puede estar vacío');
        } else if (updateData.code.length > 20) {
          validationErrors.push('El código no puede exceder 20 caracteres');
        } else {
          updateData.code = updateData.code.trim().toUpperCase();
        }
      }

      if (updateData.name !== undefined) {
        if (!updateData.name || updateData.name.trim().length === 0) {
          validationErrors.push('Nombre de cuenta de efectivo no puede estar vacío');
        } else if (updateData.name.length > 100) {
          validationErrors.push('El nombre no puede exceder 100 caracteres');
        } else {
          updateData.name = updateData.name.trim();
        }
      }

      if (updateData.currency_id !== undefined && isNaN(parseInt(updateData.currency_id))) {
        validationErrors.push('ID de moneda debe ser un número válido');
      }

      if (updateData.gl_account_id !== undefined && isNaN(parseInt(updateData.gl_account_id))) {
        validationErrors.push('ID de cuenta contable debe ser un número válido');
      }

      if (updateData.responsible_user_id !== undefined && updateData.responsible_user_id !== null && isNaN(parseInt(updateData.responsible_user_id))) {
        validationErrors.push('ID de usuario responsable debe ser un número válido');
      }

      if (updateData.max_amount !== undefined && (isNaN(parseFloat(updateData.max_amount)) || parseFloat(updateData.max_amount) < 0)) {
        validationErrors.push('Monto máximo debe ser un número positivo');
      }

      if (updateData.location !== undefined && updateData.location && updateData.location.length > 100) {
        validationErrors.push('La ubicación no puede exceder 100 caracteres');
      }

      if (updateData.description !== undefined && updateData.description && updateData.description.length > 500) {
        validationErrors.push('La descripción no puede exceder 500 caracteres');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors: validationErrors
        });
      }

      // Agregar usuario que actualiza
      updateData.updated_by = req.user.id;

      // Convertir campos numéricos
      if (updateData.currency_id !== undefined) updateData.currency_id = parseInt(updateData.currency_id);
      if (updateData.gl_account_id !== undefined) updateData.gl_account_id = parseInt(updateData.gl_account_id);
      if (updateData.responsible_user_id !== undefined && updateData.responsible_user_id !== null) {
        updateData.responsible_user_id = parseInt(updateData.responsible_user_id);
      }
      if (updateData.max_amount !== undefined) updateData.max_amount = parseFloat(updateData.max_amount);

      const account = await CashAccount.update(parseInt(id), updateData);

      logger.info(`Cuenta de efectivo ${id} actualizada por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: account,
        message: 'Cuenta de efectivo actualizada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar cuenta de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('Ya existe otra cuenta') ||
          error.message.includes('No se proporcionaron campos')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al actualizar cuenta de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Desactivar una cuenta de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deactivate(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const result = await CashAccount.deactivate(parseInt(id), req.user.id);

      logger.info(`Cuenta de efectivo ${id} desactivada por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: result,
        message: 'Cuenta de efectivo desactivada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al desactivar cuenta de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || 
          error.message.includes('ya está desactivada') ||
          error.message.includes('saldo pendiente') ||
          error.message.includes('movimientos pendientes')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al desactivar cuenta de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Obtener saldo actual de una cuenta de efectivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getBalance(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta de efectivo inválido'
        });
      }

      const balance = await CashAccount.getBalance(parseInt(id));

      logger.info(`Saldo de cuenta de efectivo ${id} consultado`);

      res.json({
        success: true,
        data: balance,
        message: 'Saldo de cuenta de efectivo obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta de efectivo: ${error.message}`);
      
      if (error.message.includes('no existe') || error.message.includes('no está activa')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al obtener saldo de cuenta de efectivo',
          error: error.message
        });
      }
    }
  }

  /**
   * Buscar cuentas de efectivo
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
      const accounts = await CashAccount.search(searchText);

      logger.info(`Búsqueda de cuentas de efectivo completada: "${searchText}" - ${accounts.length} resultados`);

      res.json({
        success: true,
        data: accounts,
        message: 'Búsqueda completada exitosamente',
        total: accounts.length,
        search_term: searchText
      });
    } catch (error) {
      logger.error(`Error en búsqueda de cuentas de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor en búsqueda de cuentas de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de cuentas de efectivo por moneda
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getSummaryByCurrency(req, res) {
    try {
      const summary = await CashAccount.getSummaryByCurrency();

      logger.info(`Resumen de cuentas de efectivo por moneda obtenido: ${summary.length} monedas`);

      res.json({
        success: true,
        data: summary,
        message: 'Resumen de cuentas de efectivo por moneda obtenido exitosamente',
        total_currencies: summary.length
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de cuentas de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener resumen de cuentas de efectivo',
        error: error.message
      });
    }
  }

  /**
   * Obtener cuentas de efectivo por responsable
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByResponsible(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
      }

      const accounts = await CashAccount.getByResponsible(parseInt(userId));

      logger.info(`Cuentas de efectivo por responsable ${userId} obtenidas: ${accounts.length} cuentas`);

      res.json({
        success: true,
        data: accounts,
        message: 'Cuentas de efectivo por responsable obtenidas exitosamente',
        total: accounts.length,
        responsible_user_id: parseInt(userId)
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas de efectivo por responsable: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener cuentas de efectivo por responsable',
        error: error.message
      });
    }
  }

  /**
   * Obtener cuentas de efectivo del usuario actual
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getMyAccounts(req, res) {
    try {
      const accounts = await CashAccount.getByResponsible(req.user.id);

      logger.info(`Cuentas de efectivo del usuario ${req.user.id} obtenidas: ${accounts.length} cuentas`);

      res.json({
        success: true,
        data: accounts,
        message: 'Mis cuentas de efectivo obtenidas exitosamente',
        total: accounts.length
      });
    } catch (error) {
      logger.error(`Error al obtener mis cuentas de efectivo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener mis cuentas de efectivo',
        error: error.message
      });
    }
  }
}

module.exports = CashAccountController;