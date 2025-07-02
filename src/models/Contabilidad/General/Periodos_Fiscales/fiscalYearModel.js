/**
 * Modelo para gestionar los años fiscales
 * @module models/Contabilidad/General/Periodos_Fiscales/fiscalYearModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar los años fiscales en el sistema
 */
class FiscalYear {
  /**
   * Obtener todos los años fiscales con filtros
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de años fiscales
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT fy.*, 
               c.name as company_name,
               u1.username as created_by_name,
               u2.username as closed_by_name,
               DATEDIFF(fy.end_date, fy.start_date) + 1 as year_days,
               (SELECT COUNT(*) FROM fiscal_periods fp 
                WHERE fp.company_id = fy.company_id 
                  AND fp.start_date >= fy.start_date 
                  AND fp.end_date <= fy.end_date) as periods_count,
               (SELECT COUNT(*) FROM fiscal_periods fp 
                WHERE fp.company_id = fy.company_id 
                  AND fp.start_date >= fy.start_date 
                  AND fp.end_date <= fy.end_date 
                  AND fp.is_closed = 1) as closed_periods_count
        FROM fiscal_years fy
        LEFT JOIN companies c ON fy.company_id = c.id
        LEFT JOIN users u1 ON fy.created_by = u1.id
        LEFT JOIN users u2 ON fy.closed_by = u2.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.company_id) {
        conditions.push("fy.company_id = ?");
        queryParams.push(filters.company_id);
      }

      if (filters.year_number) {
        conditions.push("fy.year_number = ?");
        queryParams.push(filters.year_number);
      }

      if (filters.status) {
        conditions.push("fy.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.is_closed !== undefined) {
        conditions.push("fy.is_closed = ?");
        queryParams.push(filters.is_closed);
      }

      if (filters.start_date) {
        conditions.push("fy.start_date >= ?");
        queryParams.push(filters.start_date);
      }

      if (filters.end_date) {
        conditions.push("fy.end_date <= ?");
        queryParams.push(filters.end_date);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY fy.year_number DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener años fiscales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un año fiscal por ID
   * @param {number} id - ID del año fiscal
   * @returns {Promise<Object>} Año fiscal
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT fy.*, 
                c.name as company_name,
                u1.username as created_by_name,
                u2.username as closed_by_name,
                DATEDIFF(fy.end_date, fy.start_date) + 1 as year_days,
                (SELECT COUNT(*) FROM fiscal_periods fp 
                 WHERE fp.company_id = fy.company_id 
                   AND fp.start_date >= fy.start_date 
                   AND fp.end_date <= fy.end_date) as periods_count,
                (SELECT COUNT(*) FROM fiscal_periods fp 
                 WHERE fp.company_id = fy.company_id 
                   AND fp.start_date >= fy.start_date 
                   AND fp.end_date <= fy.end_date 
                   AND fp.is_closed = 1) as closed_periods_count
         FROM fiscal_years fy
         LEFT JOIN companies c ON fy.company_id = c.id
         LEFT JOIN users u1 ON fy.created_by = u1.id
         LEFT JOIN users u2 ON fy.closed_by = u2.id
         WHERE fy.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener año fiscal con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener el año fiscal activo
   * @param {number} companyId - ID de la compañía
   * @returns {Promise<Object>} Año fiscal activo
   */
  static async getActiveYear(companyId) {
    try {
      const [rows] = await pool.query(
        `SELECT fy.*, 
                c.name as company_name,
                (SELECT COUNT(*) FROM fiscal_periods fp 
                 WHERE fp.company_id = fy.company_id 
                   AND fp.start_date >= fy.start_date 
                   AND fp.end_date <= fy.end_date) as periods_count
         FROM fiscal_years fy
         LEFT JOIN companies c ON fy.company_id = c.id
         WHERE fy.company_id = ? AND fy.status = 'active'`,
        [companyId]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener año fiscal activo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo año fiscal
   * @param {Object} yearData - Datos del año fiscal
   * @returns {Promise<Object>} Año fiscal creado
   */
  static async create(yearData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Validar que no haya solapamiento con otros años
      const [overlap] = await connection.query(
        `SELECT id FROM fiscal_years 
         WHERE company_id = ? 
           AND ((start_date <= ? AND end_date >= ?) 
             OR (start_date <= ? AND end_date >= ?)
             OR (start_date >= ? AND end_date <= ?))`,
        [
          yearData.company_id,
          yearData.start_date, yearData.start_date,
          yearData.end_date, yearData.end_date,
          yearData.start_date, yearData.end_date
        ]
      );
      
      if (overlap.length > 0) {
        throw new Error('Las fechas del año fiscal se solapan con años existentes');
      }
      
      // Validar que no haya otro año activo si este es activo
      if (yearData.status === 'active') {
        const [activeYear] = await connection.query(
          `SELECT id FROM fiscal_years 
           WHERE company_id = ? AND status = 'active'`,
          [yearData.company_id]
        );
        
        if (activeYear.length > 0) {
          throw new Error('Ya existe un año fiscal activo. Desactive el año actual antes de crear uno nuevo como activo');
        }
      }
      
      // Validar que el año número no exista para la compañía
      const [existingYear] = await connection.query(
        `SELECT id FROM fiscal_years 
         WHERE company_id = ? AND year_number = ?`,
        [yearData.company_id, yearData.year_number]
      );
      
      if (existingYear.length > 0) {
        throw new Error(`Ya existe el año fiscal ${yearData.year_number} para esta compañía`);
      }
      
      // Insertar el año fiscal
      const [result] = await connection.query(
        `INSERT INTO fiscal_years 
        (company_id, year_number, name, start_date, end_date, 
         is_closed, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          yearData.company_id,
          yearData.year_number,
          yearData.name,
          yearData.start_date,
          yearData.end_date,
          yearData.is_closed || 0,
          yearData.status || 'upcoming',
          yearData.created_by
        ]
      );
      
      await connection.commit();
      
      return { id: result.insertId, ...yearData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear año fiscal: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un año fiscal existente
   * @param {number} id - ID del año fiscal
   * @param {Object} yearData - Datos actualizados del año
   * @returns {Promise<Object>} Año fiscal actualizado
   */
  static async update(id, yearData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el año exista
      const [yearCheck] = await connection.query(
        `SELECT * FROM fiscal_years WHERE id = ?`,
        [id]
      );
      
      if (!yearCheck.length) {
        throw new Error(`El año fiscal con ID ${id} no existe`);
      }
      
      const existingYear = yearCheck[0];
      
      // Verificar que el año no esté cerrado si se intentan modificar fechas críticas
      if (existingYear.is_closed && (yearData.start_date || yearData.end_date)) {
        throw new Error('No se pueden modificar las fechas de un año fiscal cerrado');
      }
      
      // Validar fechas si se proporcionan
      if (yearData.start_date && yearData.end_date) {
        if (new Date(yearData.start_date) >= new Date(yearData.end_date)) {
          throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
        }
        
        // Verificar que no se solapen con otros años (excluyendo el actual)
        const [overlap] = await connection.query(
          `SELECT id FROM fiscal_years 
           WHERE company_id = ? 
           AND id != ?
           AND ((start_date <= ? AND end_date >= ?) 
                OR (start_date <= ? AND end_date >= ?)
                OR (start_date >= ? AND end_date <= ?))`,
          [
            existingYear.company_id,
            id,
            yearData.start_date, yearData.start_date,
            yearData.end_date, yearData.end_date,
            yearData.start_date, yearData.end_date
          ]
        );
        
        if (overlap.length > 0) {
          throw new Error('Las fechas del año fiscal se solapan con años existentes');
        }
      }
      
      // Validar que no haya otro año activo si este se quiere activar
      if (yearData.status === 'active' && existingYear.status !== 'active') {
        const [activeYear] = await connection.query(
          `SELECT id FROM fiscal_years 
           WHERE company_id = ? AND status = 'active' AND id != ?`,
          [existingYear.company_id, id]
        );
        
        if (activeYear.length > 0) {
          throw new Error('Ya existe un año fiscal activo. Desactive el año actual antes de activar este');
        }
      }
      
      // Construir query de actualización dinámico
      const updateFields = [];
      const updateValues = [];
      
      if (yearData.year_number !== undefined) {
        // Validar que el año número no exista para la compañía (excluyendo el actual)
        const [existingYearNumber] = await connection.query(
          `SELECT id FROM fiscal_years 
           WHERE company_id = ? AND year_number = ? AND id != ?`,
          [existingYear.company_id, yearData.year_number, id]
        );
        
        if (existingYearNumber.length > 0) {
          throw new Error(`Ya existe un año fiscal con el número ${yearData.year_number} para esta compañía`);
        }
        
        updateFields.push('year_number = ?');
        updateValues.push(yearData.year_number);
      }
      
      if (yearData.start_date !== undefined) {
        updateFields.push('start_date = ?');
        updateValues.push(yearData.start_date);
      }
      
      if (yearData.end_date !== undefined) {
        updateFields.push('end_date = ?');
        updateValues.push(yearData.end_date);
      }
      
      if (yearData.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(yearData.status);
      }
      
      if (yearData.is_closed !== undefined) {
        updateFields.push('is_closed = ?');
        updateValues.push(yearData.is_closed);
      }
      
      if (yearData.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(yearData.description);
      }
      
      if (yearData.updated_by !== undefined) {
        updateFields.push('updated_by = ?');
        updateValues.push(yearData.updated_by);
      }
      
      // Agregar timestamp de actualización
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (updateFields.length === 1) { // Solo updated_at
        throw new Error('No se proporcionaron campos para actualizar');
      }
      
      updateValues.push(id);
      
      // Ejecutar actualización
      await connection.query(
        `UPDATE fiscal_years SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // Obtener el año actualizado
      const [updatedYear] = await connection.query(
        `SELECT fy.*, c.name as company_name
         FROM fiscal_years fy
         LEFT JOIN companies c ON fy.company_id = c.id
         WHERE fy.id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return updatedYear[0];
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar año fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Activar un año fiscal
   * @param {number} id - ID del año fiscal
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async activateYear(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el año exista
      const [yearCheck] = await connection.query(
        `SELECT * FROM fiscal_years WHERE id = ?`,
        [id]
      );
      
      if (!yearCheck.length) {
        throw new Error(`El año fiscal con ID ${id} no existe`);
      }
      
      const year = yearCheck[0];
      
      if (year.is_closed) {
        throw new Error('No se puede activar un año fiscal cerrado');
      }
      
      // Desactivar otros años activos de la misma compañía
      await connection.query(
        `UPDATE fiscal_years SET status = 'closed' 
         WHERE company_id = ? AND status = 'active' AND id != ?`,
        [year.company_id, id]
      );
      
      // Activar el año seleccionado
      await connection.query(
        `UPDATE fiscal_years SET
         status = 'active',
         updated_by = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [userId, id]
      );
      
      await connection.commit();
      
      return { id, activated: true, activated_by: userId };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al activar año fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cerrar un año fiscal
   * @param {number} id - ID del año fiscal
   * @param {number} userId - ID del usuario que cierra
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async closeYear(id, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el año exista
      const [yearCheck] = await connection.query(
        `SELECT * FROM fiscal_years WHERE id = ?`,
        [id]
      );
      
      if (!yearCheck.length) {
        throw new Error(`El año fiscal con ID ${id} no existe`);
      }
      
      const year = yearCheck[0];
      
      if (year.is_closed) {
        throw new Error('El año fiscal ya está cerrado');
      }
      
      // Verificar que todos los períodos estén cerrados
      const [openPeriods] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
           AND start_date >= ? 
           AND end_date <= ? 
           AND is_closed = 0`,
        [year.company_id, year.start_date, year.end_date]
      );
      
      if (openPeriods[0].count > 0) {
        throw new Error(`Existen ${openPeriods[0].count} períodos abiertos. Todos los períodos deben estar cerrados antes del cierre del año`);
      }
      
      // Cerrar el año
      await connection.query(
        `UPDATE fiscal_years SET
         is_closed = 1,
         status = 'closed',
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
        closed_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cerrar año fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un año fiscal
   * @param {number} id - ID del año fiscal
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el año exista
      const [yearCheck] = await connection.query(
        `SELECT * FROM fiscal_years WHERE id = ?`,
        [id]
      );
      
      if (!yearCheck.length) {
        throw new Error(`El año fiscal con ID ${id} no existe`);
      }
      
      const year = yearCheck[0];
      
      // Verificar que el año no esté cerrado
      if (year.is_closed) {
        throw new Error('No se puede eliminar un año fiscal cerrado');
      }
      
      // Verificar que no tenga períodos
      const [periods] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
           AND start_date >= ? 
           AND end_date <= ?`,
        [year.company_id, year.start_date, year.end_date]
      );
      
      if (periods[0].count > 0) {
        throw new Error(`No se puede eliminar el año. Tiene ${periods[0].count} períodos asociados`);
      }
      
      // Eliminar el año
      await connection.query(
        `DELETE FROM fiscal_years WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar año fiscal ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar períodos mensuales para un año fiscal
   * @param {number} yearId - ID del año fiscal
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de períodos generados
   */
  static async generatePeriods(yearId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Obtener datos del año fiscal
      const [yearData] = await connection.query(
        `SELECT * FROM fiscal_years WHERE id = ?`,
        [yearId]
      );
      
      if (!yearData.length) {
        throw new Error(`El año fiscal con ID ${yearId} no existe`);
      }
      
      const year = yearData[0];
      const startDate = new Date(year.start_date);
      const endDate = new Date(year.end_date);
      
      // Verificar que no existan períodos
      const [existingPeriods] = await connection.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
           AND start_date >= ? 
           AND end_date <= ?`,
        [year.company_id, year.start_date, year.end_date]
      );
      
      if (existingPeriods[0].count > 0) {
        throw new Error(`Ya existen ${existingPeriods[0].count} períodos para este año fiscal`);
      }
      
      const generatedPeriods = [];
      let currentDate = new Date(startDate);
      
      // Generar períodos mensuales
      while (currentDate <= endDate) {
        const periodStart = new Date(currentDate);
        const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Asegurar que el último período no exceda la fecha de fin del año fiscal
        if (periodEnd > endDate) {
          periodEnd.setTime(endDate.getTime());
        }
        
        const [result] = await connection.query(
          `INSERT INTO fiscal_periods 
          (company_id, start_date, end_date, is_closed, created_by)
          VALUES (?, ?, ?, 0, ?)`,
          [
            year.company_id,
            periodStart.toISOString().split('T')[0],
            periodEnd.toISOString().split('T')[0],
            userId
          ]
        );
        
        generatedPeriods.push({
          id: result.insertId,
          company_id: year.company_id,
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
          is_closed: false
        });
        
        // Mover al siguiente mes
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
      
      await connection.commit();
      
      return generatedPeriods;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al generar períodos: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener resumen estadístico de un año fiscal
   * @param {number} id - ID del año fiscal
   * @returns {Promise<Object>} Resumen estadístico del año
   */
  static async getYearSummary(id) {
    try {
      const [summaryData] = await pool.query(
        `SELECT 
           fy.*,
           c.name as company_name,
           COUNT(DISTINCT fp.id) as total_periods,
           COUNT(DISTINCT CASE WHEN fp.is_closed = 1 THEN fp.id END) as closed_periods,
           COUNT(DISTINCT CASE WHEN fp.is_closed = 0 THEN fp.id END) as open_periods,
           COALESCE(SUM(av.total_debit), 0) as total_year_debits,
           COALESCE(SUM(av.total_credit), 0) as total_year_credits,
           COUNT(DISTINCT av.id) as total_vouchers,
           COUNT(DISTINCT je.id) as total_journal_entries
         FROM fiscal_years fy
         LEFT JOIN companies c ON fy.company_id = c.id
         LEFT JOIN fiscal_periods fp ON fp.company_id = fy.company_id 
           AND fp.start_date >= fy.start_date 
           AND fp.end_date <= fy.end_date
         LEFT JOIN accounting_vouchers av ON av.fiscal_period_id = fp.id
         LEFT JOIN journal_entries je ON je.fiscal_period_id = fp.id
         WHERE fy.id = ?
         GROUP BY fy.id`,
        [id]
      );
      
      return summaryData[0] || null;
    } catch (error) {
      logger.error(`Error al obtener resumen del año fiscal ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar fechas de un año fiscal
   * @param {number} companyId - ID de la compañía
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @param {number} excludeId - ID del año a excluir de la validación
   * @returns {Promise<Object>} Resultado de la validación
   */
  static async validateDates(companyId, startDate, endDate, excludeId = null) {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Validar que las fechas sean correctas
      if (new Date(startDate) >= new Date(endDate)) {
        validation.isValid = false;
        validation.errors.push('La fecha de inicio debe ser menor que la fecha de fin');
      }

      // Validar que el año tenga una duración razonable (entre 350 y 380 días)
      const daysDifference = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (daysDifference < 350) {
        validation.warnings.push('El año fiscal es muy corto (menos de 350 días)');
      } else if (daysDifference > 380) {
        validation.warnings.push('El año fiscal es muy largo (más de 380 días)');
      }

      // Verificar solapamiento con otros años fiscales
      let overlapQuery = `
        SELECT id, year_number, start_date, end_date 
        FROM fiscal_years 
        WHERE company_id = ? 
        AND ((start_date <= ? AND end_date >= ?) 
             OR (start_date <= ? AND end_date >= ?)
             OR (start_date >= ? AND end_date <= ?))
      `;
      
      let queryParams = [
        companyId,
        startDate, startDate,
        endDate, endDate,
        startDate, endDate
      ];

      if (excludeId) {
        overlapQuery += ' AND id != ?';
        queryParams.push(excludeId);
      }

      const [overlappingYears] = await pool.query(overlapQuery, queryParams);
      
      if (overlappingYears.length > 0) {
        validation.isValid = false;
        validation.errors.push(
          `Las fechas se solapan con el año fiscal ${overlappingYears[0].year_number} (${overlappingYears[0].start_date} - ${overlappingYears[0].end_date})`
        );
      }

      // Verificar si hay períodos fiscales existentes en el rango de fechas
      const [existingPeriods] = await pool.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? 
         AND ((start_date <= ? AND end_date >= ?) 
              OR (start_date <= ? AND end_date >= ?)
              OR (start_date >= ? AND end_date <= ?))`,
        [
          companyId,
          startDate, startDate,
          endDate, endDate,
          startDate, endDate
        ]
      );

      if (existingPeriods[0].count > 0) {
        validation.warnings.push(`Existen ${existingPeriods[0].count} períodos fiscales en el rango de fechas especificado`);
      }

      return validation;
    } catch (error) {
      logger.error(`Error al validar fechas del año fiscal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un año fiscal
   * @param {number} id - ID del año fiscal
   * @returns {Promise<Object>} Estadísticas del año fiscal
   */
  static async getYearStatistics(id) {
    try {
      const [stats] = await pool.query(
        `SELECT 
           fy.id,
           fy.year_number,
           fy.start_date,
           fy.end_date,
           fy.status,
           fy.is_closed,
           c.name as company_name,
           COUNT(DISTINCT fp.id) as total_periods,
           COUNT(DISTINCT CASE WHEN fp.is_closed = 1 THEN fp.id END) as closed_periods,
           COUNT(DISTINCT CASE WHEN fp.is_closed = 0 THEN fp.id END) as open_periods,
           COUNT(DISTINCT av.id) as total_vouchers,
           COUNT(DISTINCT CASE WHEN av.status = 'DRAFT' THEN av.id END) as draft_vouchers,
           COUNT(DISTINCT CASE WHEN av.status = 'APPROVED' THEN av.id END) as approved_vouchers,
           COUNT(DISTINCT je.id) as total_journal_entries,
           COUNT(DISTINCT av.third_party_id) as unique_third_parties,
           COALESCE(SUM(av.total_debit), 0) as total_debits,
           COALESCE(SUM(av.total_credit), 0) as total_credits,
           COALESCE(SUM(av.total_debit), 0) - COALESCE(SUM(av.total_credit), 0) as balance,
           DATEDIFF(fy.end_date, fy.start_date) + 1 as year_days,
           CASE 
             WHEN fy.end_date < CURDATE() AND fy.is_closed = 0 THEN 'Vencido'
             WHEN fy.start_date <= CURDATE() AND fy.end_date >= CURDATE() THEN 'Actual'
             WHEN fy.start_date > CURDATE() THEN 'Futuro'
             WHEN fy.is_closed = 1 THEN 'Cerrado'
             ELSE 'Otro'
           END as status_display
         FROM fiscal_years fy
         LEFT JOIN companies c ON fy.company_id = c.id
         LEFT JOIN fiscal_periods fp ON fp.company_id = fy.company_id 
           AND fp.start_date >= fy.start_date 
           AND fp.end_date <= fy.end_date
         LEFT JOIN accounting_vouchers av ON av.fiscal_period_id = fp.id
         LEFT JOIN journal_entries je ON je.fiscal_period_id = fp.id
         WHERE fy.id = ?
         GROUP BY fy.id`,
        [id]
      );
      
      const statistics = stats[0] || {
        total_periods: 0,
        closed_periods: 0,
        open_periods: 0,
        total_vouchers: 0,
        draft_vouchers: 0,
        approved_vouchers: 0,
        total_journal_entries: 0,
        unique_third_parties: 0,
        total_debits: 0,
        total_credits: 0,
        balance: 0,
        year_days: 0,
        status_display: 'Desconocido'
      };

      // Calcular porcentajes
      if (statistics.total_periods > 0) {
        statistics.closed_periods_percentage = Math.round((statistics.closed_periods / statistics.total_periods) * 100);
        statistics.open_periods_percentage = Math.round((statistics.open_periods / statistics.total_periods) * 100);
      } else {
        statistics.closed_periods_percentage = 0;
        statistics.open_periods_percentage = 0;
      }

      if (statistics.total_vouchers > 0) {
        statistics.approved_vouchers_percentage = Math.round((statistics.approved_vouchers / statistics.total_vouchers) * 100);
        statistics.draft_vouchers_percentage = Math.round((statistics.draft_vouchers / statistics.total_vouchers) * 100);
      } else {
        statistics.approved_vouchers_percentage = 0;
        statistics.draft_vouchers_percentage = 0;
      }

      return statistics;
    } catch (error) {
      logger.error(`Error al obtener estadísticas del año fiscal ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si se puede crear un nuevo año fiscal
   * @param {number} companyId - ID de la compañía
   * @returns {Promise<boolean>} True si se puede crear, false si no
   */
  static async canCreateNew(companyId) {
    try {
      // Verificar si hay un año fiscal activo
      const [activeYear] = await pool.query(
        `SELECT id FROM fiscal_years 
         WHERE company_id = ? AND status = 'active'`,
        [companyId]
      );

      // Si hay un año activo, verificar si está cerrado
      if (activeYear.length > 0) {
        const [yearDetails] = await pool.query(
          `SELECT is_closed FROM fiscal_years WHERE id = ?`,
          [activeYear[0].id]
        );

        // Si el año activo no está cerrado, no se puede crear uno nuevo
        if (!yearDetails[0].is_closed) {
          return false;
        }
      }

      // Verificar que no haya años fiscales sin cerrar
      const [openYears] = await pool.query(
        `SELECT COUNT(*) as count FROM fiscal_years 
         WHERE company_id = ? AND is_closed = 0`,
        [companyId]
      );

      if (openYears[0].count > 0) {
        return false;
      }

      // Verificar que no haya períodos fiscales sin cerrar
      const [openPeriods] = await pool.query(
        `SELECT COUNT(*) as count FROM fiscal_periods 
         WHERE company_id = ? AND is_closed = 0`,
        [companyId]
      );

      if (openPeriods[0].count > 0) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error al verificar si se puede crear un nuevo año fiscal: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FiscalYear; 