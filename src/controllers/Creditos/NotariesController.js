/**
 * Controlador para gestionar las notarías del sistema de créditos hipotecarios
 * @module controllers/Creditos/NotariesController
 */

const Notaries = require('../../models/Creditos/NotariesModel');
const logger = require('../../utils/logger');

/**
 * Clase de controlador para gestionar notarías
 */
class NotariesController {
  /**
   * Obtener todas las notarías con filtros opcionales
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
      
      const notaries = await Notaries.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: notaries,
        count: notaries.length,
        message: 'Notarías obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener notarías: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notarías',
        error: error.message
      });
    }
  }

  /**
   * Obtener una notaría por ID
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
          message: 'ID de notaría inválido'
        });
      }
      
      const notary = await Notaries.getById(parseInt(id));
      
      if (!notary) {
        return res.status(404).json({
          success: false,
          message: `Notaría con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: notary,
        message: 'Notaría obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener notaría ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notaría',
        error: error.message
      });
    }
  }

  /**
   * Obtener una notaría por código
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCode(req, res) {
    try {
      const { code } = req.params;
      
      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Código de notaría es requerido'
        });
      }
      
      const notary = await Notaries.getByCode(code.trim());
      
      if (!notary) {
        return res.status(404).json({
          success: false,
          message: `Notaría con código ${code} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: notary,
        message: 'Notaría obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener notaría por código ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notaría por código',
        error: error.message
      });
    }
  }

  /**
   * Obtener notarías por ciudad
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCity(req, res) {
    try {
      const { city } = req.params;
      
      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Ciudad es requerida'
        });
      }
      
      const notaries = await Notaries.getByCity(city.trim());
      
      res.status(200).json({
        success: true,
        data: notaries,
        count: notaries.length,
        message: `Notarías de ${city} obtenidas correctamente`
      });
    } catch (error) {
      logger.error(`Error al obtener notarías por ciudad ${req.params.city}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notarías por ciudad',
        error: error.message
      });
    }
  }

  /**
   * Obtener solo notarías activas
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getActive(req, res) {
    try {
      const notaries = await Notaries.getActive();
      
      res.status(200).json({
        success: true,
        data: notaries,
        count: notaries.length,
        message: 'Notarías activas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener notarías activas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notarías activas',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva notaría
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const notaryData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!notaryData.notary_code) {
        return res.status(400).json({
          success: false,
          message: 'El código de la notaría es requerido'
        });
      }

      if (!notaryData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la notaría es requerido'
        });
      }

      if (!notaryData.address) {
        return res.status(400).json({
          success: false,
          message: 'La dirección es requerida'
        });
      }

      if (!notaryData.city) {
        return res.status(400).json({
          success: false,
          message: 'La ciudad es requerida'
        });
      }

      if (!notaryData.state) {
        return res.status(400).json({
          success: false,
          message: 'El estado/departamento es requerido'
        });
      }
      
      // Limpiar y validar campos de texto
      notaryData.notary_code = notaryData.notary_code.trim().toUpperCase();
      notaryData.name = notaryData.name.trim();
      notaryData.address = notaryData.address.trim();
      notaryData.city = notaryData.city.trim();
      notaryData.state = notaryData.state.trim();
      
      // Validar longitudes
      if (notaryData.notary_code.length < 2 || notaryData.notary_code.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'El código debe tener entre 2 y 20 caracteres'
        });
      }

      if (notaryData.name.length < 3 || notaryData.name.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 200 caracteres'
        });
      }

      // Validar formato de email si se proporciona
      if (notaryData.email) {
        notaryData.email = notaryData.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(notaryData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }

      // Validar formato del teléfono si se proporciona
      if (notaryData.phone) {
        notaryData.phone = notaryData.phone.trim();
        if (notaryData.phone.length < 7 || notaryData.phone.length > 20) {
          return res.status(400).json({
            success: false,
            message: 'El teléfono debe tener entre 7 y 20 caracteres'
          });
        }
      }

      // Validar formato de website si se proporciona
      if (notaryData.website) {
        notaryData.website = notaryData.website.trim().toLowerCase();
        if (!notaryData.website.startsWith('http://') && !notaryData.website.startsWith('https://')) {
          notaryData.website = 'https://' + notaryData.website;
        }
      }
      
      const newNotary = await Notaries.create(notaryData);
      
      res.status(201).json({
        success: true,
        data: newNotary,
        message: 'Notaría creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear notaría: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear notaría',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una notaría existente
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
          message: 'ID de notaría inválido'
        });
      }
      
      const notaryData = {
        ...req.body,
        updated_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!notaryData.notary_code) {
        return res.status(400).json({
          success: false,
          message: 'El código de la notaría es requerido'
        });
      }

      if (!notaryData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la notaría es requerido'
        });
      }

      if (!notaryData.address) {
        return res.status(400).json({
          success: false,
          message: 'La dirección es requerida'
        });
      }

      if (!notaryData.city) {
        return res.status(400).json({
          success: false,
          message: 'La ciudad es requerida'
        });
      }

      if (!notaryData.state) {
        return res.status(400).json({
          success: false,
          message: 'El estado/departamento es requerido'
        });
      }
      
      // Limpiar y validar campos de texto
      notaryData.notary_code = notaryData.notary_code.trim().toUpperCase();
      notaryData.name = notaryData.name.trim();
      notaryData.address = notaryData.address.trim();
      notaryData.city = notaryData.city.trim();
      notaryData.state = notaryData.state.trim();
      
      // Validar longitudes
      if (notaryData.notary_code.length < 2 || notaryData.notary_code.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'El código debe tener entre 2 y 20 caracteres'
        });
      }

      if (notaryData.name.length < 3 || notaryData.name.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 3 y 200 caracteres'
        });
      }

      // Validar formato de email si se proporciona
      if (notaryData.email) {
        notaryData.email = notaryData.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(notaryData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }

      // Validar formato del teléfono si se proporciona
      if (notaryData.phone) {
        notaryData.phone = notaryData.phone.trim();
        if (notaryData.phone.length < 7 || notaryData.phone.length > 20) {
          return res.status(400).json({
            success: false,
            message: 'El teléfono debe tener entre 7 y 20 caracteres'
          });
        }
      }

      // Validar formato de website si se proporciona
      if (notaryData.website) {
        notaryData.website = notaryData.website.trim().toLowerCase();
        if (!notaryData.website.startsWith('http://') && !notaryData.website.startsWith('https://')) {
          notaryData.website = 'https://' + notaryData.website;
        }
      }
      
      const updatedNotary = await Notaries.update(parseInt(id), notaryData);
      
      res.status(200).json({
        success: true,
        data: updatedNotary,
        message: 'Notaría actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar notaría ${req.params.id}: ${error.message}`);
      
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
        message: 'Error al actualizar notaría',
        error: error.message
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de una notaría
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
          message: 'ID de notaría inválido'
        });
      }
      
      // Validar que is_active sea un booleano
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser un valor booleano'
        });
      }
      
      const updatedNotary = await Notaries.toggleActive(parseInt(id), is_active, req.user.id);
      
      const statusMessage = is_active ? 
        'Notaría activada correctamente' : 
        'Notaría desactivada correctamente';
      
      res.status(200).json({
        success: true,
        data: updatedNotary,
        message: statusMessage
      });
    } catch (error) {
      logger.error(`Error al cambiar estado de la notaría ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('documentos activos')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de la notaría',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una notaría
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
          message: 'ID de notaría inválido'
        });
      }
      
      const result = await Notaries.delete(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Notaría "${result.name}" eliminada correctamente`
      });
    } catch (error) {
      logger.error(`Error al eliminar notaría ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tiene') && error.message.includes('documento')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar notaría',
        error: error.message
      });
    }
  }

  /**
   * Verificar disponibilidad de código de notaría
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async checkCodeAvailability(req, res) {
    try {
      const { code } = req.params;
      const { excludeId } = req.query;
      
      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Código de notaría es requerido'
        });
      }
      
      const cleanCode = code.trim().toUpperCase();
      const excludeIdNum = excludeId ? parseInt(excludeId) : null;
      
      const isAvailable = await Notaries.isCodeAvailable(cleanCode, excludeIdNum);
      
      res.status(200).json({
        success: true,
        data: {
          code: cleanCode,
          isAvailable: isAvailable,
          message: isAvailable ? 'Código disponible' : 'Código ya está en uso'
        }
      });
    } catch (error) {
      logger.error(`Error al verificar disponibilidad del código ${req.params.code}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad del código',
        error: error.message
      });
    }
  }

  /**
   * Obtener ciudades únicas de las notarías
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getCities(req, res) {
    try {
      const cities = await Notaries.getCities();
      
      res.status(200).json({
        success: true,
        data: cities,
        count: cities.length,
        message: 'Ciudades obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener ciudades: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ciudades',
        error: error.message
      });
    }
  }

  /**
   * Obtener estados únicos de las notarías
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStates(req, res) {
    try {
      const states = await Notaries.getStates();
      
      res.status(200).json({
        success: true,
        data: states,
        count: states.length,
        message: 'Estados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estados',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de notarías
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await Notaries.getStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas de notarías obtenidas correctamente'
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
}

module.exports = NotariesController;