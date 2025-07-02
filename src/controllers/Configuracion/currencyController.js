/**
 * Controlador para gestionar las monedas del sistema
 * @module controllers/Configuracion/currencyController
 */

const Currency = require('../../models/Configuracion/currencyModel');
const logger = require('../../utils/logger');

/**
 * Clase de controlador para gestionar monedas
 */
class CurrencyController {
  /**
   * Obtener todas las monedas con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const currencies = await Currency.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: currencies,
        count: currencies.length,
        message: 'Monedas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener monedas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener monedas',
        error: error.message
      });
    }
  }

  /**
   * Obtener una moneda por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const currency = await Currency.getById(id);
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: `Moneda con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: currency,
        message: 'Moneda obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener moneda ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener moneda',
        error: error.message
      });
    }
  }

  /**
   * Obtener una moneda por código
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCode(req, res) {
    try {
      const { code } = req.params;
      const currency = await Currency.getByCode(code.toUpperCase());
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: `Moneda con código ${code} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: currency,
        message: 'Moneda obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener moneda por código ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener moneda por código',
        error: error.message
      });
    }
  }

  /**
   * Obtener la moneda por defecto
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getDefault(req, res) {
    try {
      const currency = await Currency.getDefault();
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró una moneda por defecto'
        });
      }
      
      res.status(200).json({
        success: true,
        data: currency,
        message: 'Moneda por defecto obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener moneda por defecto: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener moneda por defecto',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva moneda
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const currencyData = req.body;
      
      // Validar datos requeridos
      if (!currencyData.code) {
        return res.status(400).json({
          success: false,
          message: 'El código de la moneda es requerido'
        });
      }
      
      if (!currencyData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la moneda es requerido'
        });
      }
      
      if (!currencyData.symbol) {
        return res.status(400).json({
          success: false,
          message: 'El símbolo de la moneda es requerido'
        });
      }
      
      // Validar formato del código (3 caracteres)
      if (!/^[A-Z]{3}$/.test(currencyData.code.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'El código de la moneda debe tener exactamente 3 caracteres alfabéticos'
        });
      }
      
      // Validar longitud del símbolo
      if (currencyData.symbol.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'El símbolo de la moneda no puede tener más de 5 caracteres'
        });
      }
      
      // Validar longitud del nombre
      if (currencyData.name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la moneda no puede tener más de 50 caracteres'
        });
      }
      
      const newCurrency = await Currency.create(currencyData);
      
      res.status(201).json({
        success: true,
        data: newCurrency,
        message: 'Moneda creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear moneda: ${error.message}`);
      
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear moneda',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una moneda existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const currencyData = req.body;
      
      // Validar datos requeridos
      if (!currencyData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la moneda es requerido'
        });
      }
      
      if (!currencyData.symbol) {
        return res.status(400).json({
          success: false,
          message: 'El símbolo de la moneda es requerido'
        });
      }
      
      // Validar formato del código si se está actualizando
      if (currencyData.code && !/^[A-Z]{3}$/.test(currencyData.code.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'El código de la moneda debe tener exactamente 3 caracteres alfabéticos'
        });
      }
      
      // Validar longitud del símbolo
      if (currencyData.symbol.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'El símbolo de la moneda no puede tener más de 5 caracteres'
        });
      }
      
      // Validar longitud del nombre
      if (currencyData.name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la moneda no puede tener más de 50 caracteres'
        });
      }
      
      const updatedCurrency = await Currency.update(id, currencyData);
      
      res.status(200).json({
        success: true,
        data: updatedCurrency,
        message: 'Moneda actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar moneda ${req.params.id}: ${error.message}`);
      
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
        message: 'Error al actualizar moneda',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una moneda
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Currency.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Moneda eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar moneda ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('No se puede eliminar')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar moneda',
        error: error.message
      });
    }
  }

  /**
   * Establecer una moneda como predeterminada
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async setAsDefault(req, res) {
    try {
      const { id } = req.params;
      
      const result = await Currency.setAsDefault(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Moneda establecida como predeterminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al establecer moneda por defecto ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al establecer moneda como predeterminada',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de uso de monedas
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getUsageStats(req, res) {
    try {
      const stats = await Currency.getUsageStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        count: stats.length,
        message: 'Estadísticas de uso de monedas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas de uso de monedas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de uso de monedas',
        error: error.message
      });
    }
  }
}

module.exports = CurrencyController; 