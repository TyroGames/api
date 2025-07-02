/**
 * Controlador para gestionar los roles de usuario
 * @module controllers/Configuracion/roleController
 */

const Role = require('../../models/Configuracion/roleModel');
const logger = require('../../utils/logger');

/**
 * Controlador para operaciones relacionadas con roles
 */
class RoleController {
  /**
   * Obtener todos los roles
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const roles = await Role.getAll();
      
      res.status(200).json({
        success: true,
        data: roles,
        count: roles.length,
        message: 'Roles obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener roles: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener roles',
        error: error.message
      });
    }
  }

  /**
   * Obtener un rol por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.getById(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: `Rol con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: role,
        message: 'Rol obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener rol ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener rol',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo rol
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const { name, description } = req.body;
      
      // Validar datos requeridos
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del rol es requerido'
        });
      }
      
      const newRole = await Role.create({ name, description });
      
      res.status(201).json({
        success: true,
        data: newRole,
        message: 'Rol creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear rol: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear rol',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un rol existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Validar datos requeridos
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del rol es requerido'
        });
      }
      
      // Verificar que el rol exista
      const existingRole = await Role.getById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: `Rol con ID ${id} no encontrado`
        });
      }
      
      const updatedRole = await Role.update(id, { name, description });
      
      res.status(200).json({
        success: true,
        data: updatedRole,
        message: 'Rol actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar rol ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar rol',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un rol
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el rol exista
      const existingRole = await Role.getById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: `Rol con ID ${id} no encontrado`
        });
      }
      
      // No permitir eliminar el rol de administrador (asumiendo que es el ID 1)
      if (id === "1") {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el rol de administrador'
        });
      }
      
      const result = await Role.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Rol eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar rol ${req.params.id}: ${error.message}`);
      
      // Manejar el error específico de roles asignados a usuarios
      if (error.message.includes('usuarios asignados')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar rol',
        error: error.message
      });
    }
  }

  /**
   * Obtener permisos asignados a un rol
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPermissions(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el rol exista
      const existingRole = await Role.getById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: `Rol con ID ${id} no encontrado`
        });
      }
      
      const permissions = await Role.getPermissions(id);
      
      res.status(200).json({
        success: true,
        data: permissions,
        count: permissions.length,
        message: 'Permisos del rol obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener permisos del rol ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener permisos del rol',
        error: error.message
      });
    }
  }

  /**
   * Asignar permisos a un rol
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async assignPermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      // Validar datos requeridos
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Se debe proporcionar un array de IDs de permisos'
        });
      }
      
      // Verificar que el rol exista
      const existingRole = await Role.getById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: `Rol con ID ${id} no encontrado`
        });
      }
      
      await Role.assignPermissions(id, permissions);
      
      res.status(200).json({
        success: true,
        message: 'Permisos asignados correctamente al rol'
      });
    } catch (error) {
      logger.error(`Error al asignar permisos al rol ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al asignar permisos al rol',
        error: error.message
      });
    }
  }
}

module.exports = RoleController; 