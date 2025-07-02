/**
 * Controlador para gestionar las cuentas bancarias
 * @module controllers/Contabilidad/Tesoreria/bankAccountController
 */

const BankAccount = require('../../../models/Contabilidad/Tesoreria/bankAccountModel');
const BankAccountReportsService = require('../../../services/Contabilidad/Tesoreria/bankAccountReportsService');
const logger = require('../../../utils/logger');

/**
 * Clase de controlador para gestionar cuentas bancarias
 */
class BankAccountController {
  /**
   * Obtener todas las cuentas bancarias con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const accounts = await BankAccount.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: accounts,
        count: accounts.length,
        message: 'Cuentas bancarias obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener cuentas bancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuentas bancarias',
        error: error.message
      });
    }
  }

  /**
   * Obtener una cuenta bancaria por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      const account = await BankAccount.getById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta bancaria con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: account,
        message: 'Cuenta bancaria obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta bancaria ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Obtener una cuenta bancaria por número de cuenta
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByAccountNumber(req, res) {
    try {
      const { accountNumber } = req.params;
      
      if (!accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Número de cuenta es requerido'
        });
      }
      
      const account = await BankAccount.getByAccountNumber(accountNumber);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Cuenta bancaria con número ${accountNumber} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: account,
        message: 'Cuenta bancaria obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener cuenta bancaria por número ${req.params.accountNumber}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const accountData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      const requiredFields = ['account_number', 'name', 'bank_name', 'account_type', 'currency_id', 'gl_account_id'];
      const missingFields = requiredFields.filter(field => !accountData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
        });
      }
      
      // Validar número de cuenta (solo alfanumérico y guiones)
      if (!/^[A-Za-z0-9\-]{1,50}$/.test(accountData.account_number)) {
        return res.status(400).json({
          success: false,
          message: 'El número de cuenta debe contener solo letras, números y guiones (máximo 50 caracteres)'
        });
      }
      
      // Validar tipos de cuenta permitidos
      const validAccountTypes = ['savings', 'checking', 'credit', 'investment', 'other'];
      if (!validAccountTypes.includes(accountData.account_type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de cuenta inválido. Tipos permitidos: ${validAccountTypes.join(', ')}`
        });
      }
      
      // Validar saldo inicial (debe ser positivo o cero)
      if (accountData.initial_balance && accountData.initial_balance < 0) {
        return res.status(400).json({
          success: false,
          message: 'El saldo inicial no puede ser negativo'
        });
      }
      
      // Validar IDs numericos
      if (isNaN(accountData.currency_id) || isNaN(accountData.gl_account_id)) {
        return res.status(400).json({
          success: false,
          message: 'Los IDs de moneda y cuenta contable deben ser números válidos'
        });
      }
      
      const newAccount = await BankAccount.create(accountData);
      
      res.status(201).json({
        success: true,
        data: newAccount,
        message: 'Cuenta bancaria creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear cuenta bancaria: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('Ya existe una cuenta bancaria')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('cuenta contable') || error.message.includes('moneda')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una cuenta bancaria existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const accountData = {
        ...req.body,
        updated_by: req.user.id
      };
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      // Validar número de cuenta si se está actualizando
      if (accountData.account_number && !/^[A-Za-z0-9\-]{1,50}$/.test(accountData.account_number)) {
        return res.status(400).json({
          success: false,
          message: 'El número de cuenta debe contener solo letras, números y guiones (máximo 50 caracteres)'
        });
      }
      
      // Validar tipo de cuenta si se está actualizando
      if (accountData.account_type) {
        const validAccountTypes = ['savings', 'checking', 'credit', 'investment', 'other'];
        if (!validAccountTypes.includes(accountData.account_type)) {
          return res.status(400).json({
            success: false,
            message: `Tipo de cuenta inválido. Tipos permitidos: ${validAccountTypes.join(', ')}`
          });
        }
      }
      
      // Validar IDs numéricos si se están actualizando
      if (accountData.currency_id && isNaN(accountData.currency_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID de moneda debe ser un número válido'
        });
      }
      
      if (accountData.gl_account_id && isNaN(accountData.gl_account_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID de cuenta contable debe ser un número válido'
        });
      }
      
      const updatedAccount = await BankAccount.update(id, accountData);
      
      res.status(200).json({
        success: true,
        data: updatedAccount,
        message: 'Cuenta bancaria actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar cuenta bancaria ${req.params.id}: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Ya existe otra cuenta bancaria')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('cuenta contable') || error.message.includes('moneda')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Desactivar una cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      const result = await BankAccount.deactivate(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Cuenta bancaria desactivada correctamente'
      });
    } catch (error) {
      logger.error(`Error al desactivar cuenta bancaria ${req.params.id}: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya está desactivada') || error.message.includes('transacciones pendientes')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al desactivar cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Obtener el saldo actual de una cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getBalance(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      const balance = await BankAccount.getBalance(id);
      
      res.status(200).json({
        success: true,
        data: balance,
        message: 'Saldo de cuenta bancaria obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener saldo de cuenta bancaria ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener saldo de cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de cuentas bancarias
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getSummary(req, res) {
    try {
      const summary = await BankAccount.getSummary();
      
      res.status(200).json({
        success: true,
        data: summary,
        count: summary.length,
        message: 'Resumen de cuentas bancarias obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de cuentas bancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de cuentas bancarias',
        error: error.message
      });
    }
  }

  /**
   * Buscar cuentas bancarias por texto
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async search(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }
      
      const results = await BankAccount.search(q.trim());
      
      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        message: 'Búsqueda completada correctamente'
      });
    } catch (error) {
      logger.error(`Error al buscar cuentas bancarias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al buscar cuentas bancarias',
        error: error.message
      });
    }
  }

  /**
   * Activar una cuenta bancaria desactivada
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async activate(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      // Usar el método update para cambiar is_active a true
      const accountData = {
        is_active: true,
        updated_by: req.user.id
      };
      
      const result = await BankAccount.update(id, accountData);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Cuenta bancaria activada correctamente'
      });
    } catch (error) {
      logger.error(`Error al activar cuenta bancaria ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al activar cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Alternar estado activo/inactivo de una cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo is_active debe ser un valor booleano'
        });
      }
      
      if (is_active) {
        // Activar la cuenta
        const result = await BankAccount.update(id, { 
          is_active: true, 
          updated_by: req.user.id 
        });
        
        res.status(200).json({
          success: true,
          data: result,
          message: 'Cuenta bancaria activada correctamente'
        });
      } else {
        // Desactivar la cuenta
        const result = await BankAccount.deactivate(id);
        
        res.status(200).json({
          success: true,
          data: result,
          message: 'Cuenta bancaria desactivada correctamente'
        });
      }
    } catch (error) {
      logger.error(`Error al cambiar estado de cuenta bancaria ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('transacciones pendientes') || error.message.includes('ya está desactivada')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de cuenta bancaria',
        error: error.message
      });
    }
  }

  // ============================================================
  // MÉTODOS DE REPORTES
  // ============================================================

  /**
   * Generar reporte de saldos de cuentas bancarias
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateBalancesReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      const reportData = await BankAccountReportsService.generateBalancesReport(filters);
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDFBuffer(reportData.data, 'balances');

        // Configurar headers para descarga automática
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
        res.setHeader('Content-Length', pdfResult.buffer.length);
        
        // Enviar el PDF directamente
        res.send(pdfResult.buffer);
        
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de saldos generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de saldos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de saldos',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de movimientos bancarios
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateMovementsReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      const reportData = await BankAccountReportsService.generateMovementsReport(filters);
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'movements');
        
        res.status(200).json({
          success: true,
          message: 'Reporte PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de movimientos generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de movimientos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de movimientos',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de flujo de caja
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateCashFlowReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      const reportData = await BankAccountReportsService.generateCashFlowReport(filters);
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'cash-flow');
        
        res.status(200).json({
          success: true,
          message: 'Reporte PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de flujo de caja generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de flujo de caja: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de flujo de caja',
        error: error.message
      });
    }
  }

  /**
   * Generar estado de cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateAccountStatement(req, res) {
    try {
      const { id } = req.params;
      const { format = 'json', ...filters } = req.query;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      const reportData = await BankAccountReportsService.generateAccountStatement(id, filters);
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'account-statement');
        
        res.status(200).json({
          success: true,
          message: 'Estado de cuenta PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Estado de cuenta generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar estado de cuenta: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar estado de cuenta',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte consolidado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateConsolidatedReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      const reportData = await BankAccountReportsService.generateConsolidatedReport(filters);
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'consolidated');
        
        res.status(200).json({
          success: true,
          message: 'Reporte consolidado PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte consolidado generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte consolidado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte consolidado',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de análisis por moneda
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateCurrencyAnalysisReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      // Reusar el reporte consolidado para análisis por moneda
      const reportData = await BankAccountReportsService.generateConsolidatedReport(filters);
      
      if (format === 'pdf') {
        // Usar el nuevo método que no guarda archivo
        const pdfResult = await BankAccountReportsService.generatePDFBuffer(reportData.data, 'currency-analysis');
        
        // Configurar headers para descarga automática
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
        res.setHeader('Content-Length', pdfResult.buffer.length);
        
        // Enviar el PDF directamente
        res.send(pdfResult.buffer);
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de análisis por moneda generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de análisis por moneda: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de análisis por moneda',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de transferencias interbancarias
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateTransfersReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      // Implementar consulta específica para transferencias
      // Por ahora devolver estructura básica
      const reportData = {
        success: true,
        data: {
          transfers: [],
          summary: {
            total_transfers: 0,
            total_amount: 0
          },
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'transfers');
        
        res.status(200).json({
          success: true,
          message: 'Reporte de transferencias PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de transferencias generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de transferencias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de transferencias',
        error: error.message
      });
    }
  }

  /**
   * Generar reporte de conciliaciones bancarias
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateReconciliationsReport(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      
      // Implementar consulta específica para conciliaciones
      // Por ahora devolver estructura básica
      const reportData = {
        success: true,
        data: {
          reconciliations: [],
          summary: {
            total_reconciliations: 0,
            pending_reconciliations: 0,
            completed_reconciliations: 0
          },
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };
      
      if (format === 'pdf') {
        const pdfResult = await BankAccountReportsService.generatePDF(reportData.data, 'reconciliations');
        
        res.status(200).json({
          success: true,
          message: 'Reporte de conciliaciones PDF generado correctamente',
          pdf_url: pdfResult.url,
          data: reportData.data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Reporte de conciliaciones generado correctamente',
          ...reportData
        });
      }
    } catch (error) {
      logger.error(`Error al generar reporte de conciliaciones: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de conciliaciones',
        error: error.message
      });
    }
  }
}

module.exports = BankAccountController; 