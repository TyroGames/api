const ChartOfAccounts = require('../../../../models/Contabilidad/General/Cuentas_Contables/chartOfAccountsModel');
const logger = require('../../../../utils/logger');

/**
 * Controlador para el plan de cuentas contables
 */
const ChartOfAccountsController = {
  /**
   * Obtener todas las cuentas contables
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getAll: async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const accounts = await ChartOfAccounts.findAll(includeInactive === 'true');
      
      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas contables: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuentas contables',
        error: error.message
      });
    }
  },

  /**
   * Obtener cuentas contables jerárquicamente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getHierarchical: async (req, res) => {
    try {
      const accounts = await ChartOfAccounts.findHierarchical();
      
      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      logger.error(`Error al obtener jerarquía de cuentas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener jerarquía de cuentas',
        error: error.message
      });
    }
  },

  /**
   * Obtener una cuenta contable por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await ChartOfAccounts.findById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta contable con ID ${id} no encontrada`
        });
      }
      
      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta contable por ID: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta contable',
        error: error.message
      });
    }
  },

  /**
   * Obtener una cuenta contable por su código
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const account = await ChartOfAccounts.findByCode(code);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta contable con código ${code} no encontrada`
        });
      }
      
      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta contable por código: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta contable',
        error: error.message
      });
    }
  },

  /**
   * Crear una nueva cuenta contable
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  create: async (req, res) => {
    try {
      const { 
        code, name, description, account_type_id, parent_account_id,
        is_active, allows_entries, level, balance_type
      } = req.body;
      
      // Validar campos obligatorios
      if (!code || !name || !account_type_id || !level || !balance_type) {
        return res.status(400).json({
          success: false,
          message: 'Los campos obligatorios son: code, name, account_type_id, level, balance_type'
        });
      }
      
      // Validar que balance_type sea válido
      if (!['debit', 'credit'].includes(balance_type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de saldo debe ser "debit" o "credit"'
        });
      }
      
      // Obtener el ID del usuario desde el middleware de autenticación
      const userId = req.user.id;
      
      // Crear la cuenta contable
      const newAccount = await ChartOfAccounts.create({
        code,
        name,
        description,
        account_type_id,
        parent_account_id: parent_account_id || null,
        is_active: is_active !== undefined ? is_active : true,
        allows_entries: allows_entries !== undefined ? allows_entries : false,
        level,
        balance_type
      }, userId);
      
      res.status(201).json({
        success: true,
        message: 'Cuenta contable creada exitosamente',
        data: newAccount
      });
    } catch (error) {
      logger.error(`Error al crear cuenta contable: ${error.message}`);
      
      // Si es un error de duplicación de código
      if (error.message.includes('Ya existe una cuenta con el código')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear cuenta contable',
        error: error.message
      });
    }
  },

  /**
   * Actualizar una cuenta contable existente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
    
      const { 
        code, name, description, account_type_id, parent_account_id,
        is_active, allows_entries, level, balance_type
      } = req.body;
   

      // Validar campos obligatorios
      if (!code || !name || !account_type_id || !level || !balance_type) {
        return res.status(400).json({
          success: false,
          message: 'Los campos obligatorios son: code, name, account_type_id, level, balance_type'
        });
      }
      
      // Validar que balance_type sea válido
      if (!['debit', 'credit'].includes(balance_type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de saldo debe ser "debit" o "credit"'
        });
      }
      
      // Verificar si la cuenta existe
      //const account = await ChartOfAccounts.findByCode(id);


      //if (!account) {
      //  return res.status(404).json({
      //    success: false,
      //    message: `Cuenta contable con ID ${id} no encontrada`
      //  });
      //}
      
      // Obtener el ID del usuario desde el middleware de autenticación
      const userId = req.user.id;
      console.log(userId);
      
      // Actualizar la cuenta contable
      const updated = await ChartOfAccounts.update(id, {
        code,
        name,
        description,
        account_type_id,
        parent_account_id: parent_account_id || null,
        is_active: is_active !== undefined ? is_active : true,
        allows_entries: allows_entries !== undefined ? allows_entries : false,
        level,
        balance_type
      }, userId);
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar la cuenta contable'
        });
      }
      
      res.json({
        success: true,
        message: 'Cuenta contable actualizada exitosamente',
        data: {
          id: parseInt(id),
          code,
          name,
          description,
          account_type_id,
          parent_account_id: parent_account_id || null,
          is_active: is_active !== undefined ? is_active : true,
          allows_entries: allows_entries !== undefined ? allows_entries : false,
          level,
          balance_type
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar cuenta contable: ${error.message}`);
      
      // Si es un error de duplicación de código
      if (error.message.includes('Ya existe otra cuenta con el código')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cuenta contable',
        error: error.message
      });
    }
  },

  /**
   * Eliminar una cuenta contable
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si la cuenta existe
      const account = await ChartOfAccounts.findById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta contable con ID ${id} no encontrada`
        });
      }
      
      // Eliminar la cuenta contable
      const deleted = await ChartOfAccounts.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar la cuenta contable'
        });
      }
      
      res.json({
        success: true,
        message: 'Cuenta contable eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar cuenta contable: ${error.message}`);
      
      // Si es un error de negocio (cuenta con subcuentas o con movimientos)
      if (error.message.includes('tiene subcuentas asociadas') || 
          error.message.includes('tiene movimientos contables')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cuenta contable',
        error: error.message
      });
    }
  },

  /**
   * Obtener el saldo de una cuenta contable
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getBalance: async (req, res) => {
    try {
      const { accountId, fiscalPeriodId } = req.params;
      
      // Verificar si la cuenta existe
      const account = await ChartOfAccounts.findById(accountId);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta contable con ID ${accountId} no encontrada`
        });
      }
      
      // Obtener el saldo
      const balance = await ChartOfAccounts.getBalance(accountId, fiscalPeriodId);
      
      res.json({
        success: true,
        data: {
          ...balance,
          account_code: account.code,
          account_name: account.name,
          account_balance_type: account.balance_type
        }
      });
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener saldo de cuenta',
        error: error.message
      });
    }
  }
};

module.exports = ChartOfAccountsController; 