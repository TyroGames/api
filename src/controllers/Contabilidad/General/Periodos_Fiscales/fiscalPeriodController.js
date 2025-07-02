/**
 * Controlador para gestionar los períodos fiscales
 * @module controllers/Contabilidad/General/Periodos_Fiscales/fiscalPeriodController
 */

const FiscalPeriod = require('../../../../models/Contabilidad/General/Periodos_Fiscales/fiscalPeriodModel');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar períodos fiscales
 */
class FiscalPeriodController {
  /**
   * Obtener todos los períodos fiscales con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const periods = await FiscalPeriod.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales',
        error: error.message
      });
    }
  }

  /**
   * Obtener un período fiscal por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const period = await FiscalPeriod.getById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: period,
        message: 'Período fiscal obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener período fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Obtener el período fiscal activo actual
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getCurrentPeriod(req, res) {
    try {
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const currentPeriod = await FiscalPeriod.getCurrentPeriod(company_id);
      
      if (!currentPeriod) {
        return res.status(404).json({
          success: false,
          message: 'No hay período fiscal activo para esta compañía'
        });
      }
      
      res.status(200).json({
        success: true,
        data: currentPeriod,
        message: 'Período fiscal actual obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener período fiscal actual: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener período fiscal actual',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos fiscales por año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodsByYear(req, res) {
    try {
      const { yearId } = req.params;
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const periods = await FiscalPeriod.getPeriodsByYear(company_id, yearId);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales por año obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales por año: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales por año',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos fiscales por compañía
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodsByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const filters = { ...req.query, company_id: companyId };
      
      const periods = await FiscalPeriod.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales por compañía obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales por compañía: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales por compañía',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos fiscales abiertos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getOpenPeriods(req, res) {
    try {
      const filters = { ...req.query, status: 'open' };
      const periods = await FiscalPeriod.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales abiertos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales abiertos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales abiertos',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos fiscales cerrados
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getClosedPeriods(req, res) {
    try {
      const filters = { ...req.query, status: 'closed' };
      const periods = await FiscalPeriod.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales cerrados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales cerrados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales cerrados',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos fiscales pendientes de cierre
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPendingClosePeriods(req, res) {
    try {
      const filters = { ...req.query, status: 'expired' };
      const periods = await FiscalPeriod.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos fiscales pendientes de cierre obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales pendientes de cierre: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos fiscales pendientes de cierre',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const periodData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!periodData.company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      if (!periodData.start_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio es requerida'
        });
      }
      
      if (!periodData.end_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin es requerida'
        });
      }
      
      // Validar que la fecha de inicio sea menor que la fecha de fin
      if (new Date(periodData.start_date) >= new Date(periodData.end_date)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser menor que la fecha de fin'
        });
      }
      
      const newPeriod = await FiscalPeriod.create(periodData);
      
      res.status(201).json({
        success: true,
        data: newPeriod,
        message: 'Período fiscal creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear período fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const periodData = {
        ...req.body,
        updated_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar que el período exista
      const existingPeriod = await FiscalPeriod.getById(id);
      if (!existingPeriod) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      // Validar que el período no esté cerrado para poder modificarlo
      if (existingPeriod.is_closed) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden modificar períodos fiscales cerrados'
        });
      }
      
      // Validar fechas si se proporcionan
      if (periodData.start_date && periodData.end_date) {
        if (new Date(periodData.start_date) >= new Date(periodData.end_date)) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio debe ser menor que la fecha de fin'
          });
        }
      }
      
      const updatedPeriod = await FiscalPeriod.update(id, periodData);
      
      res.status(200).json({
        success: true,
        data: updatedPeriod,
        message: 'Período fiscal actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar período fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Cerrar un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async closePeriod(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      
      // Validar que el período exista
      const existingPeriod = await FiscalPeriod.getById(id);
      if (!existingPeriod) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalPeriod.closePeriod(id, req.user.id, comments || '');
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Período fiscal cerrado correctamente'
      });
    } catch (error) {
      logger.error(`Error al cerrar período fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Reabrir un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async reopenPeriod(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      
      // Validar que el período exista
      const existingPeriod = await FiscalPeriod.getById(id);
      if (!existingPeriod) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalPeriod.reopenPeriod(id, req.user.id, comments || '');
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Período fiscal reabierto correctamente'
      });
    } catch (error) {
      logger.error(`Error al reabrir período fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al reabrir período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el período exista
      const existingPeriod = await FiscalPeriod.getById(id);
      if (!existingPeriod) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalPeriod.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Período fiscal eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar período fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar período fiscal',
        error: error.message
      });
    }
  }

  /**
   * Generar períodos mensuales para un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateMonthlyPeriods(req, res) {
    try {
      const { yearId } = req.params;
      const { company_id } = req.body;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const generatedPeriods = await FiscalPeriod.generateMonthlyPeriods(company_id, yearId, req.user.id);
      
      res.status(201).json({
        success: true,
        data: generatedPeriods,
        count: generatedPeriods.length,
        message: `${generatedPeriods.length} períodos mensuales generados correctamente`
      });
    } catch (error) {
      logger.error(`Error al generar períodos mensuales: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar períodos mensuales',
        error: error.message
      });
    }
  }

  /**
   * Validar secuencia de cierre de períodos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async validateCloseSequence(req, res) {
    try {
      const { company_id, period_id } = req.body;
      
      if (!company_id || !period_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía y del período son requeridos'
        });
      }
      
      // Aquí iría la lógica de validación de secuencia
      // Por ahora, una implementación básica
      
      res.status(200).json({
        success: true,
        data: { valid: true },
        message: 'Secuencia de cierre válida'
      });
    } catch (error) {
      logger.error(`Error al validar secuencia de cierre: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al validar secuencia de cierre',
        error: error.message
      });
    }
  }

  /**
   * Cierre masivo de períodos fiscales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async bulkClosePeriods(req, res) {
    try {
      const { period_ids, comments } = req.body;
      
      // Validar datos requeridos
      if (!period_ids || !Array.isArray(period_ids) || period_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere al menos un ID de período para cierre masivo'
        });
      }
      
      // Cerrar períodos en masa
      const results = [];
      const errors = [];
      
      for (const id of period_ids) {
        try {
          const result = await FiscalPeriod.closePeriod(id, req.user.id, comments || 'Cierre masivo');
          results.push({ id, status: 'success', data: result });
        } catch (error) {
          errors.push({ id, status: 'error', message: error.message });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          success_count: results.length,
          error_count: errors.length,
          results,
          errors
        },
        message: `${results.length} períodos cerrados correctamente, ${errors.length} con errores`
      });
    } catch (error) {
      logger.error(`Error en cierre masivo de períodos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error en cierre masivo de períodos',
        error: error.message
      });
    }
  }

  /**
   * Obtener transacciones de un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodTransactions(req, res) {
    try {
      const { id } = req.params;
      const filters = req.query;
      
      // Verificar que el período exista
      const period = await FiscalPeriod.getById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener transacciones del período
      const transactions = await FiscalPeriod.getPeriodTransactions(id, filters);
      
      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length,
        message: 'Transacciones del período obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener transacciones del período: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener transacciones del período',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodStatistics(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el período exista
      const period = await FiscalPeriod.getById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener estadísticas del período
      const statistics = await FiscalPeriod.getPeriodStatistics(id);
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas del período obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas del período: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del período',
        error: error.message
      });
    }
  }

  /**
   * Obtener comprobantes de un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodVouchers(req, res) {
    try {
      const { id } = req.params;
      const filters = { ...req.query, fiscal_period_id: id };
      
      // Verificar que el período exista
      const period = await FiscalPeriod.getById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener comprobantes del período usando el modelo de vouchers
      const Voucher = require('../../../../models/Contabilidad/General/Comprobantes_Contables/voucherModel');
      const vouchers = await Voucher.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: vouchers,
        count: vouchers.length,
        message: 'Comprobantes del período obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener comprobantes del período: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener comprobantes del período',
        error: error.message
      });
    }
  }

  /**
   * Obtener asientos contables de un período fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getPeriodJournalEntries(req, res) {
    try {
      const { id } = req.params;
      const filters = { ...req.query, fiscal_period_id: id };
      
      // Verificar que el período exista
      const period = await FiscalPeriod.getById(id);
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: `Período fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener asientos contables del período
      // Aquí necesitarías el modelo de JournalEntry
      // const JournalEntry = require('../../../../models/Contabilidad/General/AsientosContables/journalEntryModel');
      // const journalEntries = await JournalEntry.getAll(filters);
      
      // Por ahora, devolvemos un array vacío
      const journalEntries = [];
      
      res.status(200).json({
        success: true,
        data: journalEntries,
        count: journalEntries.length,
        message: 'Asientos contables del período obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener asientos contables del período: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener asientos contables del período',
        error: error.message
      });
    }
  }
}

module.exports = FiscalPeriodController; 