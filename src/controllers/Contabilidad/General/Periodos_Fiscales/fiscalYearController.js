/**
 * Controlador para gestionar los años fiscales
 * @module controllers/Contabilidad/General/Periodos_Fiscales/fiscalYearController
 */

const FiscalYear = require('../../../../models/Contabilidad/General/Periodos_Fiscales/fiscalYearModel');
const logger = require('../../../../utils/logger');

/**
 * Clase de controlador para gestionar años fiscales
 */
class FiscalYearController {
  /**
   * Obtener todos los años fiscales con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const years = await FiscalYear.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: years,
        count: years.length,
        message: 'Años fiscales obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener años fiscales: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener años fiscales',
        error: error.message
      });
    }
  }

  /**
   * Obtener un año fiscal por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const year = await FiscalYear.getById(id);
      
      if (!year) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: year,
        message: 'Año fiscal obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener año fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Obtener el año fiscal activo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getActiveFiscalYear(req, res) {
    try {
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const activeYear = await FiscalYear.getActiveYear(company_id);
      
      if (!activeYear) {
        return res.status(404).json({
          success: false,
          message: 'No hay año fiscal activo para esta compañía'
        });
      }
      
      res.status(200).json({
        success: true,
        data: activeYear,
        message: 'Año fiscal activo obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener año fiscal activo: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener año fiscal activo',
        error: error.message
      });
    }
  }

  /**
   * Obtener años fiscales por compañía
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getYearsByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const filters = { ...req.query, company_id: companyId };
      
      const years = await FiscalYear.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: years,
        count: years.length,
        message: 'Años fiscales por compañía obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener años fiscales por compañía: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener años fiscales por compañía',
        error: error.message
      });
    }
  }

  /**
   * Obtener año fiscal por año específico
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByYear(req, res) {
    try {
      const { year } = req.params;
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const fiscalYear = await FiscalYear.getByYear(company_id, year);
      
      if (!fiscalYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal ${year} no encontrado para esta compañía`
        });
      }
      
      res.status(200).json({
        success: true,
        data: fiscalYear,
        message: 'Año fiscal obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener año fiscal por año: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener año fiscal por año',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const yearData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      if (!yearData.company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      if (!yearData.year_number) {
        return res.status(400).json({
          success: false,
          message: 'El número de año es requerido'
        });
      }
      
      if (!yearData.start_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio es requerida'
        });
      }
      
      if (!yearData.end_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin es requerida'
        });
      }
      
      // Validar que la fecha de inicio sea menor que la fecha de fin
      if (new Date(yearData.start_date) >= new Date(yearData.end_date)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser menor que la fecha de fin'
        });
      }
      
      const newYear = await FiscalYear.create(yearData);
      
      res.status(201).json({
        success: true,
        data: newYear,
        message: 'Año fiscal creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const yearData = {
        ...req.body,
        updated_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar que el año exista
      const existingYear = await FiscalYear.getById(id);
      if (!existingYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      // Validar que el año no esté cerrado para poder modificarlo
      if (existingYear.is_closed) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden modificar años fiscales cerrados'
        });
      }
      
      // Validar fechas si se proporcionan
      if (yearData.start_date && yearData.end_date) {
        if (new Date(yearData.start_date) >= new Date(yearData.end_date)) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio debe ser menor que la fecha de fin'
          });
        }
      }
      
      const updatedYear = await FiscalYear.update(id, yearData);
      
      res.status(200).json({
        success: true,
        data: updatedYear,
        message: 'Año fiscal actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar año fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Activar un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async activateFiscalYear(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el año exista
      const existingYear = await FiscalYear.getById(id);
      if (!existingYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalYear.activateYear(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Año fiscal activado correctamente'
      });
    } catch (error) {
      logger.error(`Error al activar año fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al activar año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Cerrar un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async closeFiscalYear(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      
      // Validar que el año exista
      const existingYear = await FiscalYear.getById(id);
      if (!existingYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalYear.closeYear(id, req.user.id, comments || '');
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Año fiscal cerrado correctamente'
      });
    } catch (error) {
      logger.error(`Error al cerrar año fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el año exista
      const existingYear = await FiscalYear.getById(id);
      if (!existingYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      const result = await FiscalYear.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Año fiscal eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar año fiscal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Generar períodos fiscales para un año
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generatePeriods(req, res) {
    try {
      const { id } = req.params;
      const { period_type = 'monthly' } = req.body;
      
      // Validar que el año exista
      const existingYear = await FiscalYear.getById(id);
      if (!existingYear) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      const generatedPeriods = await FiscalYear.generatePeriods(id, period_type, req.user.id);
      
      res.status(201).json({
        success: true,
        data: generatedPeriods,
        count: generatedPeriods.length,
        message: `${generatedPeriods.length} períodos ${period_type} generados correctamente`
      });
    } catch (error) {
      logger.error(`Error al generar períodos para año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar períodos para año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Validar fechas de un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async validateDates(req, res) {
    try {
      const { company_id, start_date, end_date, exclude_id } = req.body;
      
      if (!company_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'company_id, start_date y end_date son requeridos'
        });
      }
      
      const validation = await FiscalYear.validateDates(company_id, start_date, end_date, exclude_id);
      
      res.status(200).json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Fechas válidas' : 'Fechas inválidas'
      });
    } catch (error) {
      logger.error(`Error al validar fechas de año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al validar fechas de año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Obtener períodos de un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getYearPeriods(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el año fiscal exista
      const year = await FiscalYear.getById(id);
      
      if (!year) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener períodos del año fiscal
      const FiscalPeriod = require('../../../../models/Contabilidad/General/Periodos_Fiscales/fiscalPeriodModel');
      const periods = await FiscalPeriod.getPeriodsByYear(year.company_id, id);
      
      res.status(200).json({
        success: true,
        data: periods,
        count: periods.length,
        message: 'Períodos del año fiscal obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener períodos del año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener períodos del año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de un año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getYearStatistics(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el año fiscal exista
      const year = await FiscalYear.getById(id);
      
      if (!year) {
        return res.status(404).json({
          success: false,
          message: `Año fiscal con ID ${id} no encontrado`
        });
      }
      
      // Obtener estadísticas del año fiscal
      const statistics = await FiscalYear.getYearStatistics(id);
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas del año fiscal obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas del año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Verificar si se puede crear un nuevo año fiscal
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async canCreateNew(req, res) {
    try {
      const { company_id } = req.query;
      
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID de la compañía es requerido'
        });
      }
      
      const canCreate = await FiscalYear.canCreateNew(company_id);
      
      res.status(200).json({
        success: true,
        data: { canCreate },
        message: canCreate 
          ? 'Se puede crear un nuevo año fiscal' 
          : 'No se puede crear un nuevo año fiscal en este momento'
      });
    } catch (error) {
      logger.error(`Error al verificar creación de año fiscal: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar creación de año fiscal',
        error: error.message
      });
    }
  }

  /**
   * Obtener años fiscales cerrados
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getClosedYears(req, res) {
    try {
      const filters = { ...req.query, is_closed: true };
      const years = await FiscalYear.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: years,
        count: years.length,
        message: 'Años fiscales cerrados obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener años fiscales cerrados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener años fiscales cerrados',
        error: error.message
      });
    }
  }

  /**
   * Obtener años fiscales abiertos
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getOpenYears(req, res) {
    try {
      const filters = { ...req.query, is_closed: false };
      const years = await FiscalYear.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: years,
        count: years.length,
        message: 'Años fiscales abiertos obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener años fiscales abiertos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener años fiscales abiertos',
        error: error.message
      });
    }
  }
}

module.exports = FiscalYearController; 