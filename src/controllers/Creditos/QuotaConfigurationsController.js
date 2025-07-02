/**
 * Controlador para gestionar las configuraciones de cuotas de créditos hipotecarios
 * @module controllers/Creditos/QuotaConfigurationsController
 */

const QuotaConfigurations = require('../../models/Creditos/QuotaConfigurationsModel');
const logger = require('../../utils/logger');

/**
 * Clase de controlador para gestionar configuraciones de cuotas
 */
class QuotaConfigurationsController {
  /**
   * Obtener todas las configuraciones de cuotas con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      
      // Convertir string 'true'/'false' a boolean para is_active
      if (filters.is_active !== undefined) {
        filters.is_active = filters.is_active === 'true';
      }
      
      // Convertir credit_type_id a número si se proporciona
      if (filters.credit_type_id) {
        filters.credit_type_id = parseInt(filters.credit_type_id);
      }
      
      const configurations = await QuotaConfigurations.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: configurations,
        count: configurations.length,
        message: 'Configuraciones de cuotas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener configuraciones de cuotas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener configuraciones de cuotas',
        error: error.message
      });
    }
  }

  /**
   * Obtener una configuración de cuota por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de configuración inválido'
        });
      }
      
      const configuration = await QuotaConfigurations.getById(parseInt(id));
      
      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: `Configuración de cuota con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: configuration,
        message: 'Configuración de cuota obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener configuración de cuota ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener configuración de cuota',
        error: error.message
      });
    }
  }

  /**
   * Obtener configuraciones por tipo de crédito
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCreditType(req, res) {
    try {
      const { creditTypeId } = req.params;
      
      // Validar que el ID sea un número válido
      if (!creditTypeId || isNaN(parseInt(creditTypeId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de crédito inválido'
        });
      }
      
      const configurations = await QuotaConfigurations.getByCreditType(parseInt(creditTypeId));
      
      res.status(200).json({
        success: true,
        data: configurations,
        count: configurations.length,
        message: 'Configuraciones obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener configuraciones por tipo de crédito ${req.params.creditTypeId}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener configuraciones por tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener solo configuraciones activas
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getActive(req, res) {
    try {
      const configurations = await QuotaConfigurations.getActive();
      
      res.status(200).json({
        success: true,
        data: configurations,
        count: configurations.length,
        message: 'Configuraciones activas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener configuraciones activas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener configuraciones activas',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva configuración de cuota
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const configData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!configData.credit_type_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del tipo de crédito es requerido'
        });
      }

      if (!configData.quota_type) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de cuota es requerido'
        });
      }
      
      if (!configData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la configuración es requerido'
        });
      }
      
      // Validar credit_type_id
      if (isNaN(parseInt(configData.credit_type_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de crédito inválido'
        });
      }
      configData.credit_type_id = parseInt(configData.credit_type_id);
      
      // Validar quota_type
      const validQuotaTypes = ['fixed', 'ordinary'];
      if (!validQuotaTypes.includes(configData.quota_type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de cuota no válido. Valores permitidos: ${validQuotaTypes.join(', ')}`
        });
      }
      
      // Validar nombre
      configData.name = configData.name.trim();
      if (configData.name.length < 3 || configData.name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 100 caracteres'
        });
      }
      
      // Validar porcentajes (deben estar entre 0 y 1)
      const percentageFields = ['management_fee_percentage', 'minimum_payment_percentage', 'late_payment_penalty_percentage'];
      for (const field of percentageFields) {
        if (configData[field] !== undefined) {
          const value = parseFloat(configData[field]);
          if (isNaN(value) || value < 0 || value > 1) {
            return res.status(400).json({
              success: false,
              message: `${field} debe ser un número entre 0 y 1`
            });
          }
          configData[field] = value;
        }
      }
      
      // Validar montos (deben ser positivos)
      if (configData.management_fee_amount !== undefined) {
        const value = parseFloat(configData.management_fee_amount);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: 'El monto de cuota de manejo debe ser un número positivo'
          });
        }
        configData.management_fee_amount = value;
      }
      
      // Validar días de gracia
      if (configData.grace_period_days !== undefined) {
        const value = parseInt(configData.grace_period_days);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: 'Los días de gracia deben ser un número entero positivo'
          });
        }
        configData.grace_period_days = value;
      }
      
      const newConfiguration = await QuotaConfigurations.create(configData);
      
      res.status(201).json({
        success: true,
        data: newConfiguration,
        message: 'Configuración de cuota creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear configuración de cuota: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') || error.message.includes('inactivo')) {
        return res.status(400).json({
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
        message: 'Error al crear configuración de cuota',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una configuración de cuota existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de configuración inválido'
        });
      }
      
      const configData = {
        ...req.body,
        updated_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!configData.quota_type) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de cuota es requerido'
        });
      }
      
      if (!configData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la configuración es requerido'
        });
      }
      
      // Validar credit_type_id si se proporciona
      if (configData.credit_type_id !== undefined) {
        if (isNaN(parseInt(configData.credit_type_id))) {
          return res.status(400).json({
            success: false,
            message: 'ID de tipo de crédito inválido'
          });
        }
        configData.credit_type_id = parseInt(configData.credit_type_id);
      }
      
      // Validar quota_type
      const validQuotaTypes = ['fixed', 'ordinary'];
      if (!validQuotaTypes.includes(configData.quota_type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de cuota no válido. Valores permitidos: ${validQuotaTypes.join(', ')}`
        });
      }
      
      // Validar nombre
      configData.name = configData.name.trim();
      if (configData.name.length < 3 || configData.name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 100 caracteres'
        });
      }
      
      // Validar porcentajes (deben estar entre 0 y 1)
      const percentageFields = ['management_fee_percentage', 'minimum_payment_percentage', 'late_payment_penalty_percentage'];
      for (const field of percentageFields) {
        if (configData[field] !== undefined) {
          const value = parseFloat(configData[field]);
          if (isNaN(value) || value < 0 || value > 1) {
            return res.status(400).json({
              success: false,
              message: `${field} debe ser un número entre 0 y 1`
            });
          }
          configData[field] = value;
        }
      }
      
      // Validar montos (deben ser positivos)
      if (configData.management_fee_amount !== undefined) {
        const value = parseFloat(configData.management_fee_amount);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: 'El monto de cuota de manejo debe ser un número positivo'
          });
        }
        configData.management_fee_amount = value;
      }
      
      // Validar días de gracia
      if (configData.grace_period_days !== undefined) {
        const value = parseInt(configData.grace_period_days);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: 'Los días de gracia deben ser un número entero positivo'
          });
        }
        configData.grace_period_days = value;
      }
      
      const updatedConfiguration = await QuotaConfigurations.update(parseInt(id), configData);
      
      res.status(200).json({
        success: true,
        data: updatedConfiguration,
        message: 'Configuración de cuota actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar configuración de cuota ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe') || error.message.includes('inactivo')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar configuración de cuota',
        error: error.message
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de una configuración
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de configuración inválido'
        });
      }
      
      // Validar que is_active sea un booleano
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser un valor booleano'
        });
      }
      
      const updatedConfiguration = await QuotaConfigurations.toggleActive(parseInt(id), is_active, req.user.id);
      
      const statusMessage = is_active ? 
        'Configuración activada correctamente' : 
        'Configuración desactivada correctamente';
      
      res.status(200).json({
        success: true,
        data: updatedConfiguration,
        message: statusMessage
      });
    } catch (error) {
      logger.error(`Error al cambiar estado de la configuración ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('créditos activos')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de la configuración',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una configuración de cuota
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de configuración inválido'
        });
      }
      
      const result = await QuotaConfigurations.delete(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Configuración "${result.name}" eliminada correctamente`
      });
    } catch (error) {
      logger.error(`Error al eliminar configuración ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tiene') && error.message.includes('crédito')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar configuración',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de configuraciones
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await QuotaConfigurations.getStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas de configuraciones obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtener opciones para formularios (enums)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getFormOptions(req, res) {
    try {
      const options = {
        quota_type: [
          { value: 'fixed', label: 'Cuota Fija' },
          { value: 'ordinary', label: 'Cuota Ordinaria' }
        ],
        boolean_options: [
          { value: true, label: 'Sí' },
          { value: false, label: 'No' }
        ]
      };
      
      res.status(200).json({
        success: true,
        data: options,
        message: 'Opciones de formulario obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener opciones de formulario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener opciones de formulario',
        error: error.message
      });
    }
  }
}

module.exports = QuotaConfigurationsController;