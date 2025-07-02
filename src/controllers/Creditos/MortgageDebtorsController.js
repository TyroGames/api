/**
 * Controlador para gestionar los deudores de créditos hipotecarios del sistema de créditos
 * @module controllers/Creditos/MortgageDebtorsController
 */

const MortgageDebtors = require('../../models/Creditos/MortgageDebtorsModel');
const logger = require('../../utils/logger');

/**
 * Controlador para operaciones CRUD de deudores de créditos hipotecarios
 */
class MortgageDebtorsController {
  /**
   * Obtener todos los deudores de créditos con filtros opcionales
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        mortgage_id: req.query.mortgage_id,
        third_party_id: req.query.third_party_id,
        credit_number: req.query.credit_number,
        debtor_type: req.query.debtor_type,
        is_primary_debtor: req.query.is_primary_debtor !== undefined ? req.query.is_primary_debtor === 'true' : undefined,
        employment_status: req.query.employment_status,
        document_number: req.query.document_number,
        debtor_name: req.query.debtor_name,
        min_monthly_income: req.query.min_monthly_income,
        max_monthly_income: req.query.max_monthly_income,
        min_credit_score: req.query.min_credit_score,
        max_credit_score: req.query.max_credit_score,
        mortgage_status: req.query.mortgage_status,
        limit: req.query.limit
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const debtors = await MortgageDebtors.getAll(filters);
      
      logger.info(`Deudores de créditos obtenidos: ${debtors.length} registros con filtros:`, filters);

      res.json({
        success: true,
        data: debtors,
        total: debtors.length,
        message: `Se encontraron ${debtors.length} deudores de créditos`
      });
    } catch (error) {
      logger.error(`Error al obtener deudores de créditos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener deudores de créditos',
        error: error.message
      });
    }
  }

  /**
   * Obtener un deudor de crédito por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de deudor de crédito inválido'
        });
      }

      const debtor = await MortgageDebtors.getById(parseInt(id));
      
      if (!debtor) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el deudor de crédito con ID ${id}`
        });
      }

      logger.info(`Deudor de crédito obtenido: ${debtor.debtor_name} - ${debtor.credit_number}`);

      res.json({
        success: true,
        data: debtor,
        message: 'Deudor de crédito obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener deudor de crédito: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el deudor de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener deudores de un crédito específico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByMortgageId(req, res) {
    try {
      const { mortgageId } = req.params;
      
      if (!mortgageId || isNaN(parseInt(mortgageId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de crédito hipotecario inválido'
        });
      }

      const debtors = await MortgageDebtors.getByMortgageId(parseInt(mortgageId));
      
      logger.info(`Deudores obtenidos por crédito: ${debtors.length} registros`);

      res.json({
        success: true,
        data: debtors,
        total: debtors.length,
        message: `Se encontraron ${debtors.length} deudores para el crédito`
      });
    } catch (error) {
      logger.error(`Error al obtener deudores por crédito: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener deudores por crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener deudores por tercero
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getByThirdPartyId(req, res) {
    try {
      const { thirdPartyId } = req.params;
      
      if (!thirdPartyId || isNaN(parseInt(thirdPartyId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de tercero inválido'
        });
      }

      const debtors = await MortgageDebtors.getByThirdPartyId(parseInt(thirdPartyId));
      
      logger.info(`Créditos como deudor obtenidos por tercero: ${debtors.length} registros`);

      res.json({
        success: true,
        data: debtors,
        total: debtors.length,
        message: `Se encontraron ${debtors.length} créditos donde es deudor`
      });
    } catch (error) {
      logger.error(`Error al obtener créditos por tercero: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener créditos por tercero',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo deudor de crédito
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async create(req, res) {
    try {
      const {
        mortgage_id,
        third_party_id,
        debtor_type,
        responsibility_percentage,
        is_primary_debtor,
        monthly_income,
        employment_status,
        employer_name,
        employment_start_date,
        credit_score,
        notes
      } = req.body;

      // Validaciones de campos requeridos
      const requiredFields = ['mortgage_id', 'third_party_id'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`
        });
      }

      // Validaciones de tipos de datos
      if (isNaN(parseInt(mortgage_id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID del crédito hipotecario debe ser un número válido'
        });
      }

      if (isNaN(parseInt(third_party_id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID del tercero debe ser un número válido'
        });
      }

      // Validar porcentaje de responsabilidad
      if (responsibility_percentage !== undefined) {
        const percentage = parseFloat(responsibility_percentage);
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          return res.status(400).json({
            success: false,
            message: 'El porcentaje de responsabilidad debe ser un número entre 0.01 y 100'
          });
        }
      }

      // Validar ingreso mensual
      if (monthly_income !== undefined && monthly_income !== null && monthly_income !== '') {
        if (isNaN(parseFloat(monthly_income)) || parseFloat(monthly_income) < 0) {
          return res.status(400).json({
            success: false,
            message: 'El ingreso mensual debe ser un número mayor o igual a 0'
          });
        }
      }

      // Validar puntaje de crédito
      if (credit_score !== undefined && credit_score !== null && credit_score !== '') {
        const score = parseInt(credit_score);
        if (isNaN(score) || score < 0 || score > 1000) {
          return res.status(400).json({
            success: false,
            message: 'El puntaje de crédito debe ser un número entre 0 y 1000'
          });
        }
      }

      // Validar tipos de deudor
      if (debtor_type && !['primary', 'secondary', 'guarantor'].includes(debtor_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de deudor inválido. Tipos permitidos: primary, secondary, guarantor'
        });
      }

      // Validar estados de empleo
      if (employment_status && !['employed', 'self_employed', 'unemployed', 'retired', 'other'].includes(employment_status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de empleo inválido. Estados permitidos: employed, self_employed, unemployed, retired, other'
        });
      }

      // Validar fecha de inicio de empleo
      if (employment_start_date) {
        const startDate = new Date(employment_start_date);
        const today = new Date();
        if (startDate > today) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio de empleo no puede ser futura'
          });
        }
      }

      const debtorData = {
        ...req.body,
        created_by: req.user.id
      };

      const newDebtor = await MortgageDebtors.create(debtorData);
      
      logger.info(`Deudor de crédito creado: ${newDebtor.debtor_name} para crédito ${newDebtor.credit_number} por usuario ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: newDebtor,
        message: 'Deudor de crédito creado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al crear deudor de crédito: ${error.message}`);
      
      // Manejar errores específicos de validación
      if (error.message.includes('no existe') ||
          error.message.includes('ya es deudor') ||
          error.message.includes('ya tiene un deudor principal') ||
          error.message.includes('excedería 100%')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear el deudor de crédito',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un deudor de crédito existente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de deudor de crédito inválido'
        });
      }

      const {
        debtor_type,
        responsibility_percentage,
        is_primary_debtor,
        monthly_income,
        employment_status,
        employer_name,
        employment_start_date,
        credit_score,
        notes
      } = req.body;

      // Validaciones de tipos de datos si están presentes
      if (responsibility_percentage !== undefined) {
        const percentage = parseFloat(responsibility_percentage);
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          return res.status(400).json({
            success: false,
            message: 'El porcentaje de responsabilidad debe ser un número entre 0.01 y 100'
          });
        }
      }

      if (monthly_income !== undefined && monthly_income !== null && monthly_income !== '') {
        if (isNaN(parseFloat(monthly_income)) || parseFloat(monthly_income) < 0) {
          return res.status(400).json({
            success: false,
            message: 'El ingreso mensual debe ser un número mayor o igual a 0'
          });
        }
      }

      if (credit_score !== undefined && credit_score !== null && credit_score !== '') {
        const score = parseInt(credit_score);
        if (isNaN(score) || score < 0 || score > 1000) {
          return res.status(400).json({
            success: false,
            message: 'El puntaje de crédito debe ser un número entre 0 y 1000'
          });
        }
      }

      // Validar tipos de deudor
      if (debtor_type && !['primary', 'secondary', 'guarantor'].includes(debtor_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de deudor inválido. Tipos permitidos: primary, secondary, guarantor'
        });
      }

      // Validar estados de empleo
      if (employment_status && !['employed', 'self_employed', 'unemployed', 'retired', 'other'].includes(employment_status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de empleo inválido. Estados permitidos: employed, self_employed, unemployed, retired, other'
        });
      }

      // Validar fecha de inicio de empleo
      if (employment_start_date) {
        const startDate = new Date(employment_start_date);
        const today = new Date();
        if (startDate > today) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio de empleo no puede ser futura'
          });
        }
      }

      const updatedDebtor = await MortgageDebtors.update(parseInt(id), req.body);
      
      logger.info(`Deudor de crédito actualizado: ${updatedDebtor.debtor_name} por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: updatedDebtor,
        message: 'Deudor de crédito actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar deudor de crédito: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') ||
          error.message.includes('ya tiene otro deudor principal') ||
          error.message.includes('excedería 100%')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el deudor de crédito',
        error: error.message
      });
    }
  }

  /**
   * Eliminar un deudor de crédito
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de deudor de crédito inválido'
        });
      }

      const result = await MortgageDebtors.delete(parseInt(id));
      
      if (result) {
        logger.info(`Deudor de crédito eliminado con ID: ${id} por usuario ${req.user.id}`);

        res.json({
          success: true,
          message: 'Deudor de crédito eliminado exitosamente'
        });
      }
    } catch (error) {
      logger.error(`Error al eliminar deudor de crédito: ${error.message}`);
      
      // Manejar errores específicos
      if (error.message.includes('no existe') ||
          error.message.includes('No se puede eliminar el único deudor')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar el deudor de crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de deudores de créditos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await MortgageDebtors.getStatistics();
      
      logger.info('Estadísticas de deudores de créditos obtenidas exitosamente');

      res.json({
        success: true,
        data: statistics,
        message: 'Estadísticas de deudores de créditos obtenidas exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtener opciones para formularios
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getFormOptions(req, res) {
    try {
      const options = await MortgageDebtors.getFormOptions();
      
      res.json({
        success: true,
        data: options,
        message: 'Opciones de formulario obtenidas exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener opciones de formulario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener opciones de formulario',
        error: error.message
      });
    }
  }
}

module.exports = MortgageDebtorsController;