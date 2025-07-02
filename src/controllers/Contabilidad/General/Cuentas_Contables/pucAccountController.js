const PucAccount = require('../../../../../src/models/Contabilidad/General/Cuentas_Contables/chartOfAccountsModel');
const logger = require('../../../../../src/utils/logger');

/**
 * Controlador para las cuentas del Plan Único de Cuentas (PUC)
 */
const PucAccountController = {
  /**
   * Obtener todas las cuentas PUC
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getAll: async (req, res) => {
    try {
      const accounts = await PucAccount.findAll();
      
      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas PUC: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuentas PUC',
        error: error.message
      });
    }
  },

  /**
   * Obtener una cuenta PUC por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const account = await PucAccount.findById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta PUC con ID ${id} no encontrada`
        });
      }
      
      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta PUC por ID: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta PUC',
        error: error.message
      });
    }
  },

  /**
   * Obtener una cuenta PUC por su código
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const account = await PucAccount.findByCode(code);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta PUC con código ${code} no encontrada`
        });
      }
      
      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta PUC por código: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta PUC por código',
        error: error.message
      });
    }
  },

  /**
   * Obtener las cuentas hijas de una cuenta padre
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  getChildrenByParentId: async (req, res) => {
    try {
      const { parentId } = req.params;
      
      // Verificar que la cuenta padre existe
      const parentAccount = await PucAccount.findById(parentId);
      if (!parentAccount) {
        return res.status(404).json({
          success: false,
          message: `Cuenta padre con ID ${parentId} no encontrada`
        });
      }
      
      const childAccounts = await PucAccount.findChildrenByParentId(parentId);
      
      res.json({
        success: true,
        data: childAccounts
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas hijas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuentas hijas',
        error: error.message
      });
    }
  },

  /**
   * Crear una nueva cuenta PUC
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  create: async (req, res) => {
    try {
      const { 
        code, 
        name, 
        description, 
        account_type_id, 
        parent_account_id, 
        is_active, 
        allows_entries, 
        level, 
        balance_type 
      } = req.body;
      
      // Validar campos obligatorios
      if (!code || !name || !account_type_id || !level || !balance_type) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: code, name, account_type_id, level, balance_type'
        });
      }
      
      // Validar que el balance_type sea válido
      if (!['debit', 'credit'].includes(balance_type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de balance debe ser "debit" o "credit"'
        });
      }
      
      // Validar que la cuenta padre exista si se proporciona
      if (parent_account_id) {
        const parentAccount = await PucAccount.findById(parent_account_id);
        if (!parentAccount) {
          return res.status(400).json({
            success: false,
            message: `La cuenta padre con ID ${parent_account_id} no existe`
          });
        }
      }
      
      // Validar que el código sea único
      const existingAccount = await PucAccount.findByCode(code);
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una cuenta con el código ${code}`
        });
      }
      
      // Crear la cuenta PUC
      const newAccount = await PucAccount.create({
        code,
        name,
        description: description || null,
        account_type_id,
        parent_account_id: parent_account_id || null,
        is_active: is_active !== undefined ? is_active : true,
        allows_entries: allows_entries !== undefined ? allows_entries : false,
        level,
        balance_type,
        created_by: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: 'Cuenta PUC creada exitosamente',
        data: newAccount
      });
    } catch (error) {
      logger.error(`Error al crear cuenta PUC: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear cuenta PUC',
        error: error.message
      });
    }
  },

  /**
   * Actualizar una cuenta PUC existente
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        code, 
        name, 
        description, 
        account_type_id, 
        parent_account_id, 
        is_active, 
        allows_entries, 
        level, 
        balance_type 
      } = req.body;
      
      // Verificar que la cuenta existe
      const accountExists = await PucAccount.findById(id);
      if (!accountExists) {
        return res.status(404).json({
          success: false,
          message: `Cuenta PUC con ID ${id} no encontrada`
        });
      }
      
      // Validar campos obligatorios
      if (!code || !name || !account_type_id || !level || !balance_type) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: code, name, account_type_id, level, balance_type'
        });
      }
      
      // Validar que el balance_type sea válido
      if (!['debit', 'credit'].includes(balance_type)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de balance debe ser "debit" o "credit"'
        });
      }
      
      // Validar que la cuenta padre exista si se proporciona
      if (parent_account_id) {
        // Evitar ciclos en la jerarquía: una cuenta no puede ser padre de sí misma
        if (parseInt(parent_account_id) === parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Una cuenta no puede ser padre de sí misma'
          });
        }
        
        const parentAccount = await PucAccount.findById(parent_account_id);
        if (!parentAccount) {
          return res.status(400).json({
            success: false,
            message: `La cuenta padre con ID ${parent_account_id} no existe`
          });
        }
      }
      
      // Validar que el código sea único (si se está cambiando)
      if (code !== accountExists.code) {
        const existingAccount = await PucAccount.findByCode(code);
        if (existingAccount) {
          return res.status(400).json({
            success: false,
            message: `Ya existe una cuenta con el código ${code}`
          });
        }
      }
      
      // Actualizar la cuenta PUC
      const updated = await PucAccount.update(id, {
        code,
        name,
        description: description || null,
        account_type_id,
        parent_account_id: parent_account_id || null,
        is_active: is_active !== undefined ? is_active : true,
        allows_entries: allows_entries !== undefined ? allows_entries : false,
        level,
        balance_type,
        updated_by: req.user.id
      });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar la cuenta PUC'
        });
      }
      
      res.json({
        success: true,
        message: 'Cuenta PUC actualizada exitosamente',
        data: {
          id: parseInt(id),
          code,
          name,
          description: description || null,
          account_type_id,
          parent_account_id: parent_account_id || null,
          is_active: is_active !== undefined ? is_active : true,
          allows_entries: allows_entries !== undefined ? allows_entries : false,
          level,
          balance_type
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar cuenta PUC: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cuenta PUC',
        error: error.message
      });
    }
  },

  /**
   * Eliminar una cuenta PUC
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la cuenta existe
      const account = await PucAccount.findById(id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta PUC con ID ${id} no encontrada`
        });
      }
      
      // Eliminar la cuenta
      const deleted = await PucAccount.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar la cuenta PUC'
        });
      }
      
      res.json({
        success: true,
        message: 'Cuenta PUC eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar cuenta PUC: ${error.message}`);
      
      // Si el error es porque la cuenta tiene hijos
      if (error.message.includes('tiene cuentas hijas')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cuenta PUC',
        error: error.message
      });
    }
  }
};

module.exports = PucAccountController; 