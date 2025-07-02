/**
 * Controlador para la gestión de propiedades hipotecarias
 * @module controllers/Creditos/PropertiesController
 */

const Properties = require('../../models/Creditos/PropertiesModel');
const logger = require('../../utils/logger');

/**
 * Clase controladora para propiedades hipotecarias
 */
class PropertiesController {

  /**
   * Obtener todas las propiedades con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = {
        property_code: req.query.property_code,
        property_type: req.query.property_type,
        city: req.query.city,
        state: req.query.state,
        stratum: req.query.stratum,
        property_condition: req.query.property_condition,
        min_value: req.query.min_value,
        max_value: req.query.max_value,
        min_area: req.query.min_area,
        max_area: req.query.max_area,
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        limit: req.query.limit
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      const properties = await Properties.getAll(filters);

      res.status(200).json({
        success: true,
        message: 'Propiedades obtenidas exitosamente',
        data: properties,
        filters_applied: filters,
        count: properties.length
      });

    } catch (error) {
      logger.error(`Error en getAll propiedades: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener una propiedad específica por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      const property = await Properties.getById(parseInt(id));

      if (!property) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la propiedad con ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Propiedad obtenida exitosamente',
        data: property
      });

    } catch (error) {
      logger.error(`Error en getById propiedad: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener una propiedad específica por código
   */
  static async getByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código de propiedad requerido'
        });
      }

      const property = await Properties.getByCode(code.trim());

      if (!property) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la propiedad con código ${code}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Propiedad obtenida exitosamente',
        data: property
      });

    } catch (error) {
      logger.error(`Error en getByCode propiedad: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener propiedades por ciudad
   */
  static async getByCity(req, res) {
    try {
      const { city } = req.params;

      if (!city || city.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nombre de ciudad requerido'
        });
      }

      const properties = await Properties.getByCity(city.trim());

      res.status(200).json({
        success: true,
        message: `Propiedades de ${city} obtenidas exitosamente`,
        data: properties,
        count: properties.length
      });

    } catch (error) {
      logger.error(`Error en getByCity propiedades: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener solo propiedades activas
   */
  static async getActive(req, res) {
    try {
      const properties = await Properties.getActive();

      res.status(200).json({
        success: true,
        message: 'Propiedades activas obtenidas exitosamente',
        data: properties,
        count: properties.length
      });

    } catch (error) {
      logger.error(`Error en getActive propiedades: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear una nueva propiedad
   */
  static async create(req, res) {
    try {
      const propertyData = req.body;

      // Validaciones básicas
      const validationErrors = PropertiesController.validatePropertyData(propertyData, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que crea
      propertyData.created_by = req.user.id;

      const newProperty = await Properties.create(propertyData);

      res.status(201).json({
        success: true,
        message: 'Propiedad creada exitosamente',
        data: newProperty
      });

    } catch (error) {
      logger.error(`Error en create propiedad: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe una propiedad')) {
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
   * Actualizar una propiedad existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const propertyData = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      // Validaciones básicas
      const validationErrors = PropertiesController.validatePropertyData(propertyData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que actualiza
      propertyData.updated_by = req.user.id;

      const updatedProperty = await Properties.update(parseInt(id), propertyData);

      res.status(200).json({
        success: true,
        message: 'Propiedad actualizada exitosamente',
        data: updatedProperty
      });

    } catch (error) {
      logger.error(`Error en update propiedad: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe otra propiedad')) {
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
   * Alternar estado activo/inactivo de una propiedad
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      // Validar is_active
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser verdadero o falso'
        });
      }

      const updatedProperty = await Properties.toggleActive(parseInt(id), is_active, req.user.id);

      res.status(200).json({
        success: true,
        message: `Propiedad ${is_active ? 'activada' : 'desactivada'} exitosamente`,
        data: updatedProperty
      });

    } catch (error) {
      logger.error(`Error en toggleActive propiedad: ${error.message}`);
      
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
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar una propiedad
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      const result = await Properties.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Propiedad eliminada exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en delete propiedad: ${error.message}`);
      
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
   * Verificar disponibilidad de código de propiedad
   */
  static async checkCodeAvailability(req, res) {
    try {
      const { code } = req.params;
      const { exclude_id } = req.query;

      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código de propiedad requerido'
        });
      }

      const isAvailable = await Properties.isCodeAvailable(code.trim(), exclude_id ? parseInt(exclude_id) : null);

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
   * Obtener ciudades disponibles
   */
  static async getCities(req, res) {
    try {
      const cities = await Properties.getCities();

      res.status(200).json({
        success: true,
        message: 'Ciudades obtenidas exitosamente',
        data: cities,
        count: cities.length
      });

    } catch (error) {
      logger.error(`Error en getCities: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estados disponibles
   */
  static async getStates(req, res) {
    try {
      const states = await Properties.getStates();

      res.status(200).json({
        success: true,
        message: 'Estados obtenidos exitosamente',
        data: states,
        count: states.length
      });

    } catch (error) {
      logger.error(`Error en getStates: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener tipos de propiedades disponibles
   */
  static async getPropertyTypes(req, res) {
    try {
      const types = await Properties.getPropertyTypes();

      res.status(200).json({
        success: true,
        message: 'Tipos de propiedades obtenidos exitosamente',
        data: types,
        count: types.length
      });

    } catch (error) {
      logger.error(`Error en getPropertyTypes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de propiedades
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await Properties.getStatistics();

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
      const [cities, states, types] = await Promise.all([
        Properties.getCities(),
        Properties.getStates(),
        Properties.getPropertyTypes()
      ]);

      const options = {
        property_types: [
          { value: 'house', label: 'Casa', count: types.find(t => t.property_type === 'house')?.count || 0 },
          { value: 'apartment', label: 'Apartamento', count: types.find(t => t.property_type === 'apartment')?.count || 0 },
          { value: 'commercial', label: 'Comercial', count: types.find(t => t.property_type === 'commercial')?.count || 0 },
          { value: 'land', label: 'Terreno', count: types.find(t => t.property_type === 'land')?.count || 0 },
          { value: 'industrial', label: 'Industrial', count: types.find(t => t.property_type === 'industrial')?.count || 0 },
          { value: 'other', label: 'Otro', count: types.find(t => t.property_type === 'other')?.count || 0 }
        ],
        property_conditions: [
          { value: 'excellent', label: 'Excelente' },
          { value: 'good', label: 'Bueno' },
          { value: 'regular', label: 'Regular' },
          { value: 'poor', label: 'Malo' }
        ],
        stratums: [
          { value: 1, label: 'Estrato 1' },
          { value: 2, label: 'Estrato 2' },
          { value: 3, label: 'Estrato 3' },
          { value: 4, label: 'Estrato 4' },
          { value: 5, label: 'Estrato 5' },
          { value: 6, label: 'Estrato 6' }
        ],
        cities: cities.map(city => ({
          value: city.city,
          label: `${city.city}, ${city.state}`,
          state: city.state,
          count: city.properties_count
        })),
        states: states.map(state => ({
          value: state.state,
          label: state.state,
          count: state.properties_count
        }))
      };

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
   * Validar datos de propiedad
   * @param {Object} data - Datos a validar
   * @param {boolean} isUpdate - Indica si es una actualización
   * @returns {Array} Lista de errores de validación
   */
  static validatePropertyData(data, isUpdate = false) {
    const errors = [];

    // Validaciones obligatorias para creación
    if (!isUpdate) {
      if (!data.property_code || data.property_code.trim() === '') {
        errors.push('El código de propiedad es obligatorio');
      }
      
      if (!data.property_type) {
        errors.push('El tipo de propiedad es obligatorio');
      }
      
      if (!data.address || data.address.trim() === '') {
        errors.push('La dirección es obligatoria');
      }
      
      if (!data.city || data.city.trim() === '') {
        errors.push('La ciudad es obligatoria');
      }
      
      if (!data.state || data.state.trim() === '') {
        errors.push('El estado/departamento es obligatorio');
      }
      
      if (!data.property_value || data.property_value <= 0) {
        errors.push('El valor de la propiedad debe ser mayor a 0');
      }
    }

    // Validaciones de formato y longitud
    if (data.property_code) {
      if (data.property_code.length > 20) {
        errors.push('El código de propiedad no puede exceder 20 caracteres');
      }
      if (!/^[A-Z0-9\-_]+$/i.test(data.property_code)) {
        errors.push('El código de propiedad solo puede contener letras, números, guiones y guiones bajos');
      }
    }

    if (data.property_type) {
      const validTypes = ['house', 'apartment', 'commercial', 'land', 'industrial', 'other'];
      if (!validTypes.includes(data.property_type)) {
        errors.push('Tipo de propiedad inválido');
      }
    }

    if (data.address && data.address.length > 500) {
      errors.push('La dirección no puede exceder 500 caracteres');
    }

    if (data.city && data.city.length > 100) {
      errors.push('La ciudad no puede exceder 100 caracteres');
    }

    if (data.state && data.state.length > 100) {
      errors.push('El estado no puede exceder 100 caracteres');
    }

    if (data.postal_code && data.postal_code.length > 20) {
      errors.push('El código postal no puede exceder 20 caracteres');
    }

    if (data.country && data.country.length > 100) {
      errors.push('El país no puede exceder 100 caracteres');
    }

    // Validaciones numéricas
    if (data.area_sqm !== undefined && data.area_sqm !== null && data.area_sqm <= 0) {
      errors.push('El área debe ser mayor a 0');
    }

    if (data.construction_year !== undefined && data.construction_year !== null) {
      const currentYear = new Date().getFullYear();
      if (data.construction_year < 1800 || data.construction_year > currentYear + 5) {
        errors.push(`El año de construcción debe estar entre 1800 y ${currentYear + 5}`);
      }
    }

    if (data.property_value !== undefined && data.property_value !== null && data.property_value <= 0) {
      errors.push('El valor de la propiedad debe ser mayor a 0');
    }

    if (data.appraisal_value !== undefined && data.appraisal_value !== null && data.appraisal_value <= 0) {
      errors.push('El valor de avalúo debe ser mayor a 0');
    }

    if (data.property_tax_value !== undefined && data.property_tax_value !== null && data.property_tax_value < 0) {
      errors.push('El valor de impuestos no puede ser negativo');
    }

    if (data.stratum !== undefined && data.stratum !== null) {
      if (!Number.isInteger(data.stratum) || data.stratum < 1 || data.stratum > 6) {
        errors.push('El estrato debe ser un número entero entre 1 y 6');
      }
    }

    // Validaciones de fechas
    if (data.appraisal_date) {
      const appraisalDate = new Date(data.appraisal_date);
      if (isNaN(appraisalDate.getTime())) {
        errors.push('Fecha de avalúo inválida');
      } else if (appraisalDate > new Date()) {
        errors.push('La fecha de avalúo no puede ser futura');
      }
    }

    // Validaciones de enums
    if (data.property_condition) {
      const validConditions = ['excellent', 'good', 'regular', 'poor'];
      if (!validConditions.includes(data.property_condition)) {
        errors.push('Estado de propiedad inválido');
      }
    }

    // Validaciones de longitud para campos de texto
    if (data.appraisal_company && data.appraisal_company.length > 150) {
      errors.push('El nombre de la empresa de avalúo no puede exceder 150 caracteres');
    }

    if (data.property_tax_number && data.property_tax_number.length > 50) {
      errors.push('El número de predial no puede exceder 50 caracteres');
    }

    if (data.registration_number && data.registration_number.length > 50) {
      errors.push('El número de matrícula no puede exceder 50 caracteres');
    }

    if (data.cadastral_number && data.cadastral_number.length > 50) {
      errors.push('El número catastral no puede exceder 50 caracteres');
    }

    return errors;
  }
}

module.exports = PropertiesController; 