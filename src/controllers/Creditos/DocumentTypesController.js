/**
 * Controlador para la gestión de tipos de documentos
 * @module controllers/Creditos/DocumentTypesController
 */

const DocumentTypes = require('../../models/Creditos/DocumentTypesModel');
const logger = require('../../utils/logger');

/**
 * Clase controladora para tipos de documentos
 */
class DocumentTypesController {

  /**
   * Obtener todos los tipos de documentos con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = {
        name: req.query.name,
        code: req.query.code,
        category_id: req.query.category_id,
        category_name: req.query.category_name,
        is_required: req.query.is_required !== undefined ? req.query.is_required === 'true' : undefined,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        requires_notarization: req.query.requires_notarization !== undefined ? req.query.requires_notarization === 'true' : undefined,
        requires_registration: req.query.requires_registration !== undefined ? req.query.requires_registration === 'true' : undefined,
        has_validation_period: req.query.has_validation_period !== undefined ? req.query.has_validation_period === 'true' : undefined,
        max_file_size_mb: req.query.max_file_size_mb,
        limit: req.query.limit
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      const documentTypes = await DocumentTypes.getAll(filters);

      res.status(200).json({
        success: true,
        message: 'Tipos de documentos obtenidos exitosamente',
        data: documentTypes,
        filters_applied: filters,
        count: documentTypes.length
      });

    } catch (error) {
      logger.error(`Error en getAll tipos de documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener un tipo de documento específico por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de documento inválido'
        });
      }

      const documentType = await DocumentTypes.getById(parseInt(id));

      if (!documentType) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el tipo de documento con ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tipo de documento obtenido exitosamente',
        data: documentType
      });

    } catch (error) {
      logger.error(`Error en getById tipo de documento: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener un tipo de documento específico por código
   */
  static async getByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código de tipo de documento requerido'
        });
      }

      const documentType = await DocumentTypes.getByCode(code.trim());

      if (!documentType) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el tipo de documento con código "${code}"`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tipo de documento obtenido exitosamente',
        data: documentType
      });

    } catch (error) {
      logger.error(`Error en getByCode tipo de documento: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener tipos de documentos por categoría
   */
  static async getByCategoryId(req, res) {
    try {
      const { categoryId } = req.params;

      // Validar ID
      if (!categoryId || isNaN(parseInt(categoryId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido'
        });
      }

      const documentTypes = await DocumentTypes.getByCategoryId(parseInt(categoryId));

      res.status(200).json({
        success: true,
        message: 'Tipos de documentos de la categoría obtenidos exitosamente',
        data: documentTypes,
        count: documentTypes.length
      });

    } catch (error) {
      logger.error(`Error en getByCategoryId: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener solo tipos de documentos activos
   */
  static async getActive(req, res) {
    try {
      const documentTypes = await DocumentTypes.getActive();

      res.status(200).json({
        success: true,
        message: 'Tipos de documentos activos obtenidos exitosamente',
        data: documentTypes,
        count: documentTypes.length
      });

    } catch (error) {
      logger.error(`Error en getActive tipos de documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener tipos de documentos requeridos
   */
  static async getRequired(req, res) {
    try {
      const documentTypes = await DocumentTypes.getRequired();

      res.status(200).json({
        success: true,
        message: 'Tipos de documentos requeridos obtenidos exitosamente',
        data: documentTypes,
        count: documentTypes.length
      });

    } catch (error) {
      logger.error(`Error en getRequired tipos de documentos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear un nuevo tipo de documento
   */
  static async create(req, res) {
    try {
      const documentTypeData = req.body;

      // Validaciones básicas
      const validationErrors = DocumentTypesController.validateDocumentTypeData(documentTypeData, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que crea
      documentTypeData.created_by = req.user.id;

      const newDocumentType = await DocumentTypes.create(documentTypeData);

      res.status(201).json({
        success: true,
        message: 'Tipo de documento creado exitosamente',
        data: newDocumentType
      });

    } catch (error) {
      logger.error(`Error en create tipo de documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') || error.message.includes('no está activa')) {
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
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar un tipo de documento existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const documentTypeData = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de documento inválido'
        });
      }

      // Validaciones básicas
      const validationErrors = DocumentTypesController.validateDocumentTypeData(documentTypeData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que actualiza
      documentTypeData.updated_by = req.user.id;

      const updatedDocumentType = await DocumentTypes.update(parseInt(id), documentTypeData);

      res.status(200).json({
        success: true,
        message: 'Tipo de documento actualizado exitosamente',
        data: updatedDocumentType
      });

    } catch (error) {
      logger.error(`Error en update tipo de documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') || error.message.includes('no está activa')) {
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
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de un tipo de documento
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de documento inválido'
        });
      }

      // Validar is_active
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser verdadero o falso'
        });
      }

      const updatedDocumentType = await DocumentTypes.toggleActive(parseInt(id), is_active, req.user.id);

      res.status(200).json({
        success: true,
        message: `Tipo de documento ${is_active ? 'activado' : 'desactivado'} exitosamente`,
        data: updatedDocumentType
      });

    } catch (error) {
      logger.error(`Error en toggleActive tipo de documento: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('documentos asociados')) {
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
   * Eliminar un tipo de documento
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tipo de documento inválido'
        });
      }

      const result = await DocumentTypes.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Tipo de documento eliminado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en delete tipo de documento: ${error.message}`);
      
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
   * Verificar disponibilidad de código de tipo de documento
   */
  static async checkCodeAvailability(req, res) {
    try {
      const { code } = req.params;
      const { exclude_id } = req.query;

      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código de tipo de documento requerido'
        });
      }

      const isAvailable = await DocumentTypes.isCodeAvailable(code.trim(), exclude_id ? parseInt(exclude_id) : null);

      res.status(200).json({
        success: true,
        message: 'Verificación completada',
        data: {
          code: code.trim(),
          is_available: isAvailable
        }
      });

    } catch (error) {
      logger.error(`Error en checkCodeAvailability: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de tipos de documentos
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await DocumentTypes.getStatistics();

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
      const options = await DocumentTypes.getFormOptions();

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
   * Validar datos de tipo de documento
   * @param {Object} data - Datos a validar
   * @param {boolean} isUpdate - Indica si es una actualización
   * @returns {Array} Lista de errores de validación
   */
  static validateDocumentTypeData(data, isUpdate = false) {
    const errors = [];

    // Validaciones obligatorias para creación
    if (!isUpdate) {
      if (!data.category_id || isNaN(parseInt(data.category_id))) {
        errors.push('El ID de la categoría es obligatorio y debe ser un número');
      }
      
      if (!data.name || data.name.trim() === '') {
        errors.push('El nombre del tipo de documento es obligatorio');
      }
      
      if (!data.code || data.code.trim() === '') {
        errors.push('El código del tipo de documento es obligatorio');
      }
    }

    // Validaciones de formato y longitud
    if (data.name) {
      if (data.name.length > 100) {
        errors.push('El nombre del tipo de documento no puede exceder 100 caracteres');
      }
      if (data.name.length < 3) {
        errors.push('El nombre del tipo de documento debe tener al menos 3 caracteres');
      }
    }

    if (data.code) {
      if (data.code.length > 20) {
        errors.push('El código del tipo de documento no puede exceder 20 caracteres');
      }
      if (data.code.length < 2) {
        errors.push('El código del tipo de documento debe tener al menos 2 caracteres');
      }
      if (!/^[A-Z0-9_-]+$/i.test(data.code)) {
        errors.push('El código solo puede contener letras, números, guiones y guiones bajos');
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

    // Validaciones de tamaño máximo de archivo
    if (data.max_file_size_mb !== undefined && data.max_file_size_mb !== null) {
      if (isNaN(parseInt(data.max_file_size_mb))) {
        errors.push('El tamaño máximo de archivo debe ser un número');
      } else {
        const size = parseInt(data.max_file_size_mb);
        if (size < 1 || size > 500) { // Entre 1MB y 500MB
          errors.push('El tamaño máximo de archivo debe estar entre 1 y 500 MB');
        }
      }
    }

    // Validaciones de tipos de archivo permitidos
    if (data.file_types_allowed) {
      const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
      const extensions = data.file_types_allowed.toLowerCase().split(',').map(ext => ext.trim());
      
      for (const ext of extensions) {
        if (!validExtensions.includes(ext)) {
          errors.push(`Tipo de archivo no válido: ${ext}. Tipos permitidos: ${validExtensions.join(', ')}`);
          break;
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

    if (data.requires_notarization !== undefined && typeof data.requires_notarization !== 'boolean') {
      errors.push('El campo requires_notarization debe ser verdadero o falso');
    }

    if (data.requires_registration !== undefined && typeof data.requires_registration !== 'boolean') {
      errors.push('El campo requires_registration debe ser verdadero o falso');
    }

    return errors;
  }
}

module.exports = DocumentTypesController; 