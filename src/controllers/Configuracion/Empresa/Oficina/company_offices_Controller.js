/**
 * Controlador para gestionar las oficinas de empresas
 * @module controllers/Configuracion/Empresa/Oficina/company_offices_Controller
 */

const Company_offices = require('../../../../models/Configuracion/Empresa/Oficina/company_offices_Model');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar oficinas de empresas
 */
class Company_officesController {
  /**
   * Obtener todas las oficinas con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const offices = await Company_offices.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: offices,
        count: offices.length,
        message: 'Oficinas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener oficinas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener oficinas',
        error: error.message
      });
    }
  }

  /**
   * Obtener una oficina por su ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const office = await Company_offices.getById(id);
      
      if (!office) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la oficina con ID: ${id}`
        });
      }
      
      res.status(200).json({
        success: true,
        data: office,
        message: 'Oficina obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener oficina por ID: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la oficina',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva oficina
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const officeData = {
        ...req.body,
        created_by: req.user.id // Se asume que el middleware de autenticación agrega el usuario a req
      };
      
      // Validar datos obligatorios
      if (!officeData.company_id || !officeData.name) {
        return res.status(400).json({
          success: false,
          message: 'Los campos company_id y name son obligatorios'
        });
      }
      
      const newOffice = await Company_offices.create(officeData);
      
      res.status(201).json({
        success: true,
        data: newOffice,
        message: 'Oficina creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear oficina: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear la oficina',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una oficina existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const officeData = req.body;
      
      // Validar que la oficina existe
      const existingOffice = await Company_offices.getById(id);
      if (!existingOffice) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la oficina con ID: ${id}`
        });
      }
      
      // Validar datos obligatorios
      if (!officeData.company_id || !officeData.name) {
        return res.status(400).json({
          success: false,
          message: 'Los campos company_id y name son obligatorios'
        });
      }
      
      const result = await Company_offices.update(id, officeData);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Oficina actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar oficina: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la oficina',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una oficina
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que la oficina existe
      const existingOffice = await Company_offices.getById(id);
      if (!existingOffice) {
        return res.status(404).json({
          success: false,
          message: `No se encontró la oficina con ID: ${id}`
        });
      }
      
      const result = await Company_offices.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Oficina eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar oficina: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la oficina',
        error: error.message
      });
    }
  }
}

module.exports = Company_officesController; 