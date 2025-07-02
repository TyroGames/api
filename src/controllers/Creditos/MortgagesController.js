/**
 * Controlador para gestionar los créditos hipotecarios principales del sistema de créditos
 * @module controllers/Creditos/MortgagesController
 */

const Mortgages = require('../../models/Creditos/MortgagesModel');
const logger = require('../../utils/logger');

/**
 * Controlador para operaciones CRUD de créditos hipotecarios
 */
class MortgagesController {
  /**
   * Obtener todos los créditos hipotecarios con filtros opcionales
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        credit_number: req.query.credit_number,
        credit_type_id: req.query.credit_type_id,
        quota_configuration_id: req.query.quota_configuration_id,
        property_id: req.query.property_id,
        property_code: req.query.property_code,
        property_city: req.query.property_city,
        status: req.query.status,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        min_principal_amount: req.query.min_principal_amount,
        max_principal_amount: req.query.max_principal_amount,
        min_interest_rate: req.query.min_interest_rate,
        max_interest_rate: req.query.max_interest_rate,
        start_date_from: req.query.start_date_from,
        start_date_to: req.query.start_date_to,
        end_date_from: req.query.end_date_from,
        end_date_to: req.query.end_date_to,
        payment_frequency: req.query.payment_frequency,
        overdue_payments: req.query.overdue_payments !== undefined ? req.query.overdue_payments === 'true' : undefined,
        limit: req.query.limit
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const mortgages = await Mortgages.getAll(filters);
      
      logger.info(`Créditos hipotecarios obtenidos: ${mortgages.length} registros con filtros:`, filters);

      res.json({
        success: true,
        data: mortgages,
        total: mortgages.length,
        message: `Se encontraron ${mortgages.length} créditos hipotecarios`
      });
    } catch (error) {
      logger.error(`Error al obtener créditos hipotecarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener créditos hipotecarios',
        error: error.message
      });
    }
  }

  /**
   * Obtener un crédito hipotecario por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de crédito hipotecario inválido'
        });
      }

      const mortgage = await Mortgages.getById(parseInt(id));
      
      if (!mortgage) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el crédito hipotecario con ID ${id}`
        });
      }

      logger.info(`Crédito hipotecario obtenido: ${mortgage.credit_number}`);

      res.json({
        success: true,
        data: mortgage,
        message: 'Crédito hipotecario obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener crédito hipotecario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el crédito hipotecario',
        error: error.message
      });
    }
  }

  /**
   * Obtener un crédito hipotecario por número de crédito
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByCreditNumber(req, res) {
    try {
      const { creditNumber } = req.params;
      
      if (!creditNumber || creditNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Número de crédito es requerido'
        });
      }

      const mortgage = await Mortgages.getByCreditNumber(creditNumber.trim());
      
      if (!mortgage) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el crédito hipotecario con número ${creditNumber}`
        });
      }

      logger.info(`Crédito hipotecario obtenido por número: ${mortgage.credit_number}`);

      res.json({
        success: true,
        data: mortgage,
        message: 'Crédito hipotecario obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener crédito hipotecario por número: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el crédito hipotecario',
        error: error.message
      });
    }
  }

  /**
   * Obtener créditos hipotecarios por propiedad
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByPropertyId(req, res) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId || isNaN(parseInt(propertyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      const mortgages = await Mortgages.getByPropertyId(parseInt(propertyId));
      
      logger.info(`Créditos hipotecarios obtenidos por propiedad: ${mortgages.length} registros`);

      res.json({
        success: true,
        data: mortgages,
        total: mortgages.length,
        message: `Se encontraron ${mortgages.length} créditos para la propiedad`
      });
    } catch (error) {
      logger.error(`Error al obtener créditos por propiedad: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener créditos por propiedad',
        error: error.message
      });
    }
  }

  /**
   * Obtener solo créditos hipotecarios activos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getActive(req, res) {
    try {
      const mortgages = await Mortgages.getActive();
      
      logger.info(`Créditos hipotecarios activos obtenidos: ${mortgages.length} registros`);

      res.json({
        success: true,
        data: mortgages,
        total: mortgages.length,
        message: `Se encontraron ${mortgages.length} créditos activos`
      });
    } catch (error) {
      logger.error(`Error al obtener créditos activos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener créditos activos',
        error: error.message
      });
    }
  }

  /**
   * Obtener créditos con pagos vencidos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getOverduePayments(req, res) {
    try {
      const mortgages = await Mortgages.getOverduePayments();
      
      logger.info(`Créditos con pagos vencidos obtenidos: ${mortgages.length} registros`);

      res.json({
        success: true,
        data: mortgages,
        total: mortgages.length,
        message: `Se encontraron ${mortgages.length} créditos con pagos vencidos`
      });
    } catch (error) {
      logger.error(`Error al obtener créditos con pagos vencidos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener créditos con pagos vencidos',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo crédito hipotecario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        credit_number,
        credit_type_id,
        quota_configuration_id,
        property_id,
        principal_amount,
        interest_rate,
        interest_rate_type,
        start_date,
        end_date,
        payment_day,
        payment_frequency,
        status,
        notes
      } = req.body;

      // Validaciones de campos requeridos
      const requiredFields = [
        'credit_number',
        'credit_type_id',
        'quota_configuration_id',
        'property_id',
        'principal_amount',
        'interest_rate',
        'start_date',
        'end_date',
        'payment_day'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`
        });
      }

      // Validaciones de tipos de datos
      if (isNaN(parseFloat(principal_amount)) || parseFloat(principal_amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto principal debe ser un número mayor a 0'
        });
      }

      if (isNaN(parseFloat(interest_rate)) || parseFloat(interest_rate) < 0) {
        return res.status(400).json({
          success: false,
          message: 'La tasa de interés debe ser un número mayor o igual a 0'
        });
      }

      if (isNaN(parseInt(payment_day)) || parseInt(payment_day) < 1 || parseInt(payment_day) > 31) {
        return res.status(400).json({
          success: false,
          message: 'El día de pago debe ser un número entre 1 y 31'
        });
      }

      // Validar fechas
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      
      if (startDateObj >= endDateObj) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }

      // Validar estados permitidos
      if (status && !['active', 'paid_off', 'defaulted', 'cancelled', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Estados permitidos: active, paid_off, defaulted, cancelled, suspended'
        });
      }

      // Validar tipos de tasa de interés
      if (interest_rate_type && !['nominal', 'effective'].includes(interest_rate_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de tasa de interés inválido. Tipos permitidos: nominal, effective'
        });
      }

      // Validar frecuencias de pago
      if (payment_frequency && !['monthly', 'quarterly', 'semiannual', 'annual'].includes(payment_frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frecuencia de pago inválida. Frecuencias permitidas: monthly, quarterly, semiannual, annual'
        });
      }

      const mortgageData = {
        ...req.body,
        created_by: req.user.id
      };

      const newMortgage = await Mortgages.create(mortgageData);
      
      logger.info(`Crédito hipotecario creado: ${newMortgage.credit_number} por usuario ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: newMortgage,
        message: 'Crédito hipotecario creado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear crédito hipotecario: ${error.message}`);
      
      // Manejar errores específicos de validación
      if (error.message.includes('Ya existe un crédito con el número') ||
          error.message.includes('no existe o no está activo') ||
          error.message.includes('ya tiene un crédito activo')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear el crédito hipotecario',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un crédito hipotecario existente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de crédito hipotecario inválido'
        });
      }

      const {
        credit_number,
        principal_amount,
        interest_rate,
        interest_rate_type,
        start_date,
        end_date,
        payment_day,
        payment_frequency,
        current_balance,
        total_paid_amount,
        total_interest_paid,
        total_principal_paid,
        total_management_fees_paid,
        next_payment_date,
        last_payment_date,
        status,
        default_date,
        default_reason,
        grace_period_end_date,
        notes,
        is_active
      } = req.body;

      // Validaciones de tipos de datos si están presentes
      if (principal_amount !== undefined) {
        if (isNaN(parseFloat(principal_amount)) || parseFloat(principal_amount) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El monto principal debe ser un número mayor a 0'
          });
        }
      }

      if (interest_rate !== undefined) {
        if (isNaN(parseFloat(interest_rate)) || parseFloat(interest_rate) < 0) {
          return res.status(400).json({
            success: false,
            message: 'La tasa de interés debe ser un número mayor o igual a 0'
          });
        }
      }

      if (payment_day !== undefined) {
        if (isNaN(parseInt(payment_day)) || parseInt(payment_day) < 1 || parseInt(payment_day) > 31) {
          return res.status(400).json({
            success: false,
            message: 'El día de pago debe ser un número entre 1 y 31'
          });
        }
      }

      // Validar fechas si están presentes
      if (start_date && end_date) {
        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        
        if (startDateObj >= endDateObj) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
          });
        }
      }

      // Validar estados permitidos
      if (status && !['active', 'paid_off', 'defaulted', 'cancelled', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Estados permitidos: active, paid_off, defaulted, cancelled, suspended'
        });
      }

      // Validar tipos de tasa de interés
      if (interest_rate_type && !['nominal', 'effective'].includes(interest_rate_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de tasa de interés inválido. Tipos permitidos: nominal, effective'
        });
      }

      // Validar frecuencias de pago
      if (payment_frequency && !['monthly', 'quarterly', 'semiannual', 'annual'].includes(payment_frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Frecuencia de pago inválida. Frecuencias permitidas: monthly, quarterly, semiannual, annual'
        });
      }

      const mortgageData = {
        ...req.body,
        updated_by: req.user.id
      };

      const updatedMortgage = await Mortgages.update(parseInt(id), mortgageData);
      
      logger.info(`Crédito hipotecario actualizado: ${updatedMortgage.credit_number} por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: updatedMortgage,
        message: 'Crédito hipotecario actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar crédito hipotecario: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') ||
          error.message.includes('Ya existe otro crédito con el número')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el crédito hipotecario',
        error: error.message
      });
    }
  }

  /**
   * Cambiar estado de un crédito hipotecario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de crédito hipotecario inválido'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo estado es requerido'
        });
      }

      // Validar estados permitidos
      const validStatuses = ['active', 'paid_off', 'defaulted', 'cancelled', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido: ${status}. Estados permitidos: ${validStatuses.join(', ')}`
        });
      }

      // Razón es requerida para ciertos estados
      if ((status === 'defaulted' || status === 'cancelled') && !reason) {
        return res.status(400).json({
          success: false,
          message: `La razón es requerida cuando se cambia el estado a "${status}"`
        });
      }

      const updatedMortgage = await Mortgages.changeStatus(
        parseInt(id), 
        status, 
        req.user.id, 
        reason
      );
      
      logger.info(`Estado de crédito hipotecario cambiado: ${updatedMortgage.credit_number} a ${status} por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: updatedMortgage,
        message: `Estado del crédito hipotecario cambiado a "${status}" exitosamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del crédito hipotecario: ${error.message}`);
      
      if (error.message.includes('no existe') ||
          error.message.includes('Estado inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cambiar el estado del crédito hipotecario',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de número de crédito
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async checkCreditNumber(req, res) {
    try {
      const { creditNumber } = req.params;
      const { excludeId } = req.query;
      
      if (!creditNumber || creditNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Número de crédito es requerido'
        });
      }

      const isAvailable = await Mortgages.isCreditNumberAvailable(
        creditNumber.trim(), 
        excludeId ? parseInt(excludeId) : null
      );
      
      res.json({
        success: true,
        data: {
          credit_number: creditNumber.trim(),
          is_available: isAvailable
        },
        message: isAvailable ? 
          'El número de crédito está disponible' : 
          'El número de crédito ya está en uso'
      });
    } catch (error) {
      logger.error(`Error al verificar número de crédito: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar el número de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de créditos hipotecarios
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await Mortgages.getStatistics();
      
      logger.info('Estadísticas de créditos hipotecarios obtenidas exitosamente');

      res.json({
        success: true,
        data: statistics,
        message: 'Estadísticas de créditos hipotecarios obtenidas exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtener opciones para formularios
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getFormOptions(req, res) {
    try {
      const options = await Mortgages.getFormOptions();
      
      res.json({
        success: true,
        data: options,
        message: 'Opciones de formulario obtenidas exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener opciones de formulario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener opciones de formulario',
        error: error.message
      });
    }
  }
}

module.exports = MortgagesController;