/**
 * Controlador para la gestión de categorías de documentos
 * @module controllers/Creditos/DocumentCategoriesController
 */

const DocumentCategories = require('../../models/Creditos/DocumentCategoriesModel');
const logger = require('../../utils/logger');

/**
 * Clase controladora para categorías de documentos
 */
class DocumentCategoriesController {

  /**
   * Obtener todas las categorías con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = {
        name: req.query.name,
        is_required: req.query.is_required !== undefined ? req.query.is_required === 'true' : undefined,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        has_validation_period: req.query.has_validation_period !== undefined ? req.query.has_validation_period === 'true' : undefined,
        limit: req.query.limit
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      const categories = await DocumentCategories.getAll(filters);

      res.status(200).json({
        success: true,
        message: 'Categorías de documentos obtenidas exitosamente',
        data: categories,
        filters_applied: filters,
        count: categories.length
      });

    } catch (error) {
      logger.error(`Error en getAll categorías: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener una categoría específica por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      const category = await DocumentCategories.getById(parseInt(id));

      if (!category) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la categoría con ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Categoría obtenida exitosamente',
        data: category
      });

    } catch (error) {
      logger.error(`Error en getById categoría: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener una categoría específica por nombre
   */
  static async getByName(req, res) {
    try {
      const { name } = req.params;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nombre de categoría requerido'
        });
      }

      const category = await DocumentCategories.getByName(name.trim());

      if (!category) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la categoría con nombre "${name}"`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Categoría obtenida exitosamente',
        data: category
      });

    } catch (error) {
      logger.error(`Error en getByName categoría: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener solo categorías activas
   */
  static async getActive(req, res) {
    try {
      const categories = await DocumentCategories.getActive();

      res.status(200).json({
        success: true,
        message: 'Categorías activas obtenidas exitosamente',
        data: categories,
        count: categories.length
      });

    } catch (error) {
      logger.error(`Error en getActive categorías: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener categorías requeridas
   */
  static async getRequired(req, res) {
    try {
      const categories = await DocumentCategories.getRequired();

      res.status(200).json({
        success: true,
        message: 'Categorías requeridas obtenidas exitosamente',
        data: categories,
        count: categories.length
      });

    } catch (error) {
      logger.error(`Error en getRequired categorías: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear una nueva categoría
   */
  static async create(req, res) {
    try {
      const categoryData = req.body;

      // Validaciones básicas
      const validationErrors = DocumentCategoriesController.validateCategoryData(categoryData, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que crea
      categoryData.created_by = req.user.id;

      const newCategory = await DocumentCategories.create(categoryData);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: newCategory
      });

    } catch (error) {
      logger.error(`Error en create categoría: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe una categoría')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar una categoría existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const categoryData = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      // Validaciones básicas
      const validationErrors = DocumentCategoriesController.validateCategoryData(categoryData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      const updatedCategory = await DocumentCategories.update(parseInt(id), categoryData);

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: updatedCategory
      });

    } catch (error) {
      logger.error(`Error en update categoría: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe otra categoría')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de una categoría
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      // Validar is_active
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser verdadero o falso'
        });
      }

      const updatedCategory = await DocumentCategories.toggleActive(parseInt(id), is_active);

      res.status(200).json({
        success: true,
        message: `Categoría ${is_active ? 'activada' : 'desactivada'} exitosamente`,
        data: updatedCategory
      });

    } catch (error) {
      logger.error(`Error en toggleActive categoría: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tipos de documentos activos')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar una categoría
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      const result = await DocumentCategories.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en delete categoría: ${error.message}`);
      
      // Manejar errores específicos
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
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verificar disponibilidad de nombre de categoría
   */
  static async checkNameAvailability(req, res) {
    try {
      const { name } = req.params;
      const { exclude_id } = req.query;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nombre de categoría requerido'
        });
      }

      const isAvailable = await DocumentCategories.isNameAvailable(name.trim(), exclude_id ? parseInt(exclude_id) : null);

      res.status(200).json({
        success: true,
        message: 'Verificación completada',
        data: {
          name: name.trim(),
          is_available: isAvailable
        }
      });

    } catch (error) {
      logger.error(`Error en checkNameAvailability: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener categorías con estadísticas
   */
  static async getCategoriesWithStats(req, res) {
    try {
      const categories = await DocumentCategories.getCategoriesWithStats();

      res.status(200).json({
        success: true,
        message: 'Categorías con estadísticas obtenidas exitosamente',
        data: categories,
        count: categories.length
      });

    } catch (error) {
      logger.error(`Error en getCategoriesWithStats: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de categorías
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await DocumentCategories.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: statistics
      });

    } catch (error) {
      logger.error(`Error en getStatistics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener opciones para formularios
   */
  static async getFormOptions(req, res) {
    try {
      const options = await DocumentCategories.getFormOptions();

      res.status(200).json({
        success: true,
        message: 'Opciones para formularios obtenidas exitosamente',
        data: options
      });

    } catch (error) {
      logger.error(`Error en getFormOptions: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validar datos de categoría
   * @param {Object} data - Datos a validar
   * @param {boolean} isUpdate - Indica si es una actualización
   * @returns {Array} Lista de errores de validación
   */
  static validateCategoryData(data, isUpdate = false) {
    const errors = [];

    // Validaciones obligatorias para creación
    if (!isUpdate) {
      if (!data.name || data.name.trim() === '') {
        errors.push('El nombre de la categoría es obligatorio');
      }
    }

    // Validaciones de formato y longitud
    if (data.name) {
      if (data.name.length > 100) {
        errors.push('El nombre de la categoría no puede exceder 100 caracteres');
      }
      if (data.name.length < 3) {
        errors.push('El nombre de la categoría debe tener al menos 3 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-_()]+$/u.test(data.name)) {
        errors.push('El nombre de la categoría solo puede contener letras, espacios, guiones, guiones bajos y paréntesis');
      }
    }

    // Validaciones de descripción
    if (data.description && data.description.length > 1000) {
      errors.push('La descripción no puede exceder 1000 caracteres');
    }

    // Validaciones de período de validación
    if (data.validation_period_days !== undefined && data.validation_period_days !== null) {
      if (isNaN(parseInt(data.validation_period_days))) {
        errors.push('El período de validación debe ser un número');
      } else {
        const days = parseInt(data.validation_period_days);
        if (days < 1 || days > 3650) { // Entre 1 día y 10 años
          errors.push('El período de validación debe estar entre 1 y 3650 días');
        }
      }
    }

    // Validaciones de booleanos
    if (data.is_required !== undefined && typeof data.is_required !== 'boolean') {
      errors.push('El campo is_required debe ser verdadero o falso');
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.push('El campo is_active debe ser verdadero o falso');
    }

    return errors;
  }
}

module.exports = DocumentCategoriesController; 