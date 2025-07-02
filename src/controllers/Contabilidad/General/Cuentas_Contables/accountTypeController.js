const AccountType = require('../../../../../src/models/Contabilidad/General/Cuentas_Contables/accountTypeModel.js');
const logger = require('../../../../../src/utils/logger');

/**
 * Controlador para los tipos de cuenta contable
 */
const AccountTypeController = {
  /**
   * Obtener todos los tipos de cuenta
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getAll: async (req, res) => {
    try {
      const accountTypes = await AccountType.findAll();
      
      res.json({
        success: true,
        data: accountTypes
      });
    } catch (error) {
      logger.error(`Error al obtener tipos de cuenta: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de cuenta',
        error: error.message
      });
    }
  },

  /**
   * Obtener un tipo de cuenta por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const accountType = await AccountType.findById(id);
      
      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de cuenta con ID ${id} no encontrado`
        });
      }
      
      res.json({
        success: true,
        data: accountType
      });
    } catch (error) {
      logger.error(`Error al obtener tipo de cuenta por ID: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de cuenta',
        error: error.message
      });
    }
  },

  /**
   * Crear un nuevo tipo de cuenta
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  create: async (req, res) => {
    try {
      const { name, code, balance_sheet_section, income_statement_section } = req.body;
      
      // Validar campos obligatorios
      if (!name || !code || !balance_sheet_section || !income_statement_section) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios: name, code, balance_sheet_section, income_statement_section'
        });
      }
      
      // Validar que las secciones sean válidas
      const validBalanceSheetSections = ['asset', 'liability', 'equity', 'none'];
      const validIncomeStatementSections = ['revenue', 'expense', 'none'];
      
      if (!validBalanceSheetSections.includes(balance_sheet_section)) {
        return res.status(400).json({
          success: false,
          message: `La sección del balance debe ser una de: ${validBalanceSheetSections.join(', ')}`
        });
      }
      
      if (!validIncomeStatementSections.includes(income_statement_section)) {
        return res.status(400).json({
          success: false,
          message: `La sección del estado de resultados debe ser una de: ${validIncomeStatementSections.join(', ')}`
        });
      }
      
      // Crear el tipo de cuenta
      const newAccountType = await AccountType.create({
        name,
        code,
        balance_sheet_section,
        income_statement_section
      });
      
      res.status(201).json({
        success: true,
        message: 'Tipo de cuenta creado exitosamente',
        data: newAccountType
      });
    } catch (error) {
      logger.error(`Error al crear tipo de cuenta: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear tipo de cuenta',
        error: error.message
      });
    }
  },

  /**
   * Actualizar un tipo de cuenta existente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, balance_sheet_section, income_statement_section } = req.body;
      
      // Validar campos obligatorios
      if (!name || !code || !balance_sheet_section || !income_statement_section) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios: name, code, balance_sheet_section, income_statement_section'
        });
      }
      
      // Validar que las secciones sean válidas
      const validBalanceSheetSections = ['asset', 'liability', 'equity', 'none'];
      const validIncomeStatementSections = ['revenue', 'expense', 'none'];
      
      if (!validBalanceSheetSections.includes(balance_sheet_section)) {
        return res.status(400).json({
          success: false,
          message: `La sección del balance debe ser una de: ${validBalanceSheetSections.join(', ')}`
        });
      }
      
      if (!validIncomeStatementSections.includes(income_statement_section)) {
        return res.status(400).json({
          success: false,
          message: `La sección del estado de resultados debe ser una de: ${validIncomeStatementSections.join(', ')}`
        });
      }
      
      // Verificar si el tipo de cuenta existe
      const accountType = await AccountType.findById(id);
      
      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de cuenta con ID ${id} no encontrado`
        });
      }
      
      // Actualizar el tipo de cuenta
      const updated = await AccountType.update(id, {
        name,
        code,
        balance_sheet_section,
        income_statement_section
      });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el tipo de cuenta'
        });
      }
      
      res.json({
        success: true,
        message: 'Tipo de cuenta actualizado exitosamente',
        data: {
          id: parseInt(id),
          name,
          code,
          balance_sheet_section,
          income_statement_section
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar tipo de cuenta: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar tipo de cuenta',
        error: error.message
      });
    }
  },

  /**
   * Eliminar un tipo de cuenta
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el tipo de cuenta existe
      const accountType = await AccountType.findById(id);
      
      if (!accountType) {
        return res.status(404).json({
          success: false,
          message: `Tipo de cuenta con ID ${id} no encontrado`
        });
      }
      
      // Eliminar el tipo de cuenta
      const deleted = await AccountType.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar el tipo de cuenta'
        });
      }
      
      res.json({
        success: true,
        message: 'Tipo de cuenta eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar tipo de cuenta: ${error.message}`);
      
      // Si es un error de negocio (por ejemplo, el tipo de cuenta está en uso)
      if (error.message.includes('no se puede eliminar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar tipo de cuenta',
        error: error.message
      });
    }
  }
};

module.exports = AccountTypeController; 