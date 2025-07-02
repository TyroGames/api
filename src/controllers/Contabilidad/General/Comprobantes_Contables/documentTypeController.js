/**
 * Controlador para gestionar los tipos de comprobantes contables
 * @module controllers/Contabilidad/General/Comprobantes_Contables/documentTypeController
 */

const DocumentType = require('../../../../models/Contabilidad/General/Comprobantes_Contables/documentTypeModel');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar tipos de comprobantes contables
 */
class DocumentTypeController {
  /**
   * Obtener todos los tipos de comprobantes contables
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const types = await DocumentType.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: types,
        count: types.length,
        message: 'Tipos de comprobantes contables obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de comprobantes contables: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de comprobantes contables',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tipo de comprobante contable por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const type = await DocumentType.getById(id);
      
      if (!type) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener estadísticas de uso
      const stats = await DocumentType.getStats(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...type,
          estadisticas: stats
        },
        message: 'Tipo de comprobante contable obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante contable: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Obtener un tipo de comprobante contable por código
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByCode(req, res) {
    try {
      const { codigo } = req.params;
      const type = await DocumentType.getByCode(codigo);
      
      if (!type) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con código ${codigo} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: type,
        message: 'Tipo de comprobante contable obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante contable por código: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo tipo de comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const typeData = req.body;
      
      // Crear el tipo de comprobante
      const type = await DocumentType.create(typeData);
      
      res.status(201).json({
        success: true,
        data: type,
        message: 'Tipo de comprobante contable creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear tipo de comprobante contable: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error al crear tipo de comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un tipo de comprobante contable existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const typeData = req.body;
      
      // Verificar que el tipo exista
      const currentType = await DocumentType.getById(id);
      
      if (!currentType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Actualizar el tipo de comprobante
      const updatedType = await DocumentType.update(id, typeData);
      
      res.status(200).json({
        success: true,
        data: updatedType,
        message: 'Tipo de comprobante contable actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar tipo de comprobante contable: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error al actualizar tipo de comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Actualizar el consecutivo de un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updateConsecutivo(req, res) {
    try {
      const { id } = req.params;
      const { consecutivo } = req.body;
      
      // Verificar que el tipo exista
      const currentType = await DocumentType.getById(id);
      
      if (!currentType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Actualizar el consecutivo
      const result = await DocumentType.updateConsecutivo(id, consecutivo);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Consecutivo actualizado a ${consecutivo} correctamente`
      });
    } catch (error) {
      logger.error(`Error al actualizar consecutivo: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error al actualizar consecutivo',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado de activación de un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      
      // Verificar que el tipo exista
      const currentType = await DocumentType.getById(id);
      
      if (!currentType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Cambiar estado de activación
      const result = await DocumentType.toggleActive(id, activo);
      
      const statusMessage = activo ? 'activado' : 'desactivado';
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Tipo de comprobante ${statusMessage} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado de activación: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error al cambiar estado de activación',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un tipo de comprobante contable
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el tipo exista
      const currentType = await DocumentType.getById(id);
      
      if (!currentType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Eliminar el tipo de comprobante
      await DocumentType.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Tipo de comprobante contable eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar tipo de comprobante contable: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error al eliminar tipo de comprobante contable',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de uso de un tipo de comprobante
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el tipo exista
      const currentType = await DocumentType.getById(id);
      
      if (!currentType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de comprobante contable con ID ${id} no encontrado`
        });
      }
      
      // Obtener estadísticas
      const stats = await DocumentType.getStats(id);
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente'
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

module.exports = DocumentTypeController; 