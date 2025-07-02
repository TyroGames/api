/**
 * Controlador para gestionar los permisos del sistema
 * @module controllers/Configuracion/permissionController
 */

const Permission = require('../../models/Configuracion/permissionModel');
const logger = require('../../utils/logger');

/**
 * Controlador para operaciones relacionadas con permisos
 */
class PermissionController {
  /**
   * Obtener todos los permisos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const permissions = await Permission.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: permissions,
        count: permissions.length,
        message: 'Permisos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener permisos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener permisos',
        error: error.message
      });
    }
  }

  /**
   * Obtener un permiso por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const permission = await Permission.getById(id);
      
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: `Permiso con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: permission,
        message: 'Permiso obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener permiso ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener permiso',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo permiso
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const { name, description, module } = req.body;
      
      // Validar datos requeridos
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del permiso es requerido'
        });
      }
      
      if (!module) {
        return res.status(400).json({
          success: false,
          message: 'El módulo del permiso es requerido'
        });
      }
      
      const newPermission = await Permission.create({ name, description, module });
      
      res.status(201).json({
        success: true,
        data: newPermission,
        message: 'Permiso creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear permiso: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear permiso',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un permiso existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, module } = req.body;
      
      // Validar datos requeridos
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del permiso es requerido'
        });
      }
      
      if (!module) {
        return res.status(400).json({
          success: false,
          message: 'El módulo del permiso es requerido'
        });
      }
      
      // Verificar que el permiso exista
      const existingPermission = await Permission.getById(id);
      if (!existingPermission) {
        return res.status(404).json({
          success: false,
          message: `Permiso con ID ${id} no encontrado`
        });
      }
      
      const updatedPermission = await Permission.update(id, { name, description, module });
      
      res.status(200).json({
        success: true,
        data: updatedPermission,
        message: 'Permiso actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar permiso ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar permiso',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un permiso
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el permiso exista
      const existingPermission = await Permission.getById(id);
      if (!existingPermission) {
        return res.status(404).json({
          success: false,
          message: `Permiso con ID ${id} no encontrado`
        });
      }
      
      const result = await Permission.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Permiso eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar permiso ${req.params.id}: ${error.message}`);
      
      // Manejar el error específico de permisos asignados a roles
      if (error.message.includes('asignado a uno o más roles')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar permiso',
        error: error.message
      });
    }
  }

  /**
   * Obtener permisos por módulo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByModule(req, res) {
    try {
      const { module } = req.params;
      const permissions = await Permission.getByModule(module);
      
      res.status(200).json({
        success: true,
        data: permissions,
        count: permissions.length,
        message: `Permisos del módulo ${module} obtenidos correctamente`
      });
    } catch (error) {
      logger.error(`Error al obtener permisos del módulo ${req.params.module}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener permisos por módulo',
        error: error.message
      });
    }
  }

  /**
   * Obtener todos los módulos disponibles
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAllModules(req, res) {
    try {
      const modules = await Permission.getAllModules();
      
      res.status(200).json({
        success: true,
        data: modules,
        count: modules.length,
        message: 'Módulos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener módulos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener módulos',
        error: error.message
      });
    }
  }
}

module.exports = PermissionController; 