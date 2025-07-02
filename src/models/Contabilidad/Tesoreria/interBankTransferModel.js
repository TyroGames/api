/**
 * Modelo para gestionar las transferencias interbancarias
 * @module models/Contabilidad/Tesoreria/interBankTransferModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const BankTransaction = require('./bankTransactionModel');

/**
 * Clase para gestionar las transferencias interbancarias en el sistema de tesorería
 */
class InterBankTransfer {
  /**
   * Obtener todas las transferencias interbancarias con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de transferencias interbancarias
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT ibt.*, 
               ba_from.account_number as from_account_number,
               ba_from.name as from_account_name,
               ba_from.bank_name as from_bank_name,
               ba_to.account_number as to_account_number, 
               ba_to.name as to_account_name,
               ba_to.bank_name as to_bank_name,
               c.symbol as currency_symbol,
               u.username as created_by_name,
               bt_from.id as from_transaction_exists,
               bt_to.id as to_transaction_exists
        FROM inter_bank_transfers ibt
        LEFT JOIN bank_accounts ba_from ON ibt.from_bank_account_id = ba_from.id
        LEFT JOIN bank_accounts ba_to ON ibt.to_bank_account_id = ba_to.id
        LEFT JOIN currencies c ON ba_from.currency_id = c.id
        LEFT JOIN users u ON ibt.created_by = u.id
        LEFT JOIN bank_transactions bt_from ON ibt.from_transaction_id = bt_from.id
        LEFT JOIN bank_transactions bt_to ON ibt.to_transaction_id = bt_to.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.from_bank_account_id) {
        conditions.push("ibt.from_bank_account_id = ?");
        queryParams.push(filters.from_bank_account_id);
      }

      if (filters.to_bank_account_id) {
        conditions.push("ibt.to_bank_account_id = ?");
        queryParams.push(filters.to_bank_account_id);
      }

      if (filters.status) {
        conditions.push("ibt.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.date_from) {
        conditions.push("ibt.transfer_date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("ibt.transfer_date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.amount_min) {
        conditions.push("ibt.amount >= ?");
        queryParams.push(filters.amount_min);
      }

      if (filters.amount_max) {
        conditions.push("ibt.amount <= ?");
        queryParams.push(filters.amount_max);
      }

      if (filters.transfer_number) {
        conditions.push("ibt.transfer_number LIKE ?");
        queryParams.push(`%${filters.transfer_number}%`);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY ibt.transfer_date DESC, ibt.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener transferencias interbancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una transferencia interbancaria por ID
   * @param {number} id - ID de la transferencia interbancaria
   * @returns {Promise<Object>} Transferencia interbancaria con detalles
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT ibt.*, 
                ba_from.account_number as from_account_number,
                ba_from.name as from_account_name,
                ba_from.bank_name as from_bank_name,
                ba_from.current_balance as from_current_balance,
                ba_to.account_number as to_account_number, 
                ba_to.name as to_account_name,
                ba_to.bank_name as to_bank_name,
                ba_to.current_balance as to_current_balance,
                c_from.name as from_currency_name, c_from.symbol as from_currency_symbol,
                c_to.name as to_currency_name, c_to.symbol as to_currency_symbol,
                u.username as created_by_name,
                bt_from.reference_number as from_transaction_reference,
                bt_to.reference_number as to_transaction_reference,
                je.entry_number as journal_entry_number
         FROM inter_bank_transfers ibt
         LEFT JOIN bank_accounts ba_from ON ibt.from_bank_account_id = ba_from.id
         LEFT JOIN bank_accounts ba_to ON ibt.to_bank_account_id = ba_to.id
         LEFT JOIN currencies c_from ON ba_from.currency_id = c_from.id
         LEFT JOIN currencies c_to ON ba_to.currency_id = c_to.id
         LEFT JOIN users u ON ibt.created_by = u.id
         LEFT JOIN bank_transactions bt_from ON ibt.from_transaction_id = bt_from.id
         LEFT JOIN bank_transactions bt_to ON ibt.to_transaction_id = bt_to.id
         LEFT JOIN journal_entries je ON ibt.journal_entry_id = je.id
         WHERE ibt.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener transferencia interbancaria con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva transferencia interbancaria
   * @param {Object} transferData - Datos de la transferencia interbancaria
   * @returns {Promise<Object>} Transferencia interbancaria creada
   */
  static async create(transferData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que las cuentas bancarias existan y estén activas
      const [fromAccount] = await connection.query(
        `SELECT id, name, current_balance, currency_id, is_active FROM bank_accounts WHERE id = ?`,
        [transferData.from_bank_account_id]
      );

      const [toAccount] = await connection.query(
        `SELECT id, name, current_balance, currency_id, is_active FROM bank_accounts WHERE id = ?`,
        [transferData.to_bank_account_id]
      );

      if (!fromAccount.length) {
        throw new Error('La cuenta bancaria origen especificada no existe');
      }

      if (!toAccount.length) {
        throw new Error('La cuenta bancaria destino especificada no existe');
      }

      if (!fromAccount[0].is_active) {
        throw new Error('La cuenta bancaria origen no está activa');
      }

      if (!toAccount[0].is_active) {
        throw new Error('La cuenta bancaria destino no está activa');
      }

      if (fromAccount[0].id === toAccount[0].id) {
        throw new Error('La cuenta origen y destino no pueden ser la misma');
      }

      // Validar que la cuenta origen tenga fondos suficientes
      const totalAmount = parseFloat(transferData.amount) + parseFloat(transferData.fee_amount || 0);
      if (parseFloat(fromAccount[0].current_balance) < totalAmount) {
        throw new Error(`Fondos insuficientes. Saldo disponible: ${fromAccount[0].current_balance}, Requerido: ${totalAmount}`);
      }

      // Validar que las monedas sean compatibles (mismo tipo)
      if (fromAccount[0].currency_id !== toAccount[0].currency_id) {
        throw new Error('Las cuentas deben tener la misma moneda para transferencias interbancarias');
      }

      // Generar número de transferencia único
      const transferNumber = await this.generateTransferNumber(connection);

      // Insertar la transferencia interbancaria
      const [result] = await connection.query(
        `INSERT INTO inter_bank_transfers 
        (transfer_number, from_bank_account_id, to_bank_account_id, transfer_date, 
         amount, fee_amount, description, reference, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transferNumber,
          transferData.from_bank_account_id,
          transferData.to_bank_account_id,
          transferData.transfer_date,
          transferData.amount,
          transferData.fee_amount || 0.00,
          transferData.description || null,
          transferData.reference || null,
          'pending', // Siempre inicia como pendiente
          transferData.created_by
        ]
      );

      await connection.commit();
      
      return { 
        id: result.insertId, 
        transfer_number: transferNumber,
        status: 'pending',
        ...transferData 
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear transferencia interbancaria: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar una transferencia interbancaria (crear transacciones y actualizar saldos)
   * @param {number} id - ID de la transferencia
   * @param {number} userId - ID del usuario que procesa
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async process(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos de la transferencia
      const [transfer] = await connection.query(
        `SELECT ibt.*, ba_from.current_balance as from_balance, ba_to.current_balance as to_balance 
         FROM inter_bank_transfers ibt
         JOIN bank_accounts ba_from ON ibt.from_bank_account_id = ba_from.id
         JOIN bank_accounts ba_to ON ibt.to_bank_account_id = ba_to.id
         WHERE ibt.id = ?`,
        [id]
      );

      if (!transfer.length) {
        throw new Error(`La transferencia interbancaria con ID ${id} no existe`);
      }

      const transferData = transfer[0];

      if (transferData.status !== 'pending') {
        throw new Error(`La transferencia ya está en estado ${transferData.status} y no puede ser procesada`);
      }

      // Validar fondos suficientes nuevamente
      const totalAmount = parseFloat(transferData.amount) + parseFloat(transferData.fee_amount);
      if (parseFloat(transferData.from_balance) < totalAmount) {
        throw new Error(`Fondos insuficientes en cuenta origen. Disponible: ${transferData.from_balance}`);
      }

      // Crear transacción de débito en cuenta origen
      const fromTransactionData = {
        bank_account_id: transferData.from_bank_account_id,
        transaction_type: 'transfer',
        reference_number: `TRF-OUT-${transferData.transfer_number}`,
        date: transferData.transfer_date,
        description: `Transferencia saliente a cuenta ${transferData.to_bank_account_id}: ${transferData.description || 'Transferencia interbancaria'}`,
        amount: -(parseFloat(transferData.amount) + parseFloat(transferData.fee_amount)), // Negativo porque es salida
        document_type: 'inter_bank_transfer',
        document_id: id,
        status: 'cleared',
        auto_confirm: true,
        created_by: userId
      };

      const fromTransaction = await BankTransaction.create(fromTransactionData, connection);

      // Crear transacción de crédito en cuenta destino
      const toTransactionData = {
        bank_account_id: transferData.to_bank_account_id,
        transaction_type: 'transfer',
        reference_number: `TRF-IN-${transferData.transfer_number}`,
        date: transferData.transfer_date,
        description: `Transferencia recibida de cuenta ${transferData.from_bank_account_id}: ${transferData.description || 'Transferencia interbancaria'}`,
        amount: parseFloat(transferData.amount), // Positivo porque es entrada
        document_type: 'inter_bank_transfer',
        document_id: id,
        status: 'cleared',
        auto_confirm: true,
        created_by: userId
      };

      const toTransaction = await BankTransaction.create(toTransactionData, connection);

      // Actualizar transferencia con IDs de transacciones y cambiar estado
      await connection.query(
        `UPDATE inter_bank_transfers 
         SET status = 'completed', 
             from_transaction_id = ?, 
             to_transaction_id = ?, 
             completed_at = NOW()
         WHERE id = ?`,
        [fromTransaction.id, toTransaction.id, id]
      );

      await connection.commit();

      return {
        transfer_id: id,
        previous_status: 'pending',
        new_status: 'completed',
        from_transaction_id: fromTransaction.id,
        to_transaction_id: toTransaction.id,
        processed_by: userId,
        processed_at: new Date()
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al procesar transferencia interbancaria ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancelar una transferencia interbancaria
   * @param {number} id - ID de la transferencia
   * @param {number} userId - ID del usuario que cancela
   * @param {string} reason - Razón de la cancelación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async cancel(id, userId, reason = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos de la transferencia
      const [transfer] = await connection.query(
        `SELECT * FROM inter_bank_transfers WHERE id = ?`,
        [id]
      );

      if (!transfer.length) {
        throw new Error(`La transferencia interbancaria con ID ${id} no existe`);
      }

      const transferData = transfer[0];

      if (transferData.status === 'cancelled') {
        throw new Error('La transferencia ya está cancelada');
      }

      if (transferData.status === 'completed') {
        throw new Error('No se puede cancelar una transferencia completada');
      }

      // Si está en tránsito, revertir transacciones
      if (transferData.status === 'in_transit' && transferData.from_transaction_id) {
        // Cancelar transacción origen
        await connection.query(
          `UPDATE bank_transactions SET status = 'voided' WHERE id = ?`,
          [transferData.from_transaction_id]
        );

        if (transferData.to_transaction_id) {
          // Cancelar transacción destino
          await connection.query(
            `UPDATE bank_transactions SET status = 'voided' WHERE id = ?`,
            [transferData.to_transaction_id]
          );
        }

        // Revertir saldos
        const BankAccount = require('./bankAccountModel');
        const totalAmount = parseFloat(transferData.amount) + parseFloat(transferData.fee_amount);
        await BankAccount.updateBalance(transferData.from_bank_account_id, totalAmount, connection);
        await BankAccount.updateBalance(transferData.to_bank_account_id, -parseFloat(transferData.amount), connection);
      }

      // Actualizar estado de la transferencia
      await connection.query(
        `UPDATE inter_bank_transfers 
         SET status = 'cancelled'
         WHERE id = ?`,
        [id]
      );

      await connection.commit();

      return {
        transfer_id: id,
        previous_status: transferData.status,
        new_status: 'cancelled',
        cancelled_by: userId,
        cancelled_at: new Date(),
        reason: reason
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cancelar transferencia interbancaria ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener transferencias por cuenta bancaria
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Lista de transferencias
   */
  static async getByBankAccount(bankAccountId, filters = {}) {
    try {
      let query = `
        SELECT ibt.*, 
               CASE 
                 WHEN ibt.from_bank_account_id = ? THEN 'outgoing'
                 WHEN ibt.to_bank_account_id = ? THEN 'incoming'
                 ELSE 'unknown'
               END as direction,
               ba_other.account_number as other_account_number,
               ba_other.name as other_account_name,
               ba_other.bank_name as other_bank_name,
               u.username as created_by_name
        FROM inter_bank_transfers ibt
        LEFT JOIN bank_accounts ba_other ON 
          (ibt.from_bank_account_id = ? AND ba_other.id = ibt.to_bank_account_id) OR
          (ibt.to_bank_account_id = ? AND ba_other.id = ibt.from_bank_account_id)
        LEFT JOIN users u ON ibt.created_by = u.id
        WHERE ibt.from_bank_account_id = ? OR ibt.to_bank_account_id = ?
      `;

      const queryParams = [bankAccountId, bankAccountId, bankAccountId, bankAccountId, bankAccountId, bankAccountId];

      // Aplicar filtros adicionales
      if (filters.status) {
        query += " AND ibt.status = ?";
        queryParams.push(filters.status);
      }

      if (filters.direction) {
        if (filters.direction === 'outgoing') {
          query += " AND ibt.from_bank_account_id = ?";
          queryParams.push(bankAccountId);
        } else if (filters.direction === 'incoming') {
          query += " AND ibt.to_bank_account_id = ?";
          queryParams.push(bankAccountId);
        }
      }

      if (filters.date_from) {
        query += " AND ibt.transfer_date >= ?";
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        query += " AND ibt.transfer_date <= ?";
        queryParams.push(filters.date_to);
      }

      query += " ORDER BY ibt.transfer_date DESC, ibt.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener transferencias por cuenta bancaria ${bankAccountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar transferencias interbancarias por texto
   * @param {string} searchText - Texto a buscar
   * @returns {Promise<Array>} Lista de transferencias que coinciden
   */
  static async search(searchText) {
    try {
      const [rows] = await pool.query(
        `SELECT ibt.id, ibt.transfer_number, ibt.transfer_date, ibt.amount, 
                ibt.description, ibt.status,
                ba_from.account_number as from_account_number,
                ba_from.name as from_account_name,
                ba_to.account_number as to_account_number,
                ba_to.name as to_account_name
         FROM inter_bank_transfers ibt
         LEFT JOIN bank_accounts ba_from ON ibt.from_bank_account_id = ba_from.id
         LEFT JOIN bank_accounts ba_to ON ibt.to_bank_account_id = ba_to.id
         WHERE ibt.transfer_number LIKE ? 
         OR ibt.description LIKE ?
         OR ibt.reference LIKE ?
         OR ba_from.account_number LIKE ?
         OR ba_from.name LIKE ?
         OR ba_to.account_number LIKE ?
         OR ba_to.name LIKE ?
         ORDER BY ibt.transfer_date DESC
         LIMIT 20`,
        [`%${searchText}%`, `%${searchText}%`, `%${searchText}%`, 
         `%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al buscar transferencias interbancarias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener resumen de transferencias por período
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @param {number} bankAccountId - ID de cuenta bancaria (opcional)
   * @returns {Promise<Object>} Resumen de transferencias
   */
  static async getSummaryByPeriod(dateFrom, dateTo, bankAccountId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_transfers,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transfers,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_transfers,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transfers,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transfers,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_transfers,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount_completed,
          SUM(CASE WHEN status = 'completed' THEN fee_amount ELSE 0 END) as total_fees_completed,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount_completed
        FROM inter_bank_transfers
        WHERE transfer_date BETWEEN ? AND ?
      `;

      const queryParams = [dateFrom, dateTo];

      if (bankAccountId) {
        query += " AND (from_bank_account_id = ? OR to_bank_account_id = ?)";
        queryParams.push(bankAccountId, bankAccountId);
      }

      const [rows] = await pool.query(query, queryParams);
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener resumen de transferencias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar número de transferencia único
   * @param {Object} connection - Conexión de base de datos
   * @returns {Promise<string>} Número de transferencia generado
   */
  static async generateTransferNumber(connection) {
    try {
      // Obtener el último número usado
      const [result] = await connection.query(
        `SELECT transfer_number FROM inter_bank_transfers 
         WHERE transfer_number LIKE 'TRF-%' 
         ORDER BY id DESC LIMIT 1`
      );

      let nextNumber = 1;
      if (result.length > 0) {
        const lastNumber = result[0].transfer_number;
        const numberPart = parseInt(lastNumber.split('-')[1]);
        nextNumber = numberPart + 1;
      }

      return `TRF-${String(nextNumber).padStart(6, '0')}`;
    } catch (error) {
      logger.error(`Error al generar número de transferencia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener transferencias pendientes que requieren atención
   * @param {number} daysThreshold - Días de antigüedad para considerar crítico
   * @returns {Promise<Array>} Lista de transferencias pendientes críticas
   */
  static async getPendingCritical(daysThreshold = 2) {
    try {
      const [rows] = await pool.query(
        `SELECT ibt.*, 
                ba_from.account_number as from_account_number,
                ba_from.name as from_account_name,
                ba_to.account_number as to_account_number,
                ba_to.name as to_account_name,
                DATEDIFF(CURDATE(), ibt.transfer_date) as days_pending
         FROM inter_bank_transfers ibt
         LEFT JOIN bank_accounts ba_from ON ibt.from_bank_account_id = ba_from.id
         LEFT JOIN bank_accounts ba_to ON ibt.to_bank_account_id = ba_to.id
         WHERE ibt.status IN ('pending', 'in_transit') 
         AND DATEDIFF(CURDATE(), ibt.transfer_date) >= ?
         ORDER BY ibt.transfer_date ASC`,
        [daysThreshold]
      );

      return rows;
    } catch (error) {
      logger.error(`Error al obtener transferencias críticas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = InterBankTransfer;