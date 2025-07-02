/**
 * Controlador para gestionar los tipos de créditos hipotecarios
 * @module controllers/Creditos/CreditTypesController
 */

const CreditTypes = require('../../models/Creditos/CreditTypesModel');
const logger = require('../../utils/logger');

/**
 * Clase de controlador para gestionar tipos de créditos hipotecarios
 */
class CreditTypesController {
  /**
   * Obtener todos los tipos de créditos con filtros opcionales
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
      
      const creditTypes = await CreditTypes.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: creditTypes,
        count: creditTypes.length,
        message: 'Tipos de créditos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de créditos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de créditos',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tipo de crédito por ID
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
          message: 'ID del tipo de crédito inválido'
        });
      }
      
      const creditType = await CreditTypes.getById(parseInt(id));
      
      if (!creditType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de crédito con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: creditType,
        message: 'Tipo de crédito obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de crédito ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tipo de crédito por código
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCode(req, res) {
    try {
      const { code } = req.params;
      
      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código del tipo de crédito es requerido'
        });
      }
      
      const creditType = await CreditTypes.getByCode(code.trim().toUpperCase());
      
      if (!creditType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de crédito con código ${code} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: creditType,
        message: 'Tipo de crédito obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de crédito con código ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener solo tipos de créditos activos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getActive(req, res) {
    try {
      const creditTypes = await CreditTypes.getActive();
      
      res.status(200).json({
        success: true,
        data: creditTypes,
        count: creditTypes.length,
        message: 'Tipos de créditos activos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de créditos activos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de créditos activos',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo tipo de crédito
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const creditTypeData = {
        ...req.body,
        created_by: req.user.id, // Se obtiene del middleware de autenticación
        // Convertir valores booleanos explícitamente
        allows_early_payment: req.body.allows_early_payment === true || req.body.allows_early_payment === 'true',
        allows_partial_payment: req.body.allows_partial_payment === true || req.body.allows_partial_payment === 'true',
        requires_guarantee: req.body.requires_guarantee === true || req.body.requires_guarantee === 'true',
        is_active: req.body.is_active === true || req.body.is_active === 'true'
      };
      
      // Validar datos requeridos
      if (!creditTypeData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código del tipo de crédito es requerido'
        });
      }
      
      if (!creditTypeData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo de crédito es requerido'
        });
      }
      
      // Normalizar el código (mayúsculas y sin espacios)
      creditTypeData.code = creditTypeData.code.trim().toUpperCase();
      
      // Validar el formato del código
      if (!/^[A-Z0-9\-]{1,10}$/.test(creditTypeData.code)) {
        return res.status(400).json({
          success: false,
          message: 'El código debe contener solo letras, números y guiones, máximo 10 caracteres'
        });
      }
      
      // Validar nombre
      creditTypeData.name = creditTypeData.name.trim();
      if (creditTypeData.name.length < 3 || creditTypeData.name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 100 caracteres'
        });
      }
      
      // Validar frequency si se proporciona
      if (creditTypeData.payment_frequency) {
        const validFrequencies = ['monthly', 'quarterly', 'semiannual', 'annual'];
        if (!validFrequencies.includes(creditTypeData.payment_frequency)) {
          return res.status(400).json({
            success: false,
            message: `Frecuencia de pago no válida. Valores permitidos: ${validFrequencies.join(', ')}`
          });
        }
      }
      
      // Validar método de cálculo si se proporciona
      if (creditTypeData.interest_calculation_method) {
        const validMethods = ['simple', 'compound'];
        if (!validMethods.includes(creditTypeData.interest_calculation_method)) {
          return res.status(400).json({
            success: false,
            message: `Método de cálculo no válido. Valores permitidos: ${validMethods.join(', ')}`
          });
        }
      }
      
      const newCreditType = await CreditTypes.create(creditTypeData);
      
      res.status(201).json({
        success: true,
        data: newCreditType,
        message: 'Tipo de crédito creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear tipo de crédito: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un tipo de crédito existente
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
          message: 'ID del tipo de crédito inválido'
        });
      }
      
      const creditTypeData = {
        ...req.body,
        updated_by: req.user.id, // Se obtiene del middleware de autenticación
        // Convertir valores booleanos explícitamente
        allows_early_payment: req.body.allows_early_payment === true || req.body.allows_early_payment === 'true',
        allows_partial_payment: req.body.allows_partial_payment === true || req.body.allows_partial_payment === 'true',
        requires_guarantee: req.body.requires_guarantee === true || req.body.requires_guarantee === 'true',
        is_active: req.body.is_active === true || req.body.is_active === 'true'
      };
      
      // Validar datos requeridos
      if (!creditTypeData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código del tipo de crédito es requerido'
        });
      }
      
      if (!creditTypeData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tipo de crédito es requerido'
        });
      }
      
      // Normalizar el código (mayúsculas y sin espacios)
      creditTypeData.code = creditTypeData.code.trim().toUpperCase();
      
      // Validar el formato del código
      if (!/^[A-Z0-9\-]{1,10}$/.test(creditTypeData.code)) {
        return res.status(400).json({
          success: false,
          message: 'El código debe contener solo letras, números y guiones, máximo 10 caracteres'
        });
      }
      
      // Validar nombre
      creditTypeData.name = creditTypeData.name.trim();
      if (creditTypeData.name.length < 3 || creditTypeData.name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 100 caracteres'
        });
      }
      
      // Validar frequency si se proporciona
      if (creditTypeData.payment_frequency) {
        const validFrequencies = ['monthly', 'quarterly', 'semiannual', 'annual'];
        if (!validFrequencies.includes(creditTypeData.payment_frequency)) {
          return res.status(400).json({
            success: false,
            message: `Frecuencia de pago no válida. Valores permitidos: ${validFrequencies.join(', ')}`
          });
        }
      }
      
      // Validar método de cálculo si se proporciona
      if (creditTypeData.interest_calculation_method) {
        const validMethods = ['simple', 'compound'];
        if (!validMethods.includes(creditTypeData.interest_calculation_method)) {
          return res.status(400).json({
            success: false,
            message: `Método de cálculo no válido. Valores permitidos: ${validMethods.join(', ')}`
          });
        }
      }
      
      const updatedCreditType = await CreditTypes.update(parseInt(id), creditTypeData);
      
      res.status(200).json({
        success: true,
        data: updatedCreditType,
        message: 'Tipo de crédito actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar tipo de crédito ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
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
        message: 'Error al actualizar tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de un tipo de crédito
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
          message: 'ID del tipo de crédito inválido'
        });
      }
      
      // Validar que is_active sea un booleano
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser un valor booleano'
        });
      }
      
      const updatedCreditType = await CreditTypes.toggleActive(parseInt(id), is_active, req.user.id);
      
      const statusMessage = is_active ? 
        'Tipo de crédito activado correctamente' : 
        'Tipo de crédito desactivado correctamente';
      
      res.status(200).json({
        success: true,
        data: updatedCreditType,
        message: statusMessage
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del tipo de crédito ${req.params.id}: ${error.message}`);
      
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
        message: 'Error al cambiar estado del tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un tipo de crédito
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
          message: 'ID del tipo de crédito inválido'
        });
      }
      
      const result = await CreditTypes.delete(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Tipo de crédito "${result.name}" eliminado correctamente`
      });
    } catch (error) {
      logger.error(`Error al eliminar tipo de crédito ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tiene') && (error.message.includes('crédito') || error.message.includes('configuración'))) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de crédito',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de código
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async checkCodeAvailability(req, res) {
    try {
      const { code } = req.params;
      const { exclude_id } = req.query;
      
      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código es requerido'
        });
      }
      
      const normalizedCode = code.trim().toUpperCase();
      const excludeId = exclude_id ? parseInt(exclude_id) : null;
      
      const isAvailable = await CreditTypes.isCodeAvailable(normalizedCode, excludeId);
      
      res.status(200).json({
        success: true,
        data: {
          code: normalizedCode,
          available: isAvailable
        },
        message: isAvailable ? 'Código disponible' : 'Código ya está en uso'
      });
    } catch (error) {
      logger.error(`Error al verificar disponibilidad del código: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del código',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de tipos de créditos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await CreditTypes.getStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas de tipos de créditos obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas de tipos de créditos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de tipos de créditos',
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
        payment_frequency: [
          { value: 'monthly', label: 'Mensual' },
          { value: 'quarterly', label: 'Trimestral' },
          { value: 'semiannual', label: 'Semestral' },
          { value: 'annual', label: 'Anual' }
        ],
        interest_calculation_method: [
          { value: 'simple', label: 'Interés Simple' },
          { value: 'compound', label: 'Interés Compuesto' }
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

module.exports = CreditTypesController;