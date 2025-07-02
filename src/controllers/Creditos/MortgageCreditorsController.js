/**
 * Controlador para gestionar los acreedores de créditos hipotecarios
 * @module controllers/Creditos/MortgageCreditorsController
 */

const MortgageCreditorsModel = require('../../models/Creditos/MortgageCreditorsModel');

class MortgageCreditorsController {
  /**
   * Obtener todos los acreedores con filtros opcionales
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const creditors = await MortgageCreditorsModel.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Acreedores de créditos obtenidos correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedores de créditos',
        error: error.message
      });
    }
  }

  /**
   * Obtener acreedor por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const creditor = await MortgageCreditorsModel.getById(id);
      
      if (!creditor) {
        return res.status(404).json({
          success: false,
          message: `Acreedor con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: creditor,
        message: 'Acreedor obtenido correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedor',
        error: error.message
      });
    }
  }

  /**
   * Obtener acreedores por crédito hipotecario
   */
  static async getByMortgageId(req, res) {
    try {
      const { mortgageId } = req.params;
      const creditors = await MortgageCreditorsModel.getByMortgageId(mortgageId);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Acreedores del crédito obtenidos correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedores del crédito',
        error: error.message
      });
    }
  }

  /**
   * Obtener acreedores por tercero
   */
  static async getByThirdPartyId(req, res) {
    try {
      const { thirdPartyId } = req.params;
      const creditors = await MortgageCreditorsModel.getByThirdPartyId(thirdPartyId);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Acreedurías del tercero obtenidas correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedurías del tercero',
        error: error.message
      });
    }
  }

  /**
   * Crear nuevo acreedor
   */
  static async create(req, res) {
    try {
      const creditorData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validaciones de campos requeridos
      if (!creditorData.mortgage_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del crédito hipotecario es requerido'
        });
      }

      if (!creditorData.third_party_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del tercero es requerido'
        });
      }

      if (!creditorData.investment_amount) {
        return res.status(400).json({
          success: false,
          message: 'El monto de inversión es requerido'
        });
      }

      if (!creditorData.investment_start_date) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio de inversión es requerida'
        });
      }

      // Validar tipos de datos
      if (isNaN(creditorData.investment_amount) || creditorData.investment_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto de inversión debe ser un número positivo'
        });
      }

      if (creditorData.investment_percentage && (isNaN(creditorData.investment_percentage) || creditorData.investment_percentage < 0 || creditorData.investment_percentage > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de inversión debe ser un número entre 0 y 100'
        });
      }

      if (creditorData.interest_rate_share && (isNaN(creditorData.interest_rate_share) || creditorData.interest_rate_share < 0 || creditorData.interest_rate_share > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de participación en intereses debe ser un número entre 0 y 100'
        });
      }

      if (creditorData.management_fee_share && (isNaN(creditorData.management_fee_share) || creditorData.management_fee_share < 0 || creditorData.management_fee_share > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de cuota de manejo debe ser un número entre 0 y 100'
        });
      }

      // Validar tipo de acreedor
      const validCreditorTypes = ['primary', 'secondary', 'investor'];
      if (creditorData.creditor_type && !validCreditorTypes.includes(creditorData.creditor_type)) {
        return res.status(400).json({
          success: false,
          message: `El tipo de acreedor debe ser uno de: ${validCreditorTypes.join(', ')}`
        });
      }

      // Validar fechas
      const startDate = new Date(creditorData.investment_start_date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio de inversión tiene un formato inválido'
        });
      }

      if (creditorData.investment_end_date) {
        const endDate = new Date(creditorData.investment_end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin de inversión tiene un formato inválido'
          });
        }

        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin de inversión debe ser posterior a la fecha de inicio'
          });
        }
      }

      const creditorId = await MortgageCreditorsModel.create(creditorData);
      
      res.status(201).json({
        success: true,
        data: { id: creditorId },
        message: 'Acreedor creado correctamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al crear acreedor',
        error: error.message
      });
    }
  }

  /**
   * Actualizar acreedor existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const creditorData = req.body;

      // Validar tipos de datos si se proporcionan
      if (creditorData.investment_amount !== undefined && (isNaN(creditorData.investment_amount) || creditorData.investment_amount <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'El monto de inversión debe ser un número positivo'
        });
      }

      if (creditorData.investment_percentage !== undefined && (isNaN(creditorData.investment_percentage) || creditorData.investment_percentage < 0 || creditorData.investment_percentage > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de inversión debe ser un número entre 0 y 100'
        });
      }

      if (creditorData.interest_rate_share !== undefined && (isNaN(creditorData.interest_rate_share) || creditorData.interest_rate_share < 0 || creditorData.interest_rate_share > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de participación en intereses debe ser un número entre 0 y 100'
        });
      }

      if (creditorData.management_fee_share !== undefined && (isNaN(creditorData.management_fee_share) || creditorData.management_fee_share < 0 || creditorData.management_fee_share > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de cuota de manejo debe ser un número entre 0 y 100'
        });
      }

      // Validar tipo de acreedor
      const validCreditorTypes = ['primary', 'secondary', 'investor'];
      if (creditorData.creditor_type && !validCreditorTypes.includes(creditorData.creditor_type)) {
        return res.status(400).json({
          success: false,
          message: `El tipo de acreedor debe ser uno de: ${validCreditorTypes.join(', ')}`
        });
      }

      // Validar fechas si se proporcionan
      if (creditorData.investment_start_date) {
        const startDate = new Date(creditorData.investment_start_date);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de inicio de inversión tiene un formato inválido'
          });
        }
      }

      if (creditorData.investment_end_date) {
        const endDate = new Date(creditorData.investment_end_date);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de fin de inversión tiene un formato inválido'
          });
        }
      }

      const result = await MortgageCreditorsModel.update(id, creditorData);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Acreedor actualizado correctamente'
      });
    } catch (error) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(400).json({
        success: false,
        message: 'Error al actualizar acreedor',
        error: error.message
      });
    }
  }

  /**
   * Eliminar acreedor
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await MortgageCreditorsModel.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Acreedor eliminado correctamente'
      });
    } catch (error) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('único acreedor')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar acreedor',
        error: error.message
      });
    }
  }

  /**
   * Cambiar acreedor principal
   */
  static async changePrimaryCreditor(req, res) {
    try {
      const { mortgageId } = req.params;
      const { newPrimaryCreditorId } = req.body;

      if (!newPrimaryCreditorId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del nuevo acreedor principal es requerido'
        });
      }

      const result = await MortgageCreditorsModel.changePrimaryCreditor(mortgageId, newPrimaryCreditorId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Acreedor principal cambiado correctamente'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error al cambiar acreedor principal',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de acreedores
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await MortgageCreditorsModel.getStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Estadísticas de acreedores obtenidas correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de acreedores',
        error: error.message
      });
    }
  }

  /**
   * Obtener opciones para formularios
   */
  static async getFormOptions(req, res) {
    try {
      const options = await MortgageCreditorsModel.getFormOptions();
      
      res.status(200).json({
        success: true,
        data: options,
        message: 'Opciones para formularios obtenidas correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener opciones para formularios',
        error: error.message
      });
    }
  }

  /**
   * Verificar si un tercero puede ser eliminado
   */
  static async canDeleteThirdParty(req, res) {
    try {
      const { thirdPartyId } = req.params;
      const canDelete = await MortgageCreditorsModel.canDeleteThirdParty(thirdPartyId);
      
      res.status(200).json({
        success: true,
        data: { canDelete },
        message: canDelete 
          ? 'El tercero puede ser eliminado' 
          : 'El tercero no puede ser eliminado porque tiene acreedurías activas'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar si el tercero puede ser eliminado',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de inversiones por acreedor
   */
  static async getInvestmentSummaryByCreditor(req, res) {
    try {
      const { thirdPartyId } = req.params;
      const summary = await MortgageCreditorsModel.getInvestmentSummaryByCreditor(thirdPartyId);
      
      if (!summary || !summary.creditor_name) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron inversiones para el tercero especificado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: summary,
        message: 'Resumen de inversiones obtenido correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de inversiones',
        error: error.message
      });
    }
  }

  /**
   * Buscar acreedores con filtros avanzados
   */
  static async searchAdvanced(req, res) {
    try {
      const filters = {
        ...req.query,
        // Filtros específicos para búsqueda avanzada
        active_investments_only: req.query.active_only === 'true',
        is_primary_creditor: req.query.primary_only === 'true' ? true : undefined
      };

      const creditors = await MortgageCreditorsModel.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Búsqueda avanzada de acreedores completada',
        filters_applied: filters
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en búsqueda avanzada de acreedores',
        error: error.message
      });
    }
  }

  /**
   * Obtener acreedores principales solamente
   */
  static async getPrimaryCreditors(req, res) {
    try {
      const filters = {
        ...req.query,
        is_primary_creditor: true
      };

      const creditors = await MortgageCreditorsModel.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: creditors,
        count: creditors.length,
        message: 'Acreedores principales obtenidos correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener acreedores principales',
        error: error.message
      });
    }
  }

  /**
   * Obtener inversionistas
   */
  static async getInvestors(req, res) {
    try {
      const filters = {
        ...req.query,
        creditor_type: 'investor'
      };

      const investors = await MortgageCreditorsModel.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: investors,
        count: investors.length,
        message: 'Inversionistas obtenidos correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener inversionistas',
        error: error.message
      });
    }
  }

  /**
   * Obtener inversiones activas
   */
  static async getActiveInvestments(req, res) {
    try {
      const filters = {
        ...req.query,
        active_investments_only: true
      };

      const activeInvestments = await MortgageCreditorsModel.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: activeInvestments,
        count: activeInvestments.length,
        message: 'Inversiones activas obtenidas correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener inversiones activas',
        error: error.message
      });
    }
  }
}

module.exports = MortgageCreditorsController;
