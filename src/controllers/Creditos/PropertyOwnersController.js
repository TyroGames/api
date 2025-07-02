/**
 * Controlador para la gestión de propietarios de propiedades hipotecarias
 * @module controllers/Creditos/PropertyOwnersController
 */

const PropertyOwners = require('../../models/Creditos/PropertyOwnersModel');
const logger = require('../../utils/logger');

/**
 * Clase controladora para propietarios de propiedades hipotecarias
 */
class PropertyOwnersController {

  /**
   * Obtener todos los propietarios con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = {
        property_id: req.query.property_id,
        third_party_id: req.query.third_party_id,
        property_code: req.query.property_code,
        owner_name: req.query.owner_name,
        owner_document: req.query.owner_document,
        is_primary_owner: req.query.is_primary_owner !== undefined ? req.query.is_primary_owner === 'true' : undefined,
        min_ownership_percentage: req.query.min_ownership_percentage,
        max_ownership_percentage: req.query.max_ownership_percentage,
        property_city: req.query.property_city,
        property_state: req.query.property_state,
        limit: req.query.limit
      };

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key];
        }
      });

      const owners = await PropertyOwners.getAll(filters);

      res.status(200).json({
        success: true,
        message: 'Propietarios obtenidos exitosamente',
        data: owners,
        filters_applied: filters,
        count: owners.length
      });

    } catch (error) {
      logger.error(`Error en getAll propietarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener un propietario específico por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propietario inválido'
        });
      }

      const owner = await PropertyOwners.getById(parseInt(id));

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el propietario con ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Propietario obtenido exitosamente',
        data: owner
      });

    } catch (error) {
      logger.error(`Error en getById propietario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener propietarios por ID de propiedad
   */
  static async getByPropertyId(req, res) {
    try {
      const { propertyId } = req.params;

      // Validar ID
      if (!propertyId || isNaN(parseInt(propertyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      const owners = await PropertyOwners.getByPropertyId(parseInt(propertyId));

      res.status(200).json({
        success: true,
        message: 'Propietarios de la propiedad obtenidos exitosamente',
        data: owners,
        count: owners.length
      });

    } catch (error) {
      logger.error(`Error en getByPropertyId: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener propiedades por ID de tercero
   */
  static async getByThirdPartyId(req, res) {
    try {
      const { thirdPartyId } = req.params;

      // Validar ID
      if (!thirdPartyId || isNaN(parseInt(thirdPartyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tercero inválido'
        });
      }

      const properties = await PropertyOwners.getByThirdPartyId(parseInt(thirdPartyId));

      res.status(200).json({
        success: true,
        message: 'Propiedades del tercero obtenidas exitosamente',
        data: properties,
        count: properties.length
      });

    } catch (error) {
      logger.error(`Error en getByThirdPartyId: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener solo propietarios principales
   */
  static async getPrimaryOwners(req, res) {
    try {
      const owners = await PropertyOwners.getPrimaryOwners();

      res.status(200).json({
        success: true,
        message: 'Propietarios principales obtenidos exitosamente',
        data: owners,
        count: owners.length
      });

    } catch (error) {
      logger.error(`Error en getPrimaryOwners: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear un nuevo propietario de propiedad
   */
  static async create(req, res) {
    try {
      const ownerData = req.body;

      // Validaciones básicas
      const validationErrors = PropertyOwnersController.validateOwnerData(ownerData, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Agregar información del usuario que crea
      ownerData.created_by = req.user.id;

      const newOwner = await PropertyOwners.create(ownerData);

      res.status(201).json({
        success: true,
        message: 'Propietario creado exitosamente',
        data: newOwner
      });

    } catch (error) {
      logger.error(`Error en create propietario: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya es propietario') || error.message.includes('supere el 100%')) {
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
   * Actualizar un propietario existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const ownerData = req.body;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propietario inválido'
        });
      }

      // Validaciones básicas
      const validationErrors = PropertyOwnersController.validateOwnerData(ownerData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      const updatedOwner = await PropertyOwners.update(parseInt(id), ownerData);

      res.status(200).json({
        success: true,
        message: 'Propietario actualizado exitosamente',
        data: updatedOwner
      });

    } catch (error) {
      logger.error(`Error en update propietario: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('supere el 100%')) {
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
   * Eliminar un propietario
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propietario inválido'
        });
      }

      const result = await PropertyOwners.delete(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Propietario eliminado exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en delete propietario: ${error.message}`);
      
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
   * Verificar si una relación propiedad-tercero ya existe
   */
  static async checkRelationExists(req, res) {
    try {
      const { propertyId, thirdPartyId } = req.params;
      const { exclude_id } = req.query;

      // Validar IDs
      if (!propertyId || isNaN(parseInt(propertyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      if (!thirdPartyId || isNaN(parseInt(thirdPartyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tercero inválido'
        });
      }

      const exists = await PropertyOwners.relationExists(
        parseInt(propertyId), 
        parseInt(thirdPartyId), 
        exclude_id ? parseInt(exclude_id) : null
      );

      res.status(200).json({
        success: true,
        message: 'Verificación completada',
        data: {
          property_id: parseInt(propertyId),
          third_party_id: parseInt(thirdPartyId),
          relation_exists: exists
        }
      });

    } catch (error) {
      logger.error(`Error en checkRelationExists: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener porcentaje total de una propiedad
   */
  static async getTotalOwnershipPercentage(req, res) {
    try {
      const { propertyId } = req.params;
      const { exclude_id } = req.query;

      // Validar ID
      if (!propertyId || isNaN(parseInt(propertyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      const totalPercentage = await PropertyOwners.getTotalOwnershipPercentage(
        parseInt(propertyId), 
        exclude_id ? parseInt(exclude_id) : null
      );

      res.status(200).json({
        success: true,
        message: 'Porcentaje total obtenido exitosamente',
        data: {
          property_id: parseInt(propertyId),
          total_percentage: totalPercentage,
          available_percentage: 100 - totalPercentage
        }
      });

    } catch (error) {
      logger.error(`Error en getTotalOwnershipPercentage: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Transferir propiedad entre terceros
   */
  static async transferOwnership(req, res) {
    try {
      const { propertyId } = req.params;
      const { fromThirdPartyId, toThirdPartyId, transferPercentage } = req.body;

      // Validar ID de propiedad
      if (!propertyId || isNaN(parseInt(propertyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de propiedad inválido'
        });
      }

      // Validaciones de datos de transferencia
      const validationErrors = PropertyOwnersController.validateTransferData({
        fromThirdPartyId,
        toThirdPartyId,
        transferPercentage
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      const result = await PropertyOwners.transferOwnership(
        parseInt(propertyId),
        parseInt(fromThirdPartyId),
        parseInt(toThirdPartyId),
        parseFloat(transferPercentage),
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Transferencia de propiedad realizada exitosamente',
        data: result
      });

    } catch (error) {
      logger.error(`Error en transferOwnership: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no es propietario') || error.message.includes('solo posee')) {
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
   * Obtener estadísticas de propietarios
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await PropertyOwners.getStatistics();

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
   * Validar datos de propietario
   * @param {Object} data - Datos a validar
   * @param {boolean} isUpdate - Indica si es una actualización
   * @returns {Array} Lista de errores de validación
   */
  static validateOwnerData(data, isUpdate = false) {
    const errors = [];

    // Validaciones obligatorias para creación
    if (!isUpdate) {
      if (!data.property_id || isNaN(parseInt(data.property_id))) {
        errors.push('El ID de la propiedad es obligatorio y debe ser un número');
      }
      
      if (!data.third_party_id || isNaN(parseInt(data.third_party_id))) {
        errors.push('El ID del tercero es obligatorio y debe ser un número');
      }
    }

    // Validaciones de porcentaje de propiedad
    if (data.ownership_percentage !== undefined && data.ownership_percentage !== null) {
      if (isNaN(parseFloat(data.ownership_percentage))) {
        errors.push('El porcentaje de propiedad debe ser un número');
      } else {
        const percentage = parseFloat(data.ownership_percentage);
        if (percentage <= 0 || percentage > 100) {
          errors.push('El porcentaje de propiedad debe estar entre 0.01 y 100');
        }
      }
    }

    // Validaciones de fechas
    if (data.acquisition_date) {
      const acquisitionDate = new Date(data.acquisition_date);
      if (isNaN(acquisitionDate.getTime())) {
        errors.push('Fecha de adquisición inválida');
      } else if (acquisitionDate > new Date()) {
        errors.push('La fecha de adquisición no puede ser futura');
      }
    }

    // Validaciones de costo de adquisición
    if (data.acquisition_cost !== undefined && data.acquisition_cost !== null) {
      if (isNaN(parseFloat(data.acquisition_cost))) {
        errors.push('El costo de adquisición debe ser un número');
      } else if (parseFloat(data.acquisition_cost) < 0) {
        errors.push('El costo de adquisición no puede ser negativo');
      }
    }

    // Validaciones de booleanos
    if (data.is_primary_owner !== undefined && typeof data.is_primary_owner !== 'boolean') {
      errors.push('El campo is_primary_owner debe ser verdadero o falso');
    }

    // Validaciones de longitud de texto
    if (data.notes && data.notes.length > 1000) {
      errors.push('Las notas no pueden exceder 1000 caracteres');
    }

    return errors;
  }

  /**
   * Validar datos de transferencia de propiedad
   * @param {Object} data - Datos de transferencia a validar
   * @returns {Array} Lista de errores de validación
   */
  static validateTransferData(data) {
    const errors = [];

    // Validar ID del tercero origen
    if (!data.fromThirdPartyId || isNaN(parseInt(data.fromThirdPartyId))) {
      errors.push('El ID del tercero origen es obligatorio y debe ser un número');
    }

    // Validar ID del tercero destino
    if (!data.toThirdPartyId || isNaN(parseInt(data.toThirdPartyId))) {
      errors.push('El ID del tercero destino es obligatorio y debe ser un número');
    }

    // Verificar que no sean el mismo tercero
    if (data.fromThirdPartyId && data.toThirdPartyId && 
        parseInt(data.fromThirdPartyId) === parseInt(data.toThirdPartyId)) {
      errors.push('El tercero origen y destino no pueden ser el mismo');
    }

    // Validar porcentaje de transferencia
    if (!data.transferPercentage || isNaN(parseFloat(data.transferPercentage))) {
      errors.push('El porcentaje de transferencia es obligatorio y debe ser un número');
    } else {
      const percentage = parseFloat(data.transferPercentage);
      if (percentage <= 0 || percentage > 100) {
        errors.push('El porcentaje de transferencia debe estar entre 0.01 y 100');
      }
    }

    return errors;
  }
}

module.exports = PropertyOwnersController; 