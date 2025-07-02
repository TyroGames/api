/**
 * Controlador para gestionar los terceros (clientes, proveedores, acreedores, etc.)
 * @module controllers/Contabilidad/General/Terceros/thirdPartyController
 */

const ThirdParty = require('../../../../models/Contabilidad/General/Terceros/thirdPartyModel');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar terceros
 */
class ThirdPartyController {
  /**
   * Obtener todos los terceros con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const thirdParties = await ThirdParty.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: thirdParties,
        count: thirdParties.length,
        message: 'Terceros obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener terceros: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener terceros',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tercero por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const thirdParty = await ThirdParty.getById(id);
      
      if (!thirdParty) {
        return res.status(404).json({
          success: false,
          message: `Tercero con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: thirdParty,
        message: 'Tercero obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tercero ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tercero',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo tercero
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const thirdPartyData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!thirdPartyData.identification_type) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de identificación es requerido'
        });
      }
      
      if (!thirdPartyData.identification_number) {
        return res.status(400).json({
          success: false,
          message: 'El número de identificación es requerido'
        });
      }
      
      if (!thirdPartyData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del tercero es requerido'
        });
      }
      
      if (!thirdPartyData.tax_regime) {
        return res.status(400).json({
          success: false,
          message: 'El régimen tributario es requerido'
        });
      }
      
      const newThirdParty = await ThirdParty.create(thirdPartyData);
      
      res.status(201).json({
        success: true,
        data: newThirdParty,
        message: 'Tercero creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear tercero: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear tercero',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un tercero existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const thirdPartyData = {
        ...req.body,
        updated_by: req.user.id
      };
      
      // Verificar que el tercero exista
      const existingThirdParty = await ThirdParty.getById(id);
      if (!existingThirdParty) {
        return res.status(404).json({
          success: false,
          message: `Tercero con ID ${id} no encontrado`
        });
      }
      
      const updatedThirdParty = await ThirdParty.update(id, thirdPartyData);
      
      res.status(200).json({
        success: true,
        data: updatedThirdParty,
        message: 'Tercero actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar tercero ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar tercero',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado activo/inactivo de un tercero
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      // Validar datos requeridos
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El estado activo/inactivo es requerido'
        });
      }
      
      const result = await ThirdParty.toggleStatus(id, isActive, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Tercero ${isActive ? 'activado' : 'desactivado'} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del tercero ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del tercero',
        error: error.message
      });
    }
  }

  /**
   * Buscar terceros por término de búsqueda
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async search(req, res) {
    try {
      const { term } = req.query;
      
      if (!term) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda es requerido'
        });
      }
      
      const results = await ThirdParty.search(term);
      
      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        message: 'Búsqueda de terceros completada'
      });
    } catch (error) {
      logger.error(`Error en búsqueda de terceros: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error en búsqueda de terceros',
        error: error.message
      });
    }
  }

  /**
   * Verificar si existe un tercero por número de identificación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async checkIdentificationExists(req, res) {
    try {
      const { identification_type, identification_number } = req.query;
      
      if (!identification_type || !identification_number) {
        return res.status(400).json({
          success: false,
          message: 'El tipo y número de identificación son requeridos'
        });
      }
      
      const thirdParty = await ThirdParty.checkIdentificationExists(
        identification_type, 
        identification_number
      );
      
      if (!thirdParty) {
        return res.status(404).json({
          success: false,
          exists: false,
          message: 'No existe un tercero con la identificación proporcionada'
        });
      }
      
      res.status(200).json({
        success: true,
        exists: true,
        data: thirdParty,
        message: 'Identificación encontrada'
      });
    } catch (error) {
      logger.error(`Error al verificar identificación: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar identificación',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los clientes (terceros con is_customer = true)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getCustomers(req, res) {
    try {
      const filters = {
        ...req.query,
        is_customer: true
      };
      
      const customers = await ThirdParty.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: customers,
        count: customers.length,
        message: 'Clientes obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener clientes: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener clientes',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los proveedores (terceros con is_supplier = true)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getSuppliers(req, res) {
    try {
      const filters = {
        ...req.query,
        is_supplier: true
      };
      
      const suppliers = await ThirdParty.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: suppliers,
        count: suppliers.length,
        message: 'Proveedores obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener proveedores: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener proveedores',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los acreedores (terceros con is_creditor = true)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getCreditors(req, res) {
    try {
      const filters = {
        ...req.query,
        is_creditor: true
      };
      
      const creditors = await ThirdParty.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Acreedores obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener acreedores: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedores',
        error: error.message
      });
    }
  }
}

module.exports = ThirdPartyController; 