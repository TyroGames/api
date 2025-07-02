/**
 * Modelo para gestionar extractos bancarios e importación
 * @module models/Contabilidad/Tesoreria/bankStatementModel
 */

const { pool } = require('../../../config/db');
const logger = require('../../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const csv = require('csv-parser');
// const pdf = require('pdf-parse'); // Se instalará si es necesario

/**
 * Clase para gestionar los extractos bancarios y su procesamiento
 */
class BankStatement {
  /**
   * Obtener todos los extractos bancarios con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de extractos bancarios
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT bs.*, 
               ba.account_number, ba.name as account_name, ba.bank_name,
               u.username as imported_by_name,
               COUNT(bsm.id) as total_movements,
               SUM(CASE WHEN bsm.movement_type = 'credit' THEN bsm.amount ELSE 0 END) as total_credits,
               SUM(CASE WHEN bsm.movement_type = 'debit' THEN bsm.amount ELSE 0 END) as total_debits
        FROM bank_statement_imports bs
        LEFT JOIN bank_accounts ba ON bs.bank_account_id = ba.id
        LEFT JOIN users u ON bs.imported_by = u.id
        LEFT JOIN bank_statement_movements bsm ON bs.id = bsm.statement_import_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros
      if (filters.bank_account_id) {
        conditions.push("bs.bank_account_id = ?");
        queryParams.push(filters.bank_account_id);
      }

      if (filters.statement_date_from) {
        conditions.push("bs.statement_date >= ?");
        queryParams.push(filters.statement_date_from);
      }

      if (filters.statement_date_to) {
        conditions.push("bs.statement_date <= ?");
        queryParams.push(filters.statement_date_to);
      }

      if (filters.status) {
        conditions.push("bs.status = ?");
        queryParams.push(filters.status);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY bs.id ORDER BY bs.statement_date DESC, bs.imported_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener extractos bancarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un extracto bancario por ID
   * @param {number} id - ID del extracto
   * @returns {Promise<Object>} Extracto bancario con movimientos
   */
  static async getById(id) {
    try {
      // Obtener datos del extracto
      const [statementRows] = await pool.query(
        `SELECT bs.*, 
                ba.account_number, ba.name as account_name, ba.bank_name,
                u.username as imported_by_name
         FROM bank_statement_imports bs
         LEFT JOIN bank_accounts ba ON bs.bank_account_id = ba.id
         LEFT JOIN users u ON bs.imported_by = u.id
         WHERE bs.id = ?`,
        [id]
      );

      if (!statementRows.length) {
        return null;
      }

      const statement = statementRows[0];

      // Obtener movimientos del extracto
      const [movementRows] = await pool.query(
        `SELECT * FROM bank_statement_movements 
         WHERE statement_import_id = ? 
         ORDER BY movement_date, created_at`,
        [id]
      );

      statement.movements = movementRows;
      return statement;
    } catch (error) {
      logger.error(`Error al obtener extracto bancario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo registro de importación de extracto
   * @param {Object} statementData - Datos del extracto
   * @returns {Promise<Object>} Extracto creado
   */
  static async createImport(statementData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar que la cuenta bancaria exista
      const [bankAccount] = await connection.query(
        `SELECT id, is_active FROM bank_accounts WHERE id = ?`,
        [statementData.bank_account_id]
      );

      if (!bankAccount.length) {
        throw new Error('La cuenta bancaria especificada no existe');
      }

      if (!bankAccount[0].is_active) {
        throw new Error('No se pueden importar extractos para cuentas inactivas');
      }

      // Insertar registro de importación
      const [result] = await connection.query(
        `INSERT INTO bank_statement_imports 
        (bank_account_id, statement_date, file_path, file_type, file_size, 
         original_filename, status, imported_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          statementData.bank_account_id,
          statementData.statement_date,
          statementData.file_path,
          statementData.file_type,
          statementData.file_size,
          statementData.original_filename,
          'uploaded', // Estado inicial
          statementData.imported_by
        ]
      );

      await connection.commit();
      
      return { 
        id: result.insertId, 
        ...statementData,
        status: 'uploaded'
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear importación de extracto: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar archivo de extracto bancario
   * @param {number} importId - ID de la importación
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  static async processStatement(importId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener datos de la importación
      const [importRows] = await connection.query(
        `SELECT * FROM bank_statement_imports WHERE id = ?`,
        [importId]
      );

      if (!importRows.length) {
        throw new Error(`Importación con ID ${importId} no encontrada`);
      }

      const importData = importRows[0];

      if (importData.status !== 'uploaded') {
        throw new Error('El extracto ya ha sido procesado o está en proceso');
      }

      // Actualizar estado a procesando
      await connection.query(
        `UPDATE bank_statement_imports SET status = 'processing' WHERE id = ?`,
        [importId]
      );

      // Procesar archivo según el tipo
      let movements = [];
      const filePath = path.resolve(importData.file_path);

      switch (importData.file_type.toLowerCase()) {
        case '.xlsx':
        case '.xls':
          movements = await this.processExcelStatement(filePath);
          break;
        case '.csv':
          movements = await this.processCSVStatement(filePath);
          break;
        case '.pdf':
          movements = await this.processPDFStatement(filePath);
          break;
        default:
          throw new Error(`Tipo de archivo no soportado: ${importData.file_type}`);
      }

      // Insertar movimientos procesados
      for (const movement of movements) {
        await connection.query(
          `INSERT INTO bank_statement_movements 
          (statement_import_id, movement_date, description, reference, 
           amount, movement_type, balance)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            importId,
            movement.movement_date,
            movement.description,
            movement.reference || null,
            Math.abs(movement.amount),
            movement.amount >= 0 ? 'credit' : 'debit',
            movement.balance || null
          ]
        );
      }

      // Actualizar estadísticas de la importación
      const totalMovements = movements.length;
      const totalCredits = movements.filter(m => m.amount >= 0).reduce((sum, m) => sum + m.amount, 0);
      const totalDebits = movements.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0);

      await connection.query(
        `UPDATE bank_statement_imports 
         SET status = 'processed', total_movements = ?, total_credits = ?, 
             total_debits = ?, processed_at = NOW()
         WHERE id = ?`,
        [totalMovements, totalCredits, totalDebits, importId]
      );

      await connection.commit();

      return {
        import_id: importId,
        total_movements: totalMovements,
        total_credits: totalCredits,
        total_debits: totalDebits,
        processed_at: new Date()
      };

    } catch (error) {
      await connection.rollback();
      
      // Actualizar estado a error
      await connection.query(
        `UPDATE bank_statement_imports 
         SET status = 'error', error_message = ? 
         WHERE id = ?`,
        [error.message, importId]
      );

      logger.error(`Error al procesar extracto ${importId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Procesar archivo Excel de extracto bancario
   * @param {string} filePath - Ruta del archivo Excel
   * @returns {Promise<Array>} Lista de movimientos extraídos
   */
  static async processExcelStatement(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const movements = [];

      for (const row of data) {
        // Mapear columnas comunes de extractos bancarios
        const movement = {
          movement_date: this.parseExcelDate(row['Fecha'] || row['Date'] || row['FECHA']),
          description: row['Descripcion'] || row['Description'] || row['DESCRIPCION'] || '',
          reference: row['Referencia'] || row['Reference'] || row['REF'] || null,
          amount: parseFloat(row['Valor'] || row['Amount'] || row['VALOR'] || 0),
          balance: parseFloat(row['Saldo'] || row['Balance'] || row['SALDO'] || null)
        };

        if (movement.movement_date && movement.amount !== 0) {
          movements.push(movement);
        }
      }

      return movements;
    } catch (error) {
      logger.error(`Error al procesar Excel: ${error.message}`);
      throw new Error(`Error al procesar archivo Excel: ${error.message}`);
    }
  }

  /**
   * Procesar archivo CSV de extracto bancario
   * @param {string} filePath - Ruta del archivo CSV
   * @returns {Promise<Array>} Lista de movimientos extraídos
   */
  static async processCSVStatement(filePath) {
    return new Promise((resolve, reject) => {
      const movements = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const movement = {
              movement_date: this.parseDate(row.fecha || row.Fecha || row.Date),
              description: row.descripcion || row.Descripcion || row.Description || '',
              reference: row.referencia || row.Referencia || row.Reference || null,
              amount: parseFloat(row.valor || row.Valor || row.Amount || 0),
              balance: parseFloat(row.saldo || row.Saldo || row.Balance || null)
            };

            if (movement.movement_date && movement.amount !== 0) {
              movements.push(movement);
            }
          } catch (error) {
            logger.warn(`Error al procesar fila CSV: ${error.message}`);
          }
        })
        .on('end', () => {
          resolve(movements);
        })
        .on('error', (error) => {
          reject(new Error(`Error al procesar archivo CSV: ${error.message}`));
        });
    });
  }

  /**
   * Procesar archivo PDF de extracto bancario
   * @param {string} filePath - Ruta del archivo PDF
   * @returns {Promise<Array>} Lista de movimientos extraídos
   */
  static async processPDFStatement(filePath) {
    try {
      // Por ahora, registramos el archivo como recibido pero no procesamos contenido
      // TODO: Implementar extracción de texto de PDF usando pdf-parse o similar
      logger.info(`Archivo PDF recibido: ${path.basename(filePath)}`);
      logger.info('El procesamiento automático de PDFs está en desarrollo. El archivo se ha guardado exitosamente.');
      
      // Crear un movimiento dummy para indicar que el archivo fue recibido
      const movements = [{
        movement_date: new Date().toISOString().split('T')[0],
        description: `Extracto PDF importado: ${path.basename(filePath)}. Procesamiento manual requerido.`,
        reference: 'PDF_IMPORT',
        amount: 0.01, // Valor mínimo para que sea visible en el sistema
        balance: null
      }];

      return movements;
    } catch (error) {
      logger.error(`Error al procesar PDF: ${error.message}`);
      throw new Error(`Error al procesar archivo PDF: ${error.message}`);
    }
  }

  /**
   * Analizar diferencias entre extracto y sistema
   * @param {number} importId - ID de la importación del extracto
   * @param {number} bankAccountId - ID de la cuenta bancaria
   * @param {string} dateFrom - Fecha inicial
   * @param {string} dateTo - Fecha final
   * @returns {Promise<Object>} Análisis de diferencias
   */
  static async analyzeDifferences(importId, bankAccountId, dateFrom, dateTo) {
    try {
      // Obtener movimientos del extracto
      const [statementMovements] = await pool.query(
        `SELECT * FROM bank_statement_movements bsm
         JOIN bank_statement_imports bsi ON bsm.statement_import_id = bsi.id
         WHERE bsi.id = ? AND bsm.movement_date BETWEEN ? AND ?
         ORDER BY bsm.movement_date`,
        [importId, dateFrom, dateTo]
      );

      // Obtener movimientos del sistema
      const [systemMovements] = await pool.query(
        `SELECT * FROM bank_transactions 
         WHERE bank_account_id = ? AND date BETWEEN ? AND ?
         ORDER BY date`,
        [bankAccountId, dateFrom, dateTo]
      );

      // Análisis de matching automático
      const analysis = {
        statement_movements: statementMovements.length,
        system_movements: systemMovements.length,
        matched_movements: 0,
        unmatched_statement: [],
        unmatched_system: [],
        potential_matches: [],
        differences: {
          statement_total: 0,
          system_total: 0,
          difference: 0
        }
      };

      // Calcular totales
      analysis.differences.statement_total = statementMovements.reduce((sum, m) => 
        sum + (m.movement_type === 'credit' ? m.amount : -m.amount), 0);
      
      analysis.differences.system_total = systemMovements.reduce((sum, m) => 
        sum + m.amount, 0);
      
      analysis.differences.difference = analysis.differences.statement_total - analysis.differences.system_total;

      // Algoritmo de matching básico
      const usedSystemIds = new Set();
      
      for (const statementMove of statementMovements) {
        let matched = false;
        
        for (const systemMove of systemMovements) {
          if (usedSystemIds.has(systemMove.id)) continue;
          
          // Matching por fecha exacta y monto
          const sameDate = statementMove.movement_date === systemMove.date.toISOString().split('T')[0];
          const sameAmount = Math.abs(Math.abs(statementMove.amount) - Math.abs(systemMove.amount)) < 0.01;
          
          if (sameDate && sameAmount) {
            analysis.matched_movements++;
            usedSystemIds.add(systemMove.id);
            matched = true;
            break;
          }
          
          // Matching potencial (fecha cercana o monto similar)
          const dateDiff = Math.abs(new Date(statementMove.movement_date) - new Date(systemMove.date));
          const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
          const amountDiff = Math.abs(Math.abs(statementMove.amount) - Math.abs(systemMove.amount));
          
          if (daysDiff <= 3 && amountDiff < Math.abs(statementMove.amount) * 0.1) {
            analysis.potential_matches.push({
              statement_movement: statementMove,
              system_movement: systemMove,
              confidence: 1 - (daysDiff * 0.1 + amountDiff / Math.abs(statementMove.amount))
            });
          }
        }
        
        if (!matched) {
          analysis.unmatched_statement.push(statementMove);
        }
      }

      // Movimientos del sistema no emparejados
      analysis.unmatched_system = systemMovements.filter(m => !usedSystemIds.has(m.id));

      return analysis;
    } catch (error) {
      logger.error(`Error al analizar diferencias: ${error.message}`);
      throw error;
    }
  }

  /**
   * Utilidades para parsear fechas
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Intentar diferentes formatos de fecha
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/ // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.toString().match(format);
      if (match) {
        if (format === formats[0]) { // YYYY-MM-DD
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else { // DD/MM/YYYY or DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    return null;
  }

  static parseExcelDate(dateValue) {
    if (!dateValue) return null;
    
    // Si es un número (fecha serial de Excel)
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return this.parseDate(dateValue);
  }

  /**
   * Eliminar extracto importado
   * @param {number} id - ID del extracto a eliminar
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Obtener información del archivo
      const [importRows] = await connection.query(
        `SELECT file_path FROM bank_statement_imports WHERE id = ?`,
        [id]
      );

      if (importRows.length > 0) {
        // Eliminar movimientos relacionados
        await connection.query(
          `DELETE FROM bank_statement_movements WHERE statement_import_id = ?`,
          [id]
        );

        // Eliminar registro de importación
        await connection.query(
          `DELETE FROM bank_statement_imports WHERE id = ?`,
          [id]
        );

        // Eliminar archivo físico
        try {
          await fs.unlink(importRows[0].file_path);
        } catch (fileError) {
          logger.warn(`No se pudo eliminar archivo físico: ${fileError.message}`);
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar extracto ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BankStatement; 