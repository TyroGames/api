/**
 * Modelo para gestionar los períodos fiscales
 * @module models/Contabilidad/General/Periodos_Fiscales/fiscalPeriodModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar los períodos fiscales en el sistema
 */
class FiscalPeriod {
  /**
   * Obtener todos los períodos fiscales con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de períodos fiscales
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT fp.*, 
               c.name as company_name,
               fy.year_number, fy.name as fiscal_year_name, fy.status as year_status,
               u2.username as closed_by_name,
               DATEDIFF(fp.end_date, fp.start_date) + 1 as period_days,
               CASE 
                 WHEN fp.is_closed = 1 THEN 'Cerrado'
                 WHEN CURDATE() BETWEEN fp.start_date AND fp.end_date THEN 'Activo'
                 WHEN CURDATE() < fp.start_date THEN 'Futuro'
                 ELSE 'Vencido'
               END as status_display
        FROM fiscal_periods fp
        LEFT JOIN companies c ON fp.company_id = c.id
        LEFT JOIN fiscal_years fy ON fp.company_id = fy.company_id 
          AND fp.start_date >= fy.start_date 
          AND fp.end_date <= fy.end_date
        LEFT JOIN users u2 ON fp.closed_by = u2.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.company_id) {
        conditions.push("fp.company_id = ?");
        queryParams.push(filters.company_id);
      }

      if (filters.is_closed !== undefined) {
        conditions.push("fp.is_closed = ?");
        queryParams.push(filters.is_closed);
      }

      if (filters.year_number) {
        conditions.push("fy.year_number = ?");
        queryParams.push(filters.year_number);
      }

      if (filters.start_date) {
        conditions.push("fp.start_date >= ?");
        queryParams.push(filters.start_date);
      }

      if (filters.end_date) {
        conditions.push("fp.end_date <= ?");
        queryParams.push(filters.end_date);
      }

      if (filters.status) {
        switch (filters.status) {
          case 'active':
            conditions.push("fp.is_closed = 0 AND CURDATE() BETWEEN fp.start_date AND fp.end_date");
            break;
          case 'open':
            conditions.push("fp.is_closed = 0");
            break;
          case 'closed':
            conditions.push("fp.is_closed = 1");
            break;
          case 'future':
            conditions.push("fp.is_closed = 0 AND CURDATE() < fp.start_date");
            break;
          case 'expired':
            conditions.push("fp.is_closed = 0 AND CURDATE() > fp.end_date");
            break;
        }
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY fp.start_date DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un período fiscal por ID
   * @param {number} id - ID del período fiscal
   * @returns {Promise<Object>} Período fiscal
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT fp.*, 
                c.name as company_name,
                fy.year_number, fy.name as fiscal_year_name, fy.status as year_status,
                u2.username as closed_by_name,
                DATEDIFF(fp.end_date, fp.start_date) + 1 as period_days,
                CASE 
                  WHEN fp.is_closed = 1 THEN 'Cerrado'
                  WHEN CURDATE() BETWEEN fp.start_date AND fp.end_date THEN 'Activo'
                  WHEN CURDATE() < fp.start_date THEN 'Futuro'
                  ELSE 'Vencido'
                END as status_display
         FROM fiscal_periods fp
         LEFT JOIN companies c ON fp.company_id = c.id
         LEFT JOIN fiscal_years fy ON fp.company_id = fy.company_id 
           AND fp.start_date >= fy.start_date 
           AND fp.end_date <= fy.end_date
         LEFT JOIN users u2 ON fp.closed_by = u2.id
         WHERE fp.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener período fiscal con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener el período fiscal activo actual
   * @param {number} companyId - ID de la compañía
   * @returns {Promise<Object>} Período fiscal activo
   */
  static async getCurrentPeriod(companyId) {
    try {
      const [rows] = await pool.query(
        `SELECT fp.*, 
                fy.year_number,
                fy.name as fiscal_year_name,
                fy.status as year_status,
                c.name as company_name,
                DATEDIFF(fp.end_date, fp.start_date) + 1 as period_days,
                CASE 
                  WHEN fp.end_date < CURDATE() AND fp.is_closed = 0 THEN 'Vencido'
                  WHEN fp.start_date <= CURDATE() AND fp.end_date >= CURDATE() THEN 'Actual'
                  WHEN fp.start_date > CURDATE() THEN 'Futuro'
                  WHEN fp.is_closed = 1 THEN 'Cerrado'
                  ELSE 'Otro'
                END as status_display
         FROM fiscal_periods fp
         LEFT JOIN fiscal_years fy ON fp.company_id = fy.company_id 
           AND fp.start_date >= fy.start_date 
           AND fp.end_date <= fy.end_date
           AND fy.status = 'active'
         LEFT JOIN companies c ON fp.company_id = c.id
         WHERE fp.company_id = ? 
           AND fp.start_date <= CURDATE() 
           AND fp.end_date >= CURDATE()
         ORDER BY fp.start_date DESC
         LIMIT 1`,
        [companyId]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener período fiscal actual: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener períodos fiscales por año fiscal
   * @param {number} companyId - ID de la compañía
   * @param {number} yearId - ID del año fiscal (opcional)
   * @returns {Promise<Array>} Lista de períodos fiscales del año
   */
  static async getPeriodsByYear(companyId, yearId = null) {
    try {
      let query = `
        SELECT fp.*, 
               fy.year_number,
               fy.name as fiscal_year_name,
               fy.status as year_status,
               c.name as company_name,
               DATEDIFF(fp.end_date, fp.start_date) + 1 as period_days,
               CASE 
                 WHEN fp.end_date < CURDATE() AND fp.is_closed = 0 THEN 'Vencido'
                 WHEN fp.start_date <= CURDATE() AND fp.end_date >= CURDATE() THEN 'Actual'
                 WHEN fp.start_date > CURDATE() THEN 'Futuro'
                 WHEN fp.is_closed = 1 THEN 'Cerrado'
                 ELSE 'Otro'
               END as status_display,
               (SELECT COUNT(*) FROM accounting_vouchers av 
                WHERE av.fiscal_period_id = fp.id) as voucher_count,
               (SELECT COUNT(*) FROM journal_entries je 
                WHERE je.fiscal_period_id = fp.id) as journal_entry_count
        FROM fiscal_periods fp
        LEFT JOIN fiscal_years fy ON fp.company_id = fy.company_id 
          AND fp.start_date >= fy.start_date 
          AND fp.end_date <= fy.end_date
        LEFT JOIN companies c ON fp.company_id = c.id
        WHERE fp.company_id = ?
      `;

      const queryParams = [companyId];

      if (yearId) {
        // Si se especifica un año fiscal, filtrar por ese año
        query += `
          AND fy.id = ?
        `;
        queryParams.push(yearId);
      } else {
        // Si no se especifica año, usar el año activo
        query += `
          AND fy.status = 'active'
        `;
      }

      query += ` ORDER BY fp.start_date ASC`;

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener períodos fiscales por año: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo período fiscal
   * @param {Object} periodData - Datos del período fiscal
   * @returns {Promise<Object>} Período fiscal creado
   */
  static async create(periodData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Validar datos requeridos
      if (!periodData.company_id) {
        throw new Error('El ID de la compañía es requerido');
      }
      
      if (!periodData.start_date || !periodData.end_date) {
        throw new Error('Las fechas de inicio y fin son requeridas');
      }
      
      // Validar que las fechas sean correctas
      if (new Date(periodData.start_date) >= new Date(periodData.end_date)) {
        throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
      }
      
      // Verificar que no se solapen con períodos existentes
      const [overlap] = await connection.query(
        `SELECT id FROM fiscal_periods 
         WHERE company_id = ? 
         AND ((start_date <= ? AND end_date >= ?) 
              OR (start_date <= ? AND end_date >= ?))`,
        [
          periodData.company_id,
          periodData.end_date, periodData.end_date,
          periodData.start_date, periodData.end_date
        ]
      );
      
      if (overlap.length > 0) {
        throw new Error('Las fechas del período se solapan con períodos existentes');
      }
      
      // Insertar el período fiscal
      const [result] = await connection.query(
        `INSERT INTO fiscal_periods 
        (company_id, fiscal_year_id, start_date, end_date, is_closed)
        VALUES (?, ?, ?, ?, ?)`,
        [
          periodData.company_id,
          periodData.fiscal_year_id,
          periodData.start_date,
          periodData.end_date,
          periodData.is_closed || 0
        ]
      );
      
      await connection.commit();
      
      return { id: result.insertId, ...periodData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear período fiscal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un período fiscal existente
   * @param {number} id - ID del período fiscal
   * @param {Object} periodData - Datos actualizados del período
   * @returns {Promise<Object>} Período fiscal actualizado
   */
  static async update(id, periodData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el período exista
      const [periodCheck] = await connection.query(
        `SELECT * FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      if (!periodCheck.length) {
        throw new Error(`El período fiscal con ID ${id} no existe`);
      }
      
      const existingPeriod = periodCheck[0];
      
      // Verificar que el período no esté cerrado
      if (existingPeriod.is_closed) {
        throw new Error('No se pueden modificar períodos fiscales cerrados');
      }
      
      // Validar fechas si se proporcionan
      if (periodData.start_date && periodData.end_date) {
        if (new Date(periodData.start_date) >= new Date(periodData.end_date)) {
          throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
        }
        
        // Verificar que no se solapen con otros períodos (excluyendo el actual)
        const [overlap] = await connection.query(
          `SELECT id FROM fiscal_periods 
           WHERE company_id = ? 
           AND id != ?
           AND ((start_date <= ? AND end_date >= ?) 
                OR (start_date <= ? AND end_date >= ?))`,
          [
            existingPeriod.company_id,
            id,
            periodData.end_date, periodData.end_date,
            periodData.start_date, periodData.end_date
          ]
        );
        
        if (overlap.length > 0) {
          throw new Error('Las fechas del período se solapan con períodos existentes');
        }
      }
      
      // Construir query de actualización dinámico
      const updateFields = [];
      const updateValues = [];
      
      if (periodData.start_date !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(periodData.start_date);
      }
      
      if (periodData.end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(periodData.end_date);
      }
      
      if (periodData.is_closed !== undefined) {
        updateFields.push('is_closed = ?');
        updateValues.push(periodData.is_closed);
      }
      
      if (periodData.updated_by !== undefined) {
        updateFields.push('updated_by = ?');
        updateValues.push(periodData.updated_by);
      }
      
      // Agregar timestamp de actualización
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (updateFields.length === 1) { // Solo updated_at
        throw new Error('No se proporcionaron campos para actualizar');
      }
      
      updateValues.push(id);
      
      // Ejecutar actualización
      await connection.query(
        `UPDATE fiscal_periods SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Obtener el período actualizado
      const [updatedPeriod] = await connection.query(
        `SELECT * FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedPeriod[0];
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar período fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cerrar un período fiscal
   * @param {number} id - ID del período fiscal
   * @param {number} userId - ID del usuario que cierra
   * @param {string} comments - Comentarios del cierre
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async closePeriod(id, userId, comments = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el período exista y no esté cerrado
      const [periodCheck] = await connection.query(
        `SELECT * FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      if (!periodCheck.length) {
        throw new Error(`El período fiscal con ID ${id} no existe`);
      }
      
      const period = periodCheck[0];
      
      if (period.is_closed) {
        throw new Error('El período fiscal ya está cerrado');
      }
      
      // Verificar que todos los comprobantes estén aprobados
      const [draftVouchers] = await connection.query(
        `SELECT COUNT(*) as count FROM accounting_vouchers 
         WHERE fiscal_period_id = ? AND status = 'DRAFT'`,
        [id]
      );
      
      if (draftVouchers[0].count > 0) {
        throw new Error(`Existen ${draftVouchers[0].count} comprobantes en borrador. Todos los comprobantes deben estar aprobados antes del cierre`);
      }
      
      // Cerrar el período
      await connection.query(
        `UPDATE fiscal_periods SET
         is_closed = 1,
         closed_at = NOW(),
         closed_by = ?
         WHERE id = ?`,
        [userId, id]
      );
      
      await connection.commit();
      
      return { 
        id, 
        closed: true, 
        closed_by: userId,
        closed_at: new Date(),
        comments: comments
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cerrar período fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reabrir un período fiscal cerrado
   * @param {number} id - ID del período fiscal
   * @param {number} userId - ID del usuario que reabre
   * @param {string} comments - Comentarios de la reapertura
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async reopenPeriod(id, userId, comments = '') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el período exista
      const [periodCheck] = await connection.query(
        `SELECT * FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      if (!periodCheck.length) {
        throw new Error(`El período fiscal con ID ${id} no existe`);
      }
      
      const period = periodCheck[0];
      
      if (!period.is_closed) {
        throw new Error('El período fiscal ya está abierto');
      }
      
      // Verificar que no hay períodos posteriores abiertos (regla de secuencia)
      const [laterPeriods] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
           AND start_date > ? 
           AND is_closed = 0`,
        [period.company_id, period.end_date]
      );
      
      if (laterPeriods[0].count > 0) {
        throw new Error('No se puede reabrir este período porque existen períodos posteriores abiertos');
      }
      
      // Reabrir el período
      await connection.query(
        `UPDATE fiscal_periods SET
         is_closed = 0,
         reopened_at = NOW(),
         reopened_by = ?,
         closed_at = NULL,
         closed_by = NULL
         WHERE id = ?`,
        [userId, id]
      );
      
      await connection.commit();
      
      return { 
        id, 
        reopened: true, 
        reopened_by: userId,
        reopened_at: new Date(),
        comments: comments
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al reabrir período fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar períodos mensuales para un año fiscal
   * @param {number} companyId - ID de la compañía
   * @param {number} yearId - ID del año fiscal (opcional)
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de períodos generados
   */
  static async generateMonthlyPeriods(companyId, yearId = null, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      let yearData;
      
      if (yearId) {
        // Obtener datos del año fiscal específico
        const [yearCheck] = await connection.query(
          `SELECT * FROM fiscal_years WHERE id = ? AND company_id = ?`,
          [yearId, companyId]
        );
        
        if (!yearCheck.length) {
          throw new Error(`El año fiscal con ID ${yearId} no existe para esta compañía`);
        }
        
        yearData = yearCheck[0];
      } else {
        // Obtener el año fiscal activo
        const [activeYear] = await connection.query(
          `SELECT * FROM fiscal_years WHERE company_id = ? AND status = 'active'`,
          [companyId]
        );
        
        if (!activeYear.length) {
          throw new Error('No hay año fiscal activo para generar períodos');
        }
        
        yearData = activeYear[0];
      }
      
      // Verificar que no existan períodos ya generados para este año
      const [existingPeriods] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
           AND start_date >= ? 
           AND end_date <= ?`,
        [companyId, yearData.start_date, yearData.end_date]
      );
      
      if (existingPeriods[0].count > 0) {
        throw new Error(`Ya existen ${existingPeriods[0].count} períodos para este año fiscal`);
      }
      
      const generatedPeriods = [];
      const startDate = new Date(yearData.start_date);
      const endDate = new Date(yearData.end_date);
      
      let currentDate = new Date(startDate);
      let periodNumber = 1;
      
      while (currentDate <= endDate) {
        // Calcular el fin del mes
        const periodStart = new Date(currentDate);
        const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Ajustar si el período final excede el fin del año fiscal
        if (periodEnd > endDate) {
          periodEnd.setTime(endDate.getTime());
        }
        
        // Crear el período
        const [result] = await connection.query(
          `INSERT INTO fiscal_periods 
          (company_id, start_date, end_date, period_number, is_closed, created_by)
          VALUES (?, ?, ?, ?, 0, ?)`,
          [
            companyId,
            periodStart.toISOString().split('T')[0],
            periodEnd.toISOString().split('T')[0],
            periodNumber,
            userId
          ]
        );
        
        generatedPeriods.push({
          id: result.insertId,
          company_id: companyId,
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
          period_number: periodNumber,
          is_closed: 0
        });
        
        // Mover al siguiente mes
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
        periodNumber++;
        
        // Evitar bucles infinitos
        if (periodNumber > 12) {
          break;
        }
      }
      
      await connection.commit();
      
      logger.info(`Se generaron ${generatedPeriods.length} períodos mensuales para la compañía ${companyId}`);
      return generatedPeriods;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al generar períodos mensuales: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un período fiscal
   * @param {number} id - ID del período fiscal
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el período exista
      const [periodCheck] = await connection.query(
        `SELECT * FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      if (!periodCheck.length) {
        throw new Error(`El período fiscal con ID ${id} no existe`);
      }
      
      const period = periodCheck[0];
      
      // Verificar que el período no esté cerrado
      if (period.is_closed) {
        throw new Error('No se puede eliminar un período fiscal cerrado');
      }
      
      // Verificar que no tenga transacciones
      const [transactions] = await connection.query(
        `SELECT COUNT(*) as count FROM accounting_vouchers 
         WHERE fiscal_period_id = ?`,
        [id]
      );
      
      if (transactions[0].count > 0) {
        throw new Error(`No se puede eliminar el período. Tiene ${transactions[0].count} transacciones asociadas`);
      }
      
      // Eliminar el período
      await connection.query(
        `DELETE FROM fiscal_periods WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar período fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de un período fiscal
   * @param {number} id - ID del período fiscal
   * @returns {Promise<Object>} Estadísticas del período
   */
  static async getPeriodStatistics(id) {
    try {
      const [stats] = await pool.query(
        `SELECT 
           COUNT(DISTINCT av.id) as total_vouchers,
           COUNT(DISTINCT CASE WHEN av.status = 'DRAFT' THEN av.id END) as draft_vouchers,
           COUNT(DISTINCT CASE WHEN av.status = 'APPROVED' THEN av.id END) as approved_vouchers,
           COUNT(DISTINCT je.id) as total_journal_entries,
           COALESCE(SUM(av.total_debit), 0) as total_debits,
           COALESCE(SUM(av.total_credit), 0) as total_credits,
           COUNT(DISTINCT av.third_party_id) as unique_third_parties
         FROM fiscal_periods fp
         LEFT JOIN accounting_vouchers av ON fp.id = av.fiscal_period_id
         LEFT JOIN journal_entries je ON fp.id = je.fiscal_period_id
         WHERE fp.id = ?
         GROUP BY fp.id`,
        [id]
      );
      
      return stats[0] || {
        total_vouchers: 0,
        draft_vouchers: 0,
        approved_vouchers: 0,
        total_journal_entries: 0,
        total_debits: 0,
        total_credits: 0,
        unique_third_parties: 0
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas del período ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FiscalPeriod; 