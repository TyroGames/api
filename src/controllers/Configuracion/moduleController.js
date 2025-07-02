/**
 * Controlador para gestionar los módulos del sistema
 * @module controllers/Configuracion/moduleController
 */

const Module = require('../../models/Configuracion/moduleModel');
const logger = require('../../utils/logger');

/**
 * Clase de controlador para gestionar módulos del sistema
 */
class ModuleController {
  /**
   * Obtener todos los módulos con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const modules = await Module.getAll(filters);
      
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

  /**
   * Obtener un módulo por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const module = await Module.getById(id);
      
      if (!module) {
        return res.status(404).json({
          success: false,
          message: `Módulo con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: module,
        message: 'Módulo obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener módulo ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener módulo',
        error: error.message
      });
    }
  }

  /**
   * Obtener un módulo por nombre
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByName(req, res) {
    try {
      const { name } = req.params;
      const module = await Module.getByName(name);
      
      if (!module) {
        return res.status(404).json({
          success: false,
          message: `Módulo con nombre '${name}' no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: module,
        message: 'Módulo obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener módulo por nombre ${req.params.name}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener módulo por nombre',
        error: error.message
      });
    }
  }

  /**
   * Obtener la estructura jerárquica de módulos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getModuleTree(req, res) {
    try {
      const moduleTree = await Module.getModuleTree();
      
      res.status(200).json({
        success: true,
        data: moduleTree,
        message: 'Estructura de módulos obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estructura de módulos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estructura de módulos',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo módulo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const moduleData = req.body;
      
      // Validar datos requeridos
      if (!moduleData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre interno del módulo es requerido'
        });
      }
      
      if (!moduleData.display_name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de visualización del módulo es requerido'
        });
      }
      
      // Verificar que el nombre no exista
      const existingModule = await Module.getByName(moduleData.name);
      if (existingModule) {
        return res.status(400).json({
          success: false,
          message: `Ya existe un módulo con el nombre '${moduleData.name}'`
        });
      }
      
      const newModule = await Module.create(moduleData);
      
      res.status(201).json({
        success: true,
        data: newModule,
        message: 'Módulo creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear módulo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear módulo',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un módulo existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const moduleData = req.body;
      
      // Validar que el módulo exista
      const existingModule = await Module.getById(id);
      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: `Módulo con ID ${id} no encontrado`
        });
      }
      
      // Verificar si se está actualizando el nombre y si ya existe otro módulo con ese nombre
      if (moduleData.name && moduleData.name !== existingModule.name) {
        const moduleWithName = await Module.getByName(moduleData.name);
        if (moduleWithName) {
          return res.status(400).json({
            success: false,
            message: `Ya existe un módulo con el nombre '${moduleData.name}'`
          });
        }
      }
      
      const updatedModule = await Module.update(id, moduleData);
      
      res.status(200).json({
        success: true,
        data: updatedModule,
        message: 'Módulo actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar módulo ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar módulo',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado activo/inactivo de un módulo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      // Validar datos requeridos
      if (is_active === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El estado (is_active) es requerido'
        });
      }
      
      // Validar que el módulo exista
      const existingModule = await Module.getById(id);
      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: `Módulo con ID ${id} no encontrado`
        });
      }
      
      const result = await Module.changeStatus(id, is_active);
      
      const statusText = is_active ? 'activado' : 'desactivado';
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Módulo ${statusText} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del módulo ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del módulo',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un módulo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el módulo exista
      const existingModule = await Module.getById(id);
      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: `Módulo con ID ${id} no encontrado`
        });
      }
      
      const result = await Module.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Módulo eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar módulo ${req.params.id}: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('submódulos asociados') || error.message.includes('permisos asociados')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar módulo',
        error: error.message
      });
    }
  }

  /**
   * Reordenar un módulo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async reorder(req, res) {
    try {
      const { id } = req.params;
      const { order_index } = req.body;
      
      // Validar datos requeridos
      if (order_index === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El índice de orden (order_index) es requerido'
        });
      }
      
      // Validar que el módulo exista
      const existingModule = await Module.getById(id);
      if (!existingModule) {
        return res.status(404).json({
          success: false,
          message: `Módulo con ID ${id} no encontrado`
        });
      }
      
      const result = await Module.reorder(id, order_index);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Orden del módulo actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al reordenar módulo ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al reordenar módulo',
        error: error.message
      });
    }
  }
}

module.exports = ModuleController; 