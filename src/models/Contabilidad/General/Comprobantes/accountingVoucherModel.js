/**
 * Modelo para gestionar los comprobantes contables
 * @module models/Contabilidad/General/Comprobantes/accountingVoucherModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const JournalEntry = require('../Asientos_Contables/journalEntryModel');

/**
 * Clase para gestionar los comprobantes contables en el sistema
 */
class AccountingVoucher {
  /**
   * Obtener todos los comprobantes contables con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de comprobantes contables
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT av.*, 
               vt.name as voucher_type_name,
               dt.name as document_type_name,
               CONCAT(u1.full_name) as created_by_name,
               CONCAT(u2.full_name) as approved_by_name
        FROM accounting_vouchers av
        LEFT JOIN voucher_types vt ON av.voucher_type_id = vt.id
        LEFT JOIN document_types dt ON av.document_type_id = dt.id
        LEFT JOIN users u1 ON av.created_by = u1.id
        LEFT JOIN users u2 ON av.approved_by = u2.id
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Aplicar filtros
      if (filters.voucher_number) {
        query += ' AND av.voucher_number LIKE ?';
        queryParams.push(`%${filters.voucher_number}%`);
      }
      
      if (filters.voucher_type_id) {
        query += ' AND av.voucher_type_id = ?';
        queryParams.push(filters.voucher_type_id);
      }
      
      if (filters.status) {
        query += ' AND av.status = ?';
        queryParams.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND av.date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND av.date <= ?';
        queryParams.push(filters.end_date);
      }
      
      if (filters.document_type_id) {
        query += ' AND av.document_type_id = ?';
        queryParams.push(filters.document_type_id);
      }
      
      if (filters.document_number) {
        query += ' AND av.document_number LIKE ?';
        queryParams.push(`%${filters.document_number}%`);
      }
      
      if (filters.entity_type) {
        query += ' AND av.entity_type = ?';
        queryParams.push(filters.entity_type);
      }
      
      if (filters.entity_id) {
        query += ' AND av.entity_id = ?';
        queryParams.push(filters.entity_id);
      }
      
      // Aplicar ordenamiento
      query += ' ORDER BY av.date DESC, av.voucher_number DESC';
      
      // Aplicar paginación
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(filters.limit), parseInt(offset));
      }
      
      const [results] = await pool.query(query, queryParams);
      return results;
    } catch (error) {
      logger.error(`Error al obtener comprobantes contables: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Contar el total de comprobantes según filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<number>} Total de comprobantes
   */
  static async countAll(filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM accounting_vouchers av
        WHERE 1=1
      `;
      
      const queryParams = [];
      
      // Aplicar los mismos filtros que en findAll
      if (filters.voucher_number) {
        query += ' AND av.voucher_number LIKE ?';
        queryParams.push(`%${filters.voucher_number}%`);
      }
      
      if (filters.voucher_type_id) {
        query += ' AND av.voucher_type_id = ?';
        queryParams.push(filters.voucher_type_id);
      }
      
      if (filters.status) {
        query += ' AND av.status = ?';
        queryParams.push(filters.status);
      }
      
      if (filters.start_date) {
        query += ' AND av.date >= ?';
        queryParams.push(filters.start_date);
      }
      
      if (filters.end_date) {
        query += ' AND av.date <= ?';
        queryParams.push(filters.end_date);
      }
      
      if (filters.document_type_id) {
        query += ' AND av.document_type_id = ?';
        queryParams.push(filters.document_type_id);
      }
      
      if (filters.document_number) {
        query += ' AND av.document_number LIKE ?';
        queryParams.push(`%${filters.document_number}%`);
      }
      
      if (filters.entity_type) {
        query += ' AND av.entity_type = ?';
        queryParams.push(filters.entity_type);
      }
      
      if (filters.entity_id) {
        query += ' AND av.entity_id = ?';
        queryParams.push(filters.entity_id);
      }
      
      const [result] = await pool.query(query, queryParams);
      return result[0].total;
    } catch (error) {
      logger.error(`Error al contar comprobantes contables: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtener un comprobante contable por su ID
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Object>} Comprobante contable con sus detalles
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    
    try {
      // Obtener el encabezado del comprobante
      const [headerResult] = await connection.query(`
        SELECT av.*, 
               vt.name as voucher_type_name,
               dt.name as document_type_name,
               CONCAT(u1.full_name) as created_by_name,
               CONCAT(u2.full_name) as approved_by_name
        FROM accounting_vouchers av
        LEFT JOIN voucher_types vt ON av.voucher_type_id = vt.id
        LEFT JOIN document_types dt ON av.document_type_id = dt.id
        LEFT JOIN users u1 ON av.created_by = u1.id
        LEFT JOIN users u2 ON av.approved_by = u2.id
        WHERE av.id = ?
      `, [id]);
      
      if (!headerResult.length) {
        return null;
      }
      
      const voucher = headerResult[0];
      
      // Obtener las líneas del comprobante
      const [linesResult] = await connection.query(`
        SELECT vl.*, coa.name as account_name, coa.code as account_code
        FROM voucher_lines vl
        LEFT JOIN chart_of_accounts coa ON vl.account_id = coa.id
        WHERE vl.voucher_id = ?
        ORDER BY vl.line_number ASC
      `, [id]);
      
      voucher.lines = linesResult;
      
      // Obtener el asiento contable asociado si existe
      if (voucher.journal_entry_id) {
        const [journalEntryResult] = await connection.query(`
          SELECT je.*, COUNT(jel.id) as line_count
          FROM journal_entries je
          LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
          WHERE je.id = ?
          GROUP BY je.id
        `, [voucher.journal_entry_id]);
        
        if (journalEntryResult.length > 0) {
          voucher.journal_entry = journalEntryResult[0];
        }
      }
      
      return voucher;
    } catch (error) {
      logger.error(`Error al obtener comprobante contable por ID: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener un comprobante contable por su número
   * @param {string} voucherNumber - Número del comprobante
   * @returns {Promise<Object>} Comprobante contable con sus detalles
   */
  static async findByNumber(voucherNumber) {
    try {
      const [result] = await pool.query(
        'SELECT id FROM accounting_vouchers WHERE voucher_number = ?',
        [voucherNumber]
      );
      
      if (!result.length) {
        return null;
      }
      
      return await this.findById(result[0].id);
    } catch (error) {
      logger.error(`Error al obtener comprobante contable por número: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Crear un nuevo comprobante contable
   * @param {Object} voucherData - Datos del comprobante
   * @param {Array} linesData - Líneas del comprobante
   * @param {number} userId - ID del usuario que crea el comprobante
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create(voucherData, linesData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Generar número de comprobante si no se proporciona
      if (!voucherData.voucher_number) {
        // Aquí debería implementarse la lógica para generar el número de comprobante
        // Por ahora, se usa un formato simple basado en la fecha y un contador
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Obtener el último número utilizado para el año/mes actual
        const [lastVoucher] = await connection.query(
          'SELECT MAX(SUBSTRING_INDEX(voucher_number, "-", -1)) as last_num FROM accounting_vouchers WHERE voucher_number LIKE ?',
          [`CV${year}${month}-%`]
        );
        
        const lastNum = lastVoucher[0].last_num ? parseInt(lastVoucher[0].last_num) : 0;
        const newNum = lastNum + 1;
        
        voucherData.voucher_number = `CV${year}${month}-${String(newNum).padStart(4, '0')}`;
      }
      
      // Insertar el encabezado del comprobante
      const [headerResult] = await connection.query(
        `INSERT INTO accounting_vouchers (
          voucher_type_id, voucher_number, date, description, reference,
          document_type_id, document_id, document_number, total_amount,
          currency_id, exchange_rate, fiscal_period_id, status,
          entity_type, entity_id, entity_name, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          voucherData.voucher_type_id,
          voucherData.voucher_number,
          voucherData.date,
          voucherData.description || null,
          voucherData.reference || null,
          voucherData.document_type_id || null,
          voucherData.document_id || null,
          voucherData.document_number || null,
          voucherData.total_amount || 0,
          voucherData.currency_id,
          voucherData.exchange_rate || 1,
          voucherData.fiscal_period_id,
          voucherData.status || 'draft',
          voucherData.entity_type || null,
          voucherData.entity_id || null,
          voucherData.entity_name || null,
          userId
        ]
      );
      
      const voucherId = headerResult.insertId;
      
      // Insertar las líneas del comprobante
      for (let i = 0; i < linesData.length; i++) {
        const line = linesData[i];
        
        await connection.query(
          `INSERT INTO voucher_lines (
            voucher_id, line_number, account_id, description,
            debit_amount, credit_amount, reference
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            voucherId,
            i + 1,
            line.account_id,
            line.description || null,
            line.debit_amount || 0,
            line.credit_amount || 0,
            line.reference || null
          ]
        );
      }
      
      await connection.commit();
      
      // Devolver el comprobante creado con su ID asignado
      return {
        id: voucherId,
        voucher_number: voucherData.voucher_number,
        ...voucherData,
        lines: linesData.map((line, index) => ({
          ...line,
          voucher_id: voucherId,
          line_number: index + 1
        }))
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear comprobante contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Actualizar un comprobante contable existente
   * @param {number} id - ID del comprobante
   * @param {Object} voucherData - Datos del comprobante a actualizar
   * @param {Array} linesData - Líneas actualizadas del comprobante
   * @param {number} userId - ID del usuario que actualiza el comprobante
   * @returns {Promise<boolean>} Resultado de la actualización
   */
  static async update(id, voucherData, linesData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el comprobante existe y su estado
      const [voucherCheck] = await connection.query(
        'SELECT status, journal_entry_id FROM accounting_vouchers WHERE id = ?',
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`Comprobante contable con ID ${id} no encontrado`);
      }
      
      if (voucherCheck[0].status !== 'draft') {
        throw new Error('Solo se pueden modificar comprobantes en estado borrador');
      }
      
      if (voucherCheck[0].journal_entry_id) {
        throw new Error('No se puede modificar un comprobante que ya tiene un asiento contable asociado');
      }
      
      // Actualizar el encabezado del comprobante
      await connection.query(
        `UPDATE accounting_vouchers SET
          date = ?,
          description = ?,
          reference = ?,
          document_type_id = ?,
          document_id = ?,
          document_number = ?,
          total_amount = ?,
          currency_id = ?,
          exchange_rate = ?,
          fiscal_period_id = ?,
          entity_type = ?,
          entity_id = ?,
          entity_name = ?,
          updated_at = NOW(),
          updated_by = ?
        WHERE id = ?`,
        [
          voucherData.date,
          voucherData.description || null,
          voucherData.reference || null,
          voucherData.document_type_id || null,
          voucherData.document_id || null,
          voucherData.document_number || null,
          voucherData.total_amount || 0,
          voucherData.currency_id,
          voucherData.exchange_rate || 1,
          voucherData.fiscal_period_id,
          voucherData.entity_type || null,
          voucherData.entity_id || null,
          voucherData.entity_name || null,
          userId,
          id
        ]
      );
      
      // Eliminar las líneas actuales
      await connection.query(
        'DELETE FROM voucher_lines WHERE voucher_id = ?',
        [id]
      );
      
      // Insertar las nuevas líneas
      for (let i = 0; i < linesData.length; i++) {
        const line = linesData[i];
        
        await connection.query(
          `INSERT INTO voucher_lines (
            voucher_id, line_number, account_id, description,
            debit_amount, credit_amount, reference
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            i + 1,
            line.account_id,
            line.description || null,
            line.debit_amount || 0,
            line.credit_amount || 0,
            line.reference || null
          ]
        );
      }
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar comprobante contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Aprobar y contabilizar un comprobante
   * @param {number} id - ID del comprobante
   * @param {number} userId - ID del usuario que aprueba el comprobante
   * @returns {Promise<Object>} Resultado de la operación con el ID del asiento generado
   */
  static async approve(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el comprobante existe y su estado
      const [voucherCheck] = await connection.query(
        `SELECT av.*, vt.name as voucher_type_name 
         FROM accounting_vouchers av
         JOIN voucher_types vt ON av.voucher_type_id = vt.id
         WHERE av.id = ?`,
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`Comprobante contable con ID ${id} no encontrado`);
      }
      
      const voucher = voucherCheck[0];
      
      if (voucher.status !== 'draft') {
        throw new Error('Solo se pueden aprobar comprobantes en estado borrador');
      }
      
      if (voucher.journal_entry_id) {
        throw new Error('Este comprobante ya tiene un asiento contable asociado');
      }
      
      // Obtener las líneas del comprobante
      const [lines] = await connection.query(
        `SELECT vl.*, coa.code as account_code, coa.name as account_name 
         FROM voucher_lines vl
         JOIN chart_of_accounts coa ON vl.account_id = coa.id
         WHERE vl.voucher_id = ?
         ORDER BY vl.line_number ASC`,
        [id]
      );
      
      if (lines.length === 0) {
        throw new Error('No se puede aprobar un comprobante sin líneas');
      }
      
      // Verificar cuadre del comprobante
      let totalDebit = 0;
      let totalCredit = 0;
      
      lines.forEach(line => {
        totalDebit += parseFloat(line.debit_amount || 0);
        totalCredit += parseFloat(line.credit_amount || 0);
      });
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('El comprobante no está cuadrado. El total de débitos debe ser igual al total de créditos.');
      }
      
      // Crear datos para el asiento contable
      const entryData = {
        entry_number: null, // Se generará automáticamente
        date: voucher.date,
        fiscal_period_id: voucher.fiscal_period_id,
        reference: voucher.reference,
        description: `Asiento generado automáticamente desde comprobante ${voucher.voucher_type_name} ${voucher.voucher_number}`,
        status: 'draft',
        is_adjustment: false,
        is_recurring: false,
        source_document_type: 'accounting_voucher',
        source_document_id: id
      };
      
      // Convertir líneas del comprobante a líneas del asiento
      const journalLines = lines.map(line => ({
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount
      }));
      
      // Crear el asiento contable
      const journalEntry = await JournalEntry.create(entryData, journalLines, userId);
      
      // Actualizar el comprobante con el ID del asiento
      await connection.query(
        `UPDATE accounting_vouchers SET
          journal_entry_id = ?,
          status = 'posted',
          approved_at = NOW(),
          approved_by = ?
        WHERE id = ?`,
        [journalEntry.id, userId, id]
      );
      
      // Contabilizar el asiento generado
      await JournalEntry.post(journalEntry.id, userId);
      
      await connection.commit();
      
      return {
        voucher_id: id,
        journal_entry_id: journalEntry.id,
        journal_entry_number: journalEntry.entry_number
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al aprobar comprobante contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Anular un comprobante contable
   * @param {number} id - ID del comprobante
   * @param {string} reason - Motivo de la anulación
   * @param {number} userId - ID del usuario que anula el comprobante
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async cancel(id, reason, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si el comprobante existe y su estado
      const [voucherCheck] = await connection.query(
        'SELECT status, journal_entry_id FROM accounting_vouchers WHERE id = ?',
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`Comprobante contable con ID ${id} no encontrado`);
      }
      
      if (voucherCheck[0].status === 'cancelled') {
        throw new Error('El comprobante ya ha sido anulado previamente');
      }
      
      // Si el comprobante tiene un asiento contable asociado, revertirlo
      if (voucherCheck[0].status === 'posted' && voucherCheck[0].journal_entry_id) {
        const reversalResult = await JournalEntry.reverse(
          voucherCheck[0].journal_entry_id,
          userId,
          `Reversión automática por anulación del comprobante ${id}: ${reason}`
        );
        
        // Actualizar el comprobante con el ID del asiento de reversión
        await connection.query(
          `UPDATE accounting_vouchers SET
            status = 'cancelled',
            cancellation_reason = ?,
            cancelled_at = NOW(),
            cancelled_by = ?,
            reversal_journal_entry_id = ?
          WHERE id = ?`,
          [reason, userId, reversalResult.reversal_id, id]
        );
      } else {
        // Si no tiene asiento, simplemente anular el comprobante
        await connection.query(
          `UPDATE accounting_vouchers SET
            status = 'cancelled',
            cancellation_reason = ?,
            cancelled_at = NOW(),
            cancelled_by = ?
          WHERE id = ?`,
          [reason, userId, id]
        );
      }
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al anular comprobante contable: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AccountingVoucher; 