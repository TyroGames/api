/**
 * Controlador para gestionar las monedas
 * @module controllers/Contabilidad/Configuracion/Monedas/currencyController
 */

const Currency = require('../../../../models/Contabilidad/Configuracion/Monedas/currencyModel');
const logger = require('../../../../utils/logger');

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
      const currency = await Currency.getByCode(code);
      
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
      logger.error(`Error al obtener moneda con código ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener moneda',
        error: error.message
      });
    }
  }

  /**
   * Obtener la moneda predeterminada
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
          message: 'No hay moneda predeterminada configurada'
        });
      }
      
      res.status(200).json({
        success: true,
        data: currency,
        message: 'Moneda predeterminada obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener moneda predeterminada: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener moneda predeterminada',
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
      
      // Verificar si ya existe una moneda con el mismo código
      const existingCurrency = await Currency.getByCode(currencyData.code);
      if (existingCurrency) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una moneda con el código ${currencyData.code}`
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
      
      // Verificar que la moneda exista
      const existingCurrency = await Currency.getById(id);
      if (!existingCurrency) {
        return res.status(404).json({
          success: false,
          message: `Moneda con ID ${id} no encontrada`
        });
      }
      
      // Verificar si ya existe otra moneda con el mismo código
      if (currencyData.code !== existingCurrency.code) {
        const codeExists = await Currency.getByCode(currencyData.code);
        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: `Ya existe otra moneda con el código ${currencyData.code}`
          });
        }
      }
      
      const updatedCurrency = await Currency.update(id, currencyData);
      
      res.status(200).json({
        success: true,
        data: updatedCurrency,
        message: 'Moneda actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar moneda ${req.params.id}: ${error.message}`);
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
      
      // Verificar que la moneda exista
      const existingCurrency = await Currency.getById(id);
      if (!existingCurrency) {
        return res.status(404).json({
          success: false,
          message: `Moneda con ID ${id} no encontrada`
        });
      }
      
      // Verificar si es la moneda predeterminada
      if (existingCurrency.is_default) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la moneda predeterminada'
        });
      }
      
      const result = await Currency.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Moneda eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar moneda ${req.params.id}: ${error.message}`);
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
  static async setDefault(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la moneda exista
      const existingCurrency = await Currency.getById(id);
      if (!existingCurrency) {
        return res.status(404).json({
          success: false,
          message: `Moneda con ID ${id} no encontrada`
        });
      }
      
      // Si ya es la predeterminada, no hacer nada
      if (existingCurrency.is_default) {
        return res.status(200).json({
          success: true,
          data: existingCurrency,
          message: `La moneda ${existingCurrency.name} ya es la predeterminada`
        });
      }
      
      const result = await Currency.setDefault(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `La moneda ${existingCurrency.name} ha sido establecida como predeterminada`
      });
    } catch (error) {
      logger.error(`Error al establecer moneda predeterminada ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al establecer moneda predeterminada',
        error: error.message
      });
    }
  }
}

module.exports = CurrencyController; 