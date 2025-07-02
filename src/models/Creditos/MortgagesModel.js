/**
 * Modelo para gestionar los créditos hipotecarios principales del sistema de créditos
 * @module models/Creditos/MortgagesModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los créditos hipotecarios principales en el sistema
 */
class Mortgages {
  /**
   * Obtener todos los créditos hipotecarios con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de créditos hipotecarios
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT m.*, 
               ct.name as credit_type_name,
               ct.code as credit_type_code,
               ct.payment_frequency as type_payment_frequency,
               qc.name as quota_configuration_name,
               qc.quota_type,
               p.property_code,
               p.address as property_address,
               p.city as property_city,
               p.state as property_state,
               p.property_value,
               u1.username as created_by_name,
               u2.username as updated_by_name,
               COUNT(DISTINCT md.id) as debtors_count,
               COUNT(DISTINCT mc.id) as creditors_count,
               COUNT(DISTINCT doc.id) as documents_count
        FROM Cr_mortgages m
        INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
        INNER JOIN Cr_quota_configurations qc ON m.quota_configuration_id = qc.id
        INNER JOIN Cr_properties p ON m.property_id = p.id
        LEFT JOIN users u1 ON m.created_by = u1.id
        LEFT JOIN users u2 ON m.updated_by = u2.id
        LEFT JOIN Cr_mortgage_debtors md ON m.id = md.mortgage_id
        LEFT JOIN Cr_mortgage_creditors mc ON m.id = mc.mortgage_id
        LEFT JOIN Cr_mortgage_documents doc ON m.id = doc.mortgage_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.credit_number) {
        conditions.push("m.credit_number LIKE ?");
        queryParams.push(`%${filters.credit_number}%`);
      }

      if (filters.credit_type_id) {
        conditions.push("m.credit_type_id = ?");
        queryParams.push(parseInt(filters.credit_type_id));
      }

      if (filters.quota_configuration_id) {
        conditions.push("m.quota_configuration_id = ?");
        queryParams.push(parseInt(filters.quota_configuration_id));
      }

      if (filters.property_id) {
        conditions.push("m.property_id = ?");
        queryParams.push(parseInt(filters.property_id));
      }

      if (filters.property_code) {
        conditions.push("p.property_code LIKE ?");
        queryParams.push(`%${filters.property_code}%`);
      }

      if (filters.property_city) {
        conditions.push("p.city LIKE ?");
        queryParams.push(`%${filters.property_city}%`);
      }

      if (filters.status) {
        conditions.push("m.status = ?");
        queryParams.push(filters.status);
      }

      if (filters.is_active !== undefined) {
        conditions.push("m.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.min_principal_amount) {
        conditions.push("m.principal_amount >= ?");
        queryParams.push(parseFloat(filters.min_principal_amount));
      }

      if (filters.max_principal_amount) {
        conditions.push("m.principal_amount <= ?");
        queryParams.push(parseFloat(filters.max_principal_amount));
      }

      if (filters.min_interest_rate) {
        conditions.push("m.interest_rate >= ?");
        queryParams.push(parseFloat(filters.min_interest_rate));
      }

      if (filters.max_interest_rate) {
        conditions.push("m.interest_rate <= ?");
        queryParams.push(parseFloat(filters.max_interest_rate));
      }

      if (filters.start_date_from) {
        conditions.push("m.start_date >= ?");
        queryParams.push(filters.start_date_from);
      }

      if (filters.start_date_to) {
        conditions.push("m.start_date <= ?");
        queryParams.push(filters.start_date_to);
      }

      if (filters.end_date_from) {
        conditions.push("m.end_date >= ?");
        queryParams.push(filters.end_date_from);
      }

      if (filters.end_date_to) {
        conditions.push("m.end_date <= ?");
        queryParams.push(filters.end_date_to);
      }

      if (filters.payment_frequency) {
        conditions.push("m.payment_frequency = ?");
        queryParams.push(filters.payment_frequency);
      }

      if (filters.overdue_payments !== undefined) {
        if (filters.overdue_payments) {
          conditions.push("m.next_payment_date < CURDATE()");
        } else {
          conditions.push("(m.next_payment_date IS NULL OR m.next_payment_date >= CURDATE())");
        }
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY m.id ORDER BY m.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener créditos hipotecarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un crédito hipotecario por ID
   * @param {number} id - ID del crédito hipotecario
   * @returns {Promise<Object>} Crédito hipotecario
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
                ct.name as credit_type_name,
                ct.code as credit_type_code,
                ct.description as credit_type_description,
                ct.payment_frequency as type_payment_frequency,
                ct.interest_calculation_method,
                ct.allows_early_payment,
                ct.allows_partial_payment,
                ct.requires_guarantee,
                qc.name as quota_configuration_name,
                qc.quota_type,
                qc.description as quota_configuration_description,
                qc.management_fee_percentage,
                qc.management_fee_amount,
                qc.minimum_payment_percentage,
                qc.grace_period_days,
                qc.late_payment_penalty_percentage,
                p.property_code,
                p.property_type,
                p.address as property_address,
                p.city as property_city,
                p.state as property_state,
                p.property_value,
                p.area_sqm,
                p.registration_number,
                u1.username as created_by_name,
                u2.username as updated_by_name,
                COUNT(DISTINCT md.id) as debtors_count,
                COUNT(DISTINCT mc.id) as creditors_count,
                COUNT(DISTINCT doc.id) as documents_count
         FROM Cr_mortgages m
         INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
         INNER JOIN Cr_quota_configurations qc ON m.quota_configuration_id = qc.id
         INNER JOIN Cr_properties p ON m.property_id = p.id
         LEFT JOIN users u1 ON m.created_by = u1.id
         LEFT JOIN users u2 ON m.updated_by = u2.id
         LEFT JOIN Cr_mortgage_debtors md ON m.id = md.mortgage_id
         LEFT JOIN Cr_mortgage_creditors mc ON m.id = mc.mortgage_id
         LEFT JOIN Cr_mortgage_documents doc ON m.id = doc.mortgage_id
         WHERE m.id = ?
         GROUP BY m.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener crédito hipotecario con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un crédito hipotecario por número de crédito
   * @param {string} creditNumber - Número del crédito
   * @returns {Promise<Object>} Crédito hipotecario
   */
  static async getByCreditNumber(creditNumber) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
                ct.name as credit_type_name,
                qc.name as quota_configuration_name,
                p.property_code,
                p.property_address,
                u1.username as created_by_name
         FROM Cr_mortgages m
         INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
         INNER JOIN Cr_quota_configurations qc ON m.quota_configuration_id = qc.id
         INNER JOIN Cr_properties p ON m.property_id = p.id
         LEFT JOIN users u1 ON m.created_by = u1.id
         WHERE m.credit_number = ?`,
        [creditNumber]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener crédito hipotecario con número ${creditNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener créditos hipotecarios por propiedad
   * @param {number} propertyId - ID de la propiedad
   * @returns {Promise<Array>} Lista de créditos de la propiedad
   */
  static async getByPropertyId(propertyId) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
                ct.name as credit_type_name,
                qc.name as quota_configuration_name,
                u1.username as created_by_name
         FROM Cr_mortgages m
         INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
         INNER JOIN Cr_quota_configurations qc ON m.quota_configuration_id = qc.id
         LEFT JOIN users u1 ON m.created_by = u1.id
         WHERE m.property_id = ?
         ORDER BY m.created_at DESC`,
        [propertyId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener créditos por propiedad ${propertyId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener solo créditos hipotecarios activos
   * @returns {Promise<Array>} Lista de créditos activos
   */
  static async getActive() {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
                ct.name as credit_type_name,
                qc.name as quota_configuration_name,
                p.property_code,
                p.property_city,
                u1.username as created_by_name
         FROM Cr_mortgages m
         INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
         INNER JOIN Cr_quota_configurations qc ON m.quota_configuration_id = qc.id
         INNER JOIN Cr_properties p ON m.property_id = p.id
         LEFT JOIN users u1 ON m.created_by = u1.id
         WHERE m.status = 'active' AND m.is_active = TRUE
         ORDER BY m.next_payment_date ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener créditos activos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener créditos con pagos vencidos
   * @returns {Promise<Array>} Lista de créditos con pagos vencidos
   */
  static async getOverduePayments() {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
                ct.name as credit_type_name,
                p.property_code,
                p.property_city,
                DATEDIFF(CURDATE(), m.next_payment_date) as days_overdue
         FROM Cr_mortgages m
         INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
         INNER JOIN Cr_properties p ON m.property_id = p.id
         WHERE m.status = 'active' 
         AND m.next_payment_date < CURDATE()
         AND m.is_active = TRUE
         ORDER BY days_overdue DESC, m.next_payment_date ASC`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener créditos con pagos vencidos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo crédito hipotecario
   * @param {Object} mortgageData - Datos del crédito hipotecario
   * @returns {Promise<Object>} Crédito hipotecario creado
   */
  static async create(mortgageData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo de crédito exista y esté activo
      const [existingCreditType] = await connection.query(
        `SELECT id, name FROM Cr_credit_types WHERE id = ? AND is_active = TRUE`,
        [mortgageData.credit_type_id]
      );
      
      if (existingCreditType.length === 0) {
        throw new Error(`El tipo de crédito con ID ${mortgageData.credit_type_id} no existe o no está activo`);
      }

      // Verificar que la configuración de cuotas exista y esté activa
      const [existingQuotaConfig] = await connection.query(
        `SELECT id, name FROM Cr_quota_configurations WHERE id = ? AND is_active = TRUE`,
        [mortgageData.quota_configuration_id]
      );
      
      if (existingQuotaConfig.length === 0) {
        throw new Error(`La configuración de cuotas con ID ${mortgageData.quota_configuration_id} no existe o no está activa`);
      }

      // Verificar que la propiedad exista y esté activa
      const [existingProperty] = await connection.query(
        `SELECT id, property_code FROM Cr_properties WHERE id = ? AND is_active = TRUE`,
        [mortgageData.property_id]
      );
      
      if (existingProperty.length === 0) {
        throw new Error(`La propiedad con ID ${mortgageData.property_id} no existe o no está activa`);
      }

      // Verificar que el número de crédito no exista
      const [existingCreditNumber] = await connection.query(
        `SELECT id FROM Cr_mortgages WHERE credit_number = ?`,
        [mortgageData.credit_number]
      );
      
      if (existingCreditNumber.length > 0) {
        throw new Error(`Ya existe un crédito con el número "${mortgageData.credit_number}"`);
      }

      // Verificar que la propiedad no tenga otro crédito activo
      const [activeMortgage] = await connection.query(
        `SELECT id, credit_number FROM Cr_mortgages 
         WHERE property_id = ? AND status IN ('active', 'suspended') AND is_active = TRUE`,
        [mortgageData.property_id]
      );
      
      if (activeMortgage.length > 0) {
        throw new Error(`La propiedad "${existingProperty[0].property_code}" ya tiene un crédito activo: ${activeMortgage[0].credit_number}`);
      }

      // Calcular fecha de próximo pago
      const startDate = new Date(mortgageData.start_date);
      let nextPaymentDate = new Date(startDate);
      nextPaymentDate.setDate(mortgageData.payment_day);
      
      // Si el día ya pasó en el mes actual, mover al siguiente mes
      if (nextPaymentDate <= startDate) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      
      // Insertar el crédito hipotecario
      const [result] = await connection.query(
        `INSERT INTO Cr_mortgages 
        (credit_number, credit_type_id, quota_configuration_id, property_id,
         principal_amount, interest_rate, interest_rate_type, start_date, end_date,
         payment_day, payment_frequency, current_balance, original_balance,
         total_paid_amount, total_interest_paid, total_principal_paid, total_management_fees_paid,
         next_payment_date, last_payment_date, status, default_date, default_reason,
         grace_period_end_date, notes, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mortgageData.credit_number,
          mortgageData.credit_type_id,
          mortgageData.quota_configuration_id,
          mortgageData.property_id,
          mortgageData.principal_amount,
          mortgageData.interest_rate,
          mortgageData.interest_rate_type || 'effective',
          mortgageData.start_date,
          mortgageData.end_date,
          mortgageData.payment_day,
          mortgageData.payment_frequency || 'monthly',
          mortgageData.principal_amount, // current_balance = principal_amount initially
          mortgageData.principal_amount, // original_balance = principal_amount
          0.00, // total_paid_amount
          0.00, // total_interest_paid
          0.00, // total_principal_paid
          0.00, // total_management_fees_paid
          nextPaymentDate.toISOString().split('T')[0], // next_payment_date
          null, // last_payment_date
          mortgageData.status || 'active',
          mortgageData.default_date || null,
          mortgageData.default_reason || null,
          mortgageData.grace_period_end_date || null,
          mortgageData.notes || null,
          mortgageData.is_active !== false,
          mortgageData.created_by
        ]
      );
      
      const mortgageId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdMortgage = await this.getById(mortgageId);
      
      return createdMortgage;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear crédito hipotecario: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un crédito hipotecario existente
   * @param {number} id - ID del crédito hipotecario
   * @param {Object} mortgageData - Datos actualizados del crédito
   * @returns {Promise<Object>} Crédito hipotecario actualizado
   */
  static async update(id, mortgageData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el crédito hipotecario exista
      const [existingMortgage] = await connection.query(
        `SELECT id, credit_number FROM Cr_mortgages WHERE id = ?`,
        [id]
      );
      
      if (existingMortgage.length === 0) {
        throw new Error(`El crédito hipotecario con ID ${id} no existe`);
      }

      // Verificar que el número de crédito no esté en uso por otro crédito
      if (mortgageData.credit_number) {
        const [existingCreditNumber] = await connection.query(
          `SELECT id FROM Cr_mortgages WHERE credit_number = ? AND id != ?`,
          [mortgageData.credit_number, id]
        );
        
        if (existingCreditNumber.length > 0) {
          throw new Error(`Ya existe otro crédito con el número "${mortgageData.credit_number}"`);
        }
      }
      
      // Actualizar el crédito hipotecario
      await connection.query(
        `UPDATE Cr_mortgages SET
         credit_number = ?,
         principal_amount = ?,
         interest_rate = ?,
         interest_rate_type = ?,
         start_date = ?,
         end_date = ?,
         payment_day = ?,
         payment_frequency = ?,
         current_balance = ?,
         total_paid_amount = ?,
         total_interest_paid = ?,
         total_principal_paid = ?,
         total_management_fees_paid = ?,
         next_payment_date = ?,
         last_payment_date = ?,
         status = ?,
         default_date = ?,
         default_reason = ?,
         grace_period_end_date = ?,
         notes = ?,
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          mortgageData.credit_number,
          mortgageData.principal_amount,
          mortgageData.interest_rate,
          mortgageData.interest_rate_type || 'effective',
          mortgageData.start_date,
          mortgageData.end_date,
          mortgageData.payment_day,
          mortgageData.payment_frequency || 'monthly',
          mortgageData.current_balance,
          mortgageData.total_paid_amount || 0.00,
          mortgageData.total_interest_paid || 0.00,
          mortgageData.total_principal_paid || 0.00,
          mortgageData.total_management_fees_paid || 0.00,
          mortgageData.next_payment_date,
          mortgageData.last_payment_date,
          mortgageData.status || 'active',
          mortgageData.default_date,
          mortgageData.default_reason,
          mortgageData.grace_period_end_date,
          mortgageData.notes,
          mortgageData.is_active !== false,
          mortgageData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedMortgage = await this.getById(id);
      
      return updatedMortgage;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar crédito hipotecario ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar estado de un crédito hipotecario
   * @param {number} id - ID del crédito hipotecario
   * @param {string} newStatus - Nuevo estado
   * @param {number} userId - ID del usuario que realiza el cambio
   * @param {string} reason - Razón del cambio (opcional)
   * @returns {Promise<Object>} Crédito hipotecario actualizado
   */
  static async changeStatus(id, newStatus, userId, reason = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el crédito hipotecario exista
      const [existingMortgage] = await connection.query(
        `SELECT id, credit_number, status FROM Cr_mortgages WHERE id = ?`,
        [id]
      );
      
      if (existingMortgage.length === 0) {
        throw new Error(`El crédito hipotecario con ID ${id} no existe`);
      }

      // Validar estados permitidos
      const validStatuses = ['active', 'paid_off', 'defaulted', 'cancelled', 'suspended'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Estado inválido: ${newStatus}. Estados permitidos: ${validStatuses.join(', ')}`);
      }

      // Actualizar el estado
      const updateData = {
        status: newStatus,
        updated_at: 'NOW()',
        updated_by: userId
      };

      // Si se marca como incumplimiento, establecer fecha y razón
      if (newStatus === 'defaulted') {
        updateData.default_date = new Date().toISOString().split('T')[0];
        updateData.default_reason = reason || 'Incumplimiento de pagos';
      }

      // Si se marca como cancelado, limpiar fechas de incumplimiento
      if (newStatus === 'cancelled') {
        updateData.default_date = null;
        updateData.default_reason = null;
      }

      await connection.query(
        `UPDATE Cr_mortgages SET
         status = ?,
         default_date = ?,
         default_reason = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [newStatus, updateData.default_date || null, updateData.default_reason, userId, id]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedMortgage = await this.getById(id);
      
      return updatedMortgage;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al cambiar estado del crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar si un número de crédito está disponible
   * @param {string} creditNumber - Número de crédito a verificar
   * @param {number} excludeId - ID a excluir de la verificación (para actualizaciones)
   * @returns {Promise<boolean>} True si está disponible, False si ya existe
   */
  static async isCreditNumberAvailable(creditNumber, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM Cr_mortgages WHERE credit_number = ?`;
      let params = [creditNumber];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      const [rows] = await pool.query(query, params);
      return rows[0].count === 0;
    } catch (error) {
      logger.error(`Error al verificar disponibilidad del número de crédito ${creditNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de créditos hipotecarios
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_mortgages,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_mortgages,
          SUM(CASE WHEN status = 'paid_off' THEN 1 ELSE 0 END) as paid_off_mortgages,
          SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_mortgages,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_mortgages,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_mortgages,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as system_active_mortgages,
          COUNT(DISTINCT property_id) as properties_with_mortgages,
          COUNT(DISTINCT credit_type_id) as different_credit_types,
          SUM(principal_amount) as total_principal_amount,
          SUM(current_balance) as total_current_balance,
          SUM(total_paid_amount) as total_paid_amount,
          AVG(interest_rate) as avg_interest_rate,
          MIN(interest_rate) as min_interest_rate,
          MAX(interest_rate) as max_interest_rate
        FROM Cr_mortgages
      `);

      const [byStatus] = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(principal_amount) as total_principal,
          SUM(current_balance) as total_balance,
          AVG(interest_rate) as avg_interest_rate,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Cr_mortgages), 2) as percentage
        FROM Cr_mortgages
        GROUP BY status
        ORDER BY count DESC
      `);

      const [byCreditType] = await pool.query(`
        SELECT 
          ct.name as credit_type_name,
          COUNT(m.id) as mortgages_count,
          SUM(m.principal_amount) as total_principal,
          SUM(m.current_balance) as total_balance,
          AVG(m.interest_rate) as avg_interest_rate
        FROM Cr_credit_types ct
        LEFT JOIN Cr_mortgages m ON ct.id = m.credit_type_id
        GROUP BY ct.id, ct.name
        ORDER BY mortgages_count DESC
      `);

      const [overduePayments] = await pool.query(`
        SELECT 
          COUNT(*) as overdue_count,
          SUM(current_balance) as overdue_balance,
          AVG(DATEDIFF(CURDATE(), next_payment_date)) as avg_days_overdue
        FROM Cr_mortgages
        WHERE status = 'active' AND next_payment_date < CURDATE() AND is_active = TRUE
      `);

      const [paymentFrequency] = await pool.query(`
        SELECT 
          payment_frequency,
          COUNT(*) as count,
          SUM(principal_amount) as total_principal
        FROM Cr_mortgages
        WHERE is_active = TRUE
        GROUP BY payment_frequency
        ORDER BY count DESC
      `);

      return {
        general: generalStats[0],
        by_status: byStatus,
        by_credit_type: byCreditType,
        overdue_payments: overduePayments[0],
        payment_frequency: paymentFrequency
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de créditos hipotecarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener opciones para formularios
   * @returns {Promise<Object>} Opciones estructuradas para formularios
   */
  static async getFormOptions() {
    try {
      const [creditTypes] = await pool.query(`
        SELECT id, name, code, description, payment_frequency
        FROM Cr_credit_types 
        WHERE is_active = TRUE 
        ORDER BY name ASC
      `);

      const [quotaConfigurations] = await pool.query(`
        SELECT qc.id, qc.name, qc.quota_type, qc.description,
               ct.name as credit_type_name
        FROM Cr_quota_configurations qc
        INNER JOIN Cr_credit_types ct ON qc.credit_type_id = ct.id
        WHERE qc.is_active = TRUE AND ct.is_active = TRUE
        ORDER BY ct.name ASC, qc.name ASC
      `);

      const [properties] = await pool.query(`
        SELECT p.id, p.property_code, p.address, p.city, p.state, p.property_value
        FROM Cr_properties p
        LEFT JOIN Cr_mortgages m ON p.id = m.property_id AND m.status IN ('active', 'suspended')
        WHERE p.is_active = TRUE AND m.id IS NULL
        ORDER BY p.property_code ASC
      `);
      
      return {
        credit_types: creditTypes.map(ct => ({
          value: ct.id,
          label: ct.name,
          code: ct.code,
          description: ct.description,
          payment_frequency: ct.payment_frequency
        })),
        quota_configurations: quotaConfigurations.map(qc => ({
          value: qc.id,
          label: qc.name,
          quota_type: qc.quota_type,
          description: qc.description,
          credit_type_name: qc.credit_type_name
        })),
        available_properties: properties.map(p => ({
          value: p.id,
          label: `${p.property_code} - ${p.address}`,
          property_code: p.property_code,
          address: p.address,
          city: p.city,
          state: p.state,
          property_value: p.property_value
        })),
        statuses: [
          { value: 'active', label: 'Activo' },
          { value: 'paid_off', label: 'Pagado' },
          { value: 'defaulted', label: 'En Mora' },
          { value: 'cancelled', label: 'Cancelado' },
          { value: 'suspended', label: 'Suspendido' }
        ],
        payment_frequencies: [
          { value: 'monthly', label: 'Mensual' },
          { value: 'quarterly', label: 'Trimestral' },
          { value: 'semiannual', label: 'Semestral' },
          { value: 'annual', label: 'Anual' }
        ],
        interest_rate_types: [
          { value: 'nominal', label: 'Nominal' },
          { value: 'effective', label: 'Efectiva' }
        ]
      };
    } catch (error) {
      logger.error(`Error al obtener opciones para formularios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Mortgages;