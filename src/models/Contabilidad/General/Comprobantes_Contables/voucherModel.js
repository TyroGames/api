/**
 * Modelo para gestionar los comprobantes contables
 * @module models/Contabilidad/General/Comprobantes_Contables/voucherModel
 */

const { log } = require('winston');
const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const BankTransactionIntegration = require('../../Tesoreria/bankTransactionIntegrationModel');

/**
 * Clase para gestionar los comprobantes contables en el sistema
 */
class Voucher {
  /**
   * Obtener todos los comprobantes contables con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de comprobantes contables
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT v.*, vt.name as type_name, u.username as created_by_name, 
               fp.start_date as period_start, fp.end_date as period_end,
               t.name as third_party_name, vt.code as type_code
        FROM accounting_vouchers v
        LEFT JOIN accounting_voucher_types vt ON v.voucher_type_id = vt.id
        LEFT JOIN users u ON v.created_by = u.id
        LEFT JOIN fiscal_periods fp ON v.fiscal_period_id = fp.id
        LEFT JOIN third_parties t ON v.third_party_id = t.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.consecutive) {
        conditions.push("v.consecutive LIKE ?");
        queryParams.push(`%${filters.consecutive}%`);
      }

      if (filters.voucher_type_id) {
        conditions.push("v.voucher_type_id = ?");
        queryParams.push(filters.voucher_type_id);
      }

      if (filters.date_from) {
        conditions.push("v.date >= ?");
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push("v.date <= ?");
        queryParams.push(filters.date_to);
      }

      if (filters.status) {
        conditions.push("v.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.fiscal_period_id) {
        conditions.push("v.fiscal_period_id = ?");
        queryParams.push(filters.fiscal_period_id);
      }

      if (filters.third_party_id) {
        conditions.push("v.third_party_id = ?");
        queryParams.push(filters.third_party_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY v.date DESC, v.consecutive DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener comprobantes contables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un comprobante contable por ID
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Object>} Comprobante contable
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT v.*, vt.name as type_name, u.username as created_by_name, 
                fp.start_date as period_start, fp.end_date as period_end,
                t.name as third_party_name, vt.code as type_code,
                c.name as company_name, o.name as office_name,
                o.company_id as company_id,
                o.id as office_id
         FROM accounting_vouchers v
         LEFT JOIN accounting_voucher_types vt ON v.voucher_type_id = vt.id
         LEFT JOIN users u ON v.created_by = u.id
         LEFT JOIN fiscal_periods fp ON v.fiscal_period_id = fp.id
         LEFT JOIN third_parties t ON v.third_party_id = t.id
         LEFT JOIN companies c ON v.company_id = c.id
         LEFT JOIN company_offices o ON v.office_id = o.id
         WHERE v.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener comprobante contable con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un comprobante contable por tipo y consecutivo
   * @param {string} tipo - Tipo de comprobante
   * @param {number} consecutivo - Consecutivo del comprobante
   * @returns {Promise<Object>} Comprobante contable
   */
  static async getByTipoConsecutivo(tipo, consecutivo) {
    try {
      const [rows] = await pool.query(
        `SELECT v.*, vt.name as type_name, u.username as created_by_name, 
                fp.start_date as period_start, fp.end_date as period_end,
                t.name as third_party_name
         FROM accounting_vouchers v
         LEFT JOIN accounting_voucher_types vt ON v.voucher_type_id = vt.id
         LEFT JOIN users u ON v.created_by = u.id
         LEFT JOIN fiscal_periods fp ON v.fiscal_period_id = fp.id
         LEFT JOIN third_parties t ON v.third_party_id = t.code
         WHERE v.voucher_type_id = ? AND v.consecutive = ?`,
        [tipo, consecutivo]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener comprobante contable tipo ${tipo} consecutivo ${consecutivo}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todos los tipos de comprobantes contables
   * @returns {Promise<Array>} Lista de tipos de comprobantes
   */
  static async getAllTypes() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM accounting_voucher_types ORDER BY name`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de comprobantes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generar consecutivo para un tipo de comprobante
   * @param {string} tipoComprobante - ID del tipo de comprobante
   * @param {Object} connection - Conexión de base de datos activa
   * @returns {Promise<number>} Consecutivo generado
   */
  static async generateConsecutivo(tipoComprobante, connection = null) {
    const conn = connection || await pool.getConnection();
    const shouldReleaseConnection = !connection;
    
    try {
      if (!connection) {
        await conn.beginTransaction();
      }
      
      // Obtener el tipo de comprobante para verificar el consecutivo actual
      const [tipoResult] = await conn.query(
        `SELECT * FROM accounting_voucher_types WHERE id = ? FOR UPDATE`,
        [tipoComprobante]
      );
      
      if (!tipoResult.length) {
        throw new Error(`El tipo de comprobante ${tipoComprobante} no existe`);
      }
      
      const tipo = tipoResult[0];
      const consecutivo = tipo.consecutive;
      
      // Actualizar el consecutivo incrementándolo en 1
      await conn.query(
        `UPDATE accounting_voucher_types SET consecutive = ? WHERE id = ?`,
        [consecutivo + 1, tipoComprobante]
      );
      
      if (!connection) {
        await conn.commit();
      }
      
      return consecutivo;
    } catch (error) {
      if (!connection) {
        await conn.rollback();
      }
      logger.error(`Error al generar consecutivo: ${error.message}`);
      throw error;
    } finally {
      if (shouldReleaseConnection) {
        conn.release();
      }
    }
  }

  /**
   * Crear un nuevo comprobante contable
   * @param {Object} voucherData - Datos del comprobante contable
   * @returns {Promise<Object>} Comprobante contable creado
   */
  static async create(voucherData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      logger.info(`Datos del comprobante: ${JSON.stringify(voucherData)}`);
      // Formatear entrada de datos
      voucherData.status = voucherData.status || 'DRAFT';
      
      // Generar consecutivo si no se proporciona
      if (!voucherData.consecutive) {
        voucherData.consecutive = await this.generateConsecutivo(voucherData.voucher_type_id, connection);
      }
      
      // Generar voucher_number si no se proporciona (prefijo + consecutivo)
      if (!voucherData.voucher_number && voucherData.consecutive) {
        const [tipoResult] = await connection.query(
          `SELECT code FROM accounting_voucher_types WHERE id = ?`,
          [voucherData.voucher_type_id]
        );
        
        if (tipoResult.length) {
          const prefijo = tipoResult[0].code;
          voucherData.voucher_number = `${prefijo}-${voucherData.consecutive.toString().padStart(6, '0')}`;
        }
      }
      
      // Insertar el comprobante
      const [result] = await connection.query(
        `INSERT INTO accounting_vouchers 
        (voucher_type_id, consecutive, voucher_number, date, company_id, office_id, fiscal_period_id, 
         third_party_id, concept, description, reference, document_type_id, 
         document_id, document_number, total_amount, total_debit, total_credit, 
         currency_id, exchange_rate, entity_type, entity_id, entity_name, 
         status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          voucherData.voucher_type_id,
          voucherData.consecutive,
          voucherData.voucher_number,
          voucherData.date,
          voucherData.company_id,
          voucherData.office_id,
          voucherData.fiscal_period_id,
          voucherData.third_party_id, 
          voucherData.concept,
          voucherData.description,
          voucherData.reference,
          voucherData.document_type_id || null,
          voucherData.document_id || null,
          voucherData.document_number || null,
          voucherData.total_amount || 0,
          voucherData.total_debit || 0,
          voucherData.total_credit || 0,
          voucherData.currency_id || null,
          voucherData.exchange_rate || 1,
          voucherData.entity_type || null,
          voucherData.entity_id || null,
          voucherData.entity_name || null,
          voucherData.status,
          voucherData.created_by
        ]
      );
      
      const voucherId = result.insertId;
      
      // Verificar si ya existen líneas para este comprobante (por si acaso) y eliminarlas
      await connection.query(
        `DELETE FROM voucher_lines WHERE voucher_id = ?`,
        [voucherId]
      );
      
      // Insertar líneas del comprobante
      if (voucherData.voucher_lines && Array.isArray(voucherData.voucher_lines)) {
        for (let i = 0; i < voucherData.voucher_lines.length; i++) {
          const line = voucherData.voucher_lines[i];
          const lineNumber = line.line_number || line.line_order || (i + 1);
          
          await connection.query(
            `INSERT INTO voucher_lines 
            (voucher_id, line_number, account_id, third_party_id, description, 
             debit_amount, credit_amount, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              voucherId,
              lineNumber,
              line.account_id,
              line.third_party_id || voucherData.third_party_id || null,
              line.description || '',
              line.debit_amount || 0,
              line.credit_amount || 0,
              line.reference || null
            ]
          );
        }
      }
      
      // Si hay asiento contable asociado, crear la relación
      if (voucherData.journal_entry_id) {
        await connection.query(
          `INSERT INTO accounting_voucher_journal_entries (voucher_id, journal_entry_id) 
           VALUES (?, ?)`,
          [voucherId, voucherData.journal_entry_id]
        );
      }
      
      await connection.commit();
      
      return { id: voucherId, ...voucherData };
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
   * @param {number} id - ID del comprobante contable
   * @param {Object} voucherData - Datos actualizados del comprobante
   * @returns {Promise<Object>} Comprobante contable actualizado
   */
  static async update(id, voucherData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el comprobante exista y esté en estado borrador
      const [voucherCheck] = await connection.query(
        `SELECT status FROM accounting_vouchers WHERE id = ?`,
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`El comprobante con ID ${id} no existe`);
      }
      
      if (voucherCheck[0].status !== 'DRAFT') {
        throw new Error('Solo se pueden modificar comprobantes en estado DRAFT');
      }
      
      // Actualizar el comprobante
      await connection.query(
        `UPDATE accounting_vouchers SET
         date = ?,
         company_id = ?,
         office_id = ?,
         fiscal_period_id = ?,
         third_party_id = ?,
         concept = ?,
         description = ?,
         reference = ?,
         document_type_id = ?,
         document_id = ?,
         document_number = ?,
         total_amount = ?,
         total_debit = ?,
         total_credit = ?,
         currency_id = ?,
         exchange_rate = ?,
         entity_type = ?,
         entity_id = ?,
         entity_name = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          voucherData.date,
          voucherData.company_id,
          voucherData.office_id,
          voucherData.fiscal_period_id,
          voucherData.third_party_id,
          voucherData.concept,
          voucherData.description || null,
          voucherData.reference || null,
          voucherData.document_type_id || null,
          voucherData.document_id || null,
          voucherData.document_number || null,
          voucherData.total_amount || 0,
          voucherData.total_debit || 0,
          voucherData.total_credit || 0,
          voucherData.currency_id || null,
          voucherData.exchange_rate || 1,
          voucherData.entity_type || null,
          voucherData.entity_id || null,
          voucherData.entity_name || null,
          voucherData.updated_by,
          id
        ]
      );
      
      // Actualizar relación con asiento contable si se proporciona
      if (voucherData.journal_entry_id) {
        // Primero eliminar relación existente
        await connection.query(
          `DELETE FROM accounting_voucher_journal_entries WHERE voucher_id = ?`,
          [id]
        );
        
        // Crear nueva relación
        await connection.query(
          `INSERT INTO accounting_voucher_journal_entries (voucher_id, journal_entry_id) 
           VALUES (?, ?)`,
          [id, voucherData.journal_entry_id]
        );
      }
      
      await connection.commit();
      
      return { id, ...voucherData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar comprobante contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un comprobante contable existente incluyendo sus líneas
   * @param {number} id - ID del comprobante contable
   * @param {Object} voucherData - Datos actualizados del comprobante (incluyendo voucher_lines)
   * @returns {Promise<Object>} Comprobante contable actualizado
   */
  static async updateWithLines(id, voucherData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el comprobante exista y esté en estado borrador
      const [voucherCheck] = await connection.query(
        `SELECT status, journal_entry_id FROM accounting_vouchers WHERE id = ?`,
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`El comprobante con ID ${id} no existe`);
      }
      
      if (voucherCheck[0].status !== 'DRAFT') {
        throw new Error('Solo se pueden modificar comprobantes en estado DRAFT');
      }

      if (voucherCheck[0].journal_entry_id) {
        throw new Error('No se puede modificar un comprobante que ya tiene un asiento contable asociado');
      }
      
      // Actualizar el encabezado del comprobante
      await connection.query(
        `UPDATE accounting_vouchers SET
         voucher_type_id = ?,
         date = ?,
         company_id = ?,
         office_id = ?,
         fiscal_period_id = ?,
         third_party_id = ?,
         concept = ?,
         description = ?,
         reference = ?,
         document_type_id = ?,
         document_id = ?,
         document_number = ?,
         total_amount = ?,
         total_debit = ?,
         total_credit = ?,
         currency_id = ?,
         exchange_rate = ?,
         entity_type = ?,
         entity_id = ?,
         entity_name = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          voucherData.voucher_type_id,
          voucherData.date,
          voucherData.company_id,
          voucherData.office_id,
          voucherData.fiscal_period_id,
          voucherData.third_party_id,
          voucherData.concept,
          voucherData.description || null,
          voucherData.reference || null,
          voucherData.document_type_id || null,
          voucherData.document_id || null,
          voucherData.document_number || null,
          voucherData.total_amount || 0,
          voucherData.total_debit || 0,
          voucherData.total_credit || 0,
          voucherData.currency_id || null,
          voucherData.exchange_rate || 1,
          voucherData.entity_type || null,
          voucherData.entity_id || null,
          voucherData.entity_name || null,
          voucherData.updated_by,
          id
        ]
      );
      
      // Actualizar líneas del comprobante si están presentes
      if (voucherData.voucher_lines && Array.isArray(voucherData.voucher_lines)) {
        // Eliminar líneas existentes
        await connection.query(
          `DELETE FROM voucher_lines WHERE voucher_id = ?`,
          [id]
        );
        
        // Insertar nuevas líneas
        for (let i = 0; i < voucherData.voucher_lines.length; i++) {
          const line = voucherData.voucher_lines[i];
          
          await connection.query(
            `INSERT INTO voucher_lines 
            (voucher_id, line_number, account_id, third_party_id, description, 
             debit_amount, credit_amount, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              line.line_number || line.line_order || i + 1,
              line.account_id,
              line.third_party_id || voucherData.third_party_id || null,
              line.description || '',
              line.debit_amount || 0,
              line.credit_amount || 0,
              line.reference || null
            ]
          );
        }
      }
      
      // Actualizar relación con asiento contable si se proporciona
      if (voucherData.journal_entry_id) {
        // Primero eliminar relación existente
        await connection.query(
          `DELETE FROM accounting_voucher_journal_entries WHERE voucher_id = ?`,
          [id]
        );
        
        // Crear nueva relación
        await connection.query(
          `INSERT INTO accounting_voucher_journal_entries (voucher_id, journal_entry_id) 
           VALUES (?, ?)`,
          [id, voucherData.journal_entry_id]
        );
      }
      
      await connection.commit();
      
      return { id, ...voucherData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar comprobante contable con líneas ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar el estado de un comprobante contable
   * @param {number} id - ID del comprobante contable
   * @param {string} newStatus - Nuevo estado ('VALIDATED', 'APPROVED', 'CANCELLED')
   * @param {number} userId - ID del usuario que realiza el cambio
   * @param {string} comentario - Comentario opcional sobre el cambio de estado
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async changeStatus(id, newStatus, userId, comentario = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el comprobante exista
      const [voucherResult] = await connection.query(
        `SELECT v.*, vt.code as type_code 
         FROM accounting_vouchers v
         LEFT JOIN accounting_voucher_types vt ON v.voucher_type_id = vt.id
         WHERE v.id = ?`,
        [id]
      );
      
      if (!voucherResult.length) {
        throw new Error(`El comprobante con ID ${id} no existe`);
      }
      
      const voucher = voucherResult[0];
      const currentStatus = voucher.status;
      
      // Validar cambios de estado permitidos
      if (currentStatus === 'CANCELLED') {
        throw new Error('No se puede cambiar el estado de un comprobante anulado');
      }
      
      if (currentStatus === 'APPROVED' && newStatus !== 'CANCELLED') {
        throw new Error('Un comprobante aprobado solo puede anularse');
      }
      
      if (newStatus === 'APPROVED' && currentStatus !== 'VALIDATED') {
        throw new Error('Solo se pueden aprobar comprobantes previamente validados');
      }
      
      // Registrar historial de cambio de estado
      await connection.query(
        `INSERT INTO accounting_voucher_status_history 
         (voucher_id, previous_status, new_status, user_id, comments)
         VALUES (?, ?, ?, ?, ?)`,
        [id, currentStatus, newStatus, userId, comentario]
      );
      
      // Actualizar estado del comprobante
      let updateQuery = `UPDATE accounting_vouchers SET status = ? WHERE id = ?`;
      let updateParams = [newStatus, id];
      
      // Si el nuevo estado es APPROVED, generar el asiento contable
      if (newStatus === 'APPROVED') {
        // Obtener las líneas del comprobante
        const [voucherLines] = await connection.query(
          `SELECT * FROM voucher_lines WHERE voucher_id = ? ORDER BY line_number`,
          [id]
        );

        
        if (voucherLines.length === 0) {
          throw new Error('No se encontraron líneas para el comprobante');
        }
        
        // Generar número de asiento
        let entryNumber = `JE-${new Date().getFullYear()}-`;
        // Buscar el último número de asiento para este año
        const [lastEntry] = await connection.query(
          `SELECT MAX(CAST(SUBSTRING_INDEX(entry_number, '-', -1) AS UNSIGNED)) as last_number
           FROM journal_entries
           WHERE entry_number LIKE ?`,
          [`JE-${new Date().getFullYear()}-%`]
        );

        console.log(lastEntry);
        
        const lastNumber = lastEntry[0].last_number || 0;
        entryNumber += (lastNumber + 1).toString().padStart(5, '0');
        
        // Crear el asiento contable
        const [journalEntryResult] = await connection.query(
          `INSERT INTO journal_entries
          (entry_number, date, fiscal_period_id, reference, description, 
           third_party_id, status, source_document_type, source_document_id, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entryNumber,
            voucher.date,
            voucher.fiscal_period_id,
            voucher.reference || voucher.voucher_number,
            `Asiento generado desde comprobante ${voucher.voucher_number || id}`,
            voucher.third_party_id,
            'posted', // Al generarse desde comprobante, se crea ya aprobado
            'voucher',
            id,
            userId
          ]
        );
        
        const journalEntryId = journalEntryResult.insertId;
        
        // Crear las líneas del asiento a partir de las líneas del comprobante
        for (let i = 0; i < voucherLines.length; i++) {
          const line = voucherLines[i];
          await connection.query(
            `INSERT INTO journal_entry_lines
            (journal_entry_id, account_id, third_party_id, description, 
             debit_amount, credit_amount, order_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              journalEntryId,
              line.account_id,
              line.third_party_id,
              line.description,
              line.debit_amount,
              line.credit_amount,
              i + 1
            ]
          );
        }
        
        // Actualizar totales en el asiento
        await connection.query(
          `UPDATE journal_entries 
           SET total_debit = ?, total_credit = ?
           WHERE id = ?`,
          [voucher.total_debit, voucher.total_credit, journalEntryId]
        );

        // *** NUEVA FUNCIONALIDAD: Crear transacciones bancarias automáticamente desde voucher ***
        try {
          console.log('voucherLines para integración bancaria:', voucherLines);
          
          // Verificar si el voucher afecta cuentas bancarias
          const hasBankAccountLines = await BankTransactionIntegration.hasJournalEntryBankAccountLines(voucherLines);
          
          if (hasBankAccountLines) {
            logger.info(`Voucher ${id} (asiento ${journalEntryId}) afecta cuentas bancarias, creando transacciones automáticamente`);
            
            // Crear transacciones bancarias automáticamente
            const createdTransactions = await BankTransactionIntegration.processJournalEntryForBankTransactions(
              journalEntryId, 
              voucherLines, 
              connection
            );
            
            if (createdTransactions.length > 0) {
              logger.info(`Se crearon ${createdTransactions.length} transacciones bancarias automáticamente desde voucher ${id}`);
            }
          }
        } catch (bankError) {
          // Log del error pero no fallar el proceso principal del voucher
          logger.error(`Error al crear transacciones bancarias automáticas desde voucher ${id}: ${bankError.message}`);
          // Para mayor seguridad, continuamos sin fallar la aprobación del voucher
        }
        
        // Asociar el asiento con el comprobante
        await connection.query(
          `INSERT INTO accounting_voucher_journal_entries 
           (voucher_id, journal_entry_id) VALUES (?, ?)`,
          [id, journalEntryId]
        );
        
        // Actualizar el comprobante con la referencia al asiento
        updateQuery = `UPDATE accounting_vouchers 
                       SET status = ?, approved_at = NOW(), approved_by = ?, journal_entry_id = ? 
                       WHERE id = ?`;
        updateParams = [newStatus, userId, journalEntryId, id];
      }
      
      await connection.query(updateQuery, updateParams);
      
      await connection.commit();
      
      return { 
        id, 
        previous_status: currentStatus, 
        new_status: newStatus, 
        updated_by: userId,
        update_date: new Date()
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado del comprobante ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un comprobante contable (solo en estado BORRADOR)
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el comprobante exista y esté en estado borrador
      const [voucherCheck] = await connection.query(
        `SELECT status FROM accounting_vouchers WHERE id = ?`,
        [id]
      );
      
      if (!voucherCheck.length) {
        throw new Error(`El comprobante con ID ${id} no existe`);
      }
      
      if (voucherCheck[0].status !== 'DRAFT') {
        throw new Error('Solo se pueden eliminar comprobantes en estado DRAFT');
      }
      
      // Eliminar relaciones con asientos contables
      await connection.query(
        `DELETE FROM accounting_voucher_journal_entries WHERE voucher_id = ?`,
        [id]
      );
      


      // Eliminar relaciones con documentos
      // pendiente de implementar
     /* await connection.query(
        `DELETE FROM accounting_voucher_documents WHERE voucher_id = ?`,
        [id]
      );*/
      
      // Eliminar historial de estados
      await connection.query(
        `DELETE FROM accounting_voucher_status_history WHERE voucher_id = ?`,
        [id]
      );
      
      // Eliminar el comprobante
      await connection.query(
        `DELETE FROM accounting_vouchers WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar comprobante contable ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener el historial de estados de un comprobante
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Array>} Historial de estados
   */
  static async getStatusHistory(id) {
    try {
      const [rows] = await pool.query(
        `SELECT h.*, u.username as user_name
         FROM accounting_voucher_status_history h
         LEFT JOIN users u ON h.user_id = u.id
         WHERE h.voucher_id = ?
         ORDER BY h.created_at DESC`,
        [id]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener historial de estados del comprobante ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener asientos contables asociados a un comprobante
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Array>} Asientos contables asociados
   */
  static async getRelatedJournalEntries(id) {
    try {
      const [rows] = await pool.query(
        `SELECT je.*, vje.created_at as association_date
         FROM accounting_voucher_journal_entries vje
         JOIN journal_entries je ON vje.journal_entry_id = je.id
         WHERE vje.voucher_id = ?
         ORDER BY vje.created_at DESC`,
        [id]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener asientos asociados al comprobante ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener documentos asociados a un comprobante
   * @param {number} id - ID del comprobante contable
   * @returns {Promise<Array>} Documentos asociados
   */
  static async getRelatedDocuments(id) {
    try {
      const [rows] = await pool.query(
        `SELECT d.*, vd.created_at as association_date
         FROM accounting_voucher_documents vd
         JOIN legal_documents d ON vd.document_id = d.id
         WHERE vd.voucher_id = ?
         ORDER BY vd.created_at DESC`,
        [id]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener documentos asociados al comprobante ${id}: ${error.message}`);
      throw error;
    }
  }
  /**
 * Obtener líneas de un comprobante contable
 * @param {number} id - ID del comprobante contable
 * @returns {Promise<Array>} Lista de líneas del comprobante
 */
static async getVoucherLines(id) {
  try {
    const [rows] = await pool.query(
      `SELECT vl.*, 
              coa.name as account_name, coa.code as account_code,
              tp.name as third_party_name
       FROM voucher_lines vl
       LEFT JOIN chart_of_accounts coa ON vl.account_id = coa.id
       LEFT JOIN third_parties tp ON vl.third_party_id = tp.id
       WHERE vl.voucher_id = ?
       ORDER BY vl.line_number ASC`,
      [id]
    );
    return rows;
  } catch (error) {
    logger.error(`Error al obtener líneas del comprobante ${id}: ${error.message}`);
    throw error;
  }
}
}

module.exports = Voucher; 