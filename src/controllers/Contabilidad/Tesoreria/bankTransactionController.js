/**
 * Controlador para gestionar los movimientos bancarios
 * @module controllers/Contabilidad/Tesoreria/bankTransactionController
 */

const BankTransaction = require('../../../models/Contabilidad/Tesoreria/bankTransactionModel');
const logger = require('../../../utils/logger');

/**
 * Clase de controlador para gestionar movimientos bancarios
 */
class BankTransactionController {
  /**
   * Obtener todos los movimientos bancarios con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const transactions = await BankTransaction.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length,
        message: 'Movimientos bancarios obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos bancarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener movimientos bancarios',
        error: error.message
      });
    }
  }

  /**
   * Obtener un movimiento bancario por ID
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
          message: 'ID de movimiento bancario inválido'
        });
      }
      
      const transaction = await BankTransaction.getById(id);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: `Movimiento bancario con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Movimiento bancario obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener movimiento bancario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener movimiento bancario',
        error: error.message
      });
    }
  }

  /**
   * Obtener movimientos bancarios por cuenta bancaria
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getByBankAccount(req, res) {
    try {
      const { accountId } = req.params;
      const filters = req.query;
      
      // Validar que el ID sea un número válido
      if (!accountId || isNaN(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      const transactions = await BankTransaction.getByBankAccount(accountId, filters);
      
      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length,
        message: 'Movimientos de la cuenta bancaria obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos de cuenta ${req.params.accountId}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener movimientos de la cuenta bancaria',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo movimiento bancario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const transactionData = {
        ...req.body,
        created_by: req.user.id // Se obtiene del middleware de autenticación
      };
      
      // Validar datos requeridos
      const requiredFields = ['bank_account_id', 'transaction_type', 'date', 'amount'];
      const missingFields = requiredFields.filter(field => !transactionData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
        });
      }
      
      // Validar tipos de transacción permitidos
      const validTypes = ['deposit', 'withdrawal', 'transfer', 'payment', 'receipt'];
      if (!validTypes.includes(transactionData.transaction_type)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de transacción inválido. Tipos permitidos: ${validTypes.join(', ')}`
        });
      }
      
      // Validar monto (debe ser positivo)
      if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser un número positivo mayor a cero'
        });
      }
      
      // Validar fecha (no puede ser futura)
      const transactionDate = new Date(transactionData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final del día actual
      
      if (transactionDate > today) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de la transacción no puede ser futura'
        });
      }
      
      // Validar estado si se proporciona
      if (transactionData.status) {
        const validStatuses = ['pending', 'cleared', 'bounced', 'voided'];
        if (!validStatuses.includes(transactionData.status)) {
          return res.status(400).json({
            success: false,
            message: `Estado inválido. Estados permitidos: ${validStatuses.join(', ')}`
          });
        }
      }
      
      // Validar IDs numéricos
      if (isNaN(transactionData.bank_account_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID de cuenta bancaria debe ser un número válido'
        });
      }
      
      if (transactionData.third_party_id && isNaN(transactionData.third_party_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del tercero debe ser un número válido'
        });
      }
      
      const newTransaction = await BankTransaction.create(transactionData);
      
      res.status(201).json({
        success: true,
        data: newTransaction,
        message: 'Movimiento bancario creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear movimiento bancario: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('cuenta bancaria') || error.message.includes('inactiva')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Fondos insuficientes')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('tercero')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear movimiento bancario',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un movimiento bancario existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const transactionData = {
        ...req.body,
        updated_by: req.user.id
      };
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento bancario inválido'
        });
      }
      
      // Validar tipo de transacción si se está actualizando
      if (transactionData.transaction_type) {
        const validTypes = ['deposit', 'withdrawal', 'transfer', 'payment', 'receipt'];
        if (!validTypes.includes(transactionData.transaction_type)) {
          return res.status(400).json({
            success: false,
            message: `Tipo de transacción inválido. Tipos permitidos: ${validTypes.join(', ')}`
          });
        }
      }
      
      // Validar monto si se está actualizando
      if (transactionData.amount !== undefined) {
        if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'El monto debe ser un número positivo mayor a cero'
          });
        }
      }
      
      // Validar fecha si se está actualizando
      if (transactionData.date) {
        const transactionDate = new Date(transactionData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (transactionDate > today) {
          return res.status(400).json({
            success: false,
            message: 'La fecha de la transacción no puede ser futura'
          });
        }
      }
      
      // Validar tercero si se está actualizando
      if (transactionData.third_party_id && isNaN(transactionData.third_party_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID del tercero debe ser un número válido'
        });
      }
      
      const updatedTransaction = await BankTransaction.update(id, transactionData);
      
      res.status(200).json({
        success: true,
        data: updatedTransaction,
        message: 'Movimiento bancario actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar movimiento bancario ${req.params.id}: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('estado pendiente')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar movimiento bancario',
        error: error.message
      });
    }
  }

  /**
   * Confirmar un movimiento bancario (cambiar estado a 'cleared')
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async confirm(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento bancario inválido'
        });
      }
      
      const result = await BankTransaction.confirm(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Movimiento bancario confirmado correctamente'
      });
    } catch (error) {
      logger.error(`Error al confirmar movimiento bancario ${req.params.id}: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('estado pendiente') || error.message.includes('Fondos insuficientes')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al confirmar movimiento bancario',
        error: error.message
      });
    }
  }

  /**
   * Anular un movimiento bancario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async void(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento bancario inválido'
        });
      }
      
      // Validar que se proporcione una razón
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar una razón válida para la anulación (mínimo 5 caracteres)'
        });
      }
      
      const result = await BankTransaction.void(id, req.user.id, reason.trim());
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Movimiento bancario anulado correctamente'
      });
    } catch (error) {
      logger.error(`Error al anular movimiento bancario ${req.params.id}: ${error.message}`);
      
      // Manejo específico de errores conocidos
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya está anulada')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al anular movimiento bancario',
        error: error.message
      });
    }
  }

  /**
   * Buscar movimientos bancarios por texto
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async search(req, res) {
    try {
      const { q, bank_account_id } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }
      
      // Validar bank_account_id si se proporciona
      if (bank_account_id && isNaN(bank_account_id)) {
        return res.status(400).json({
          success: false,
          message: 'El ID de cuenta bancaria debe ser un número válido'
        });
      }
      
      const results = await BankTransaction.search(q.trim(), bank_account_id || null);
      
      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
        message: 'Búsqueda completada correctamente'
      });
    } catch (error) {
      logger.error(`Error al buscar movimientos bancarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al buscar movimientos bancarios',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de movimientos por período
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getSummaryByPeriod(req, res) {
    try {
      const { accountId } = req.params;
      const { date_from, date_to } = req.query;
      
      // Validar que el ID de cuenta sea válido
      if (!accountId || isNaN(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }
      
      // Validar fechas requeridas
      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas'
        });
      }
      
      // Validar formato de fechas
      if (isNaN(Date.parse(date_from)) || isNaN(Date.parse(date_to))) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido'
        });
      }
      
      // Validar que la fecha de inicio sea menor o igual a la fecha fin
      if (new Date(date_from) > new Date(date_to)) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser menor o igual a la fecha fin'
        });
      }
      
      const summary = await BankTransaction.getSummaryByPeriod(accountId, date_from, date_to);
      
      res.status(200).json({
        success: true,
        data: {
          ...summary,
          period: {
            from: date_from,
            to: date_to
          },
          account_id: accountId
        },
        message: 'Resumen de movimientos obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener resumen de movimientos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de movimientos',
        error: error.message
      });
    }
  }

  /**
   * Cambiar estado de un movimiento bancario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      // Validar que el ID sea un número válido
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de movimiento bancario inválido'
        });
      }
      
      // Validar estado
      const validStatuses = ['pending', 'cleared', 'bounced', 'voided'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Estados permitidos: ${validStatuses.join(', ')}`
        });
      }
      
      let result;
      
      switch (status) {
        case 'cleared':
          result = await BankTransaction.confirm(id, req.user.id);
          break;
        case 'voided':
          if (!reason) {
            return res.status(400).json({
              success: false,
              message: 'La razón es requerida para anular una transacción'
            });
          }
          result = await BankTransaction.void(id, req.user.id, reason);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Cambio de estado no implementado para este estado'
          });
      }
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Estado del movimiento bancario cambiado a ${status} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del movimiento bancario ${req.params.id}: ${error.message}`);
      
      if (error.message.includes('no existe')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('estado') || error.message.includes('Fondos insuficientes')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del movimiento bancario',
        error: error.message
      });
    }
  }
}

module.exports = BankTransactionController; 