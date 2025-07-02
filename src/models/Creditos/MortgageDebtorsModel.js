/**
 * Modelo para gestionar los deudores de créditos hipotecarios del sistema de créditos
 * @module models/Creditos/MortgageDebtorsModel
 */

const { pool } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Clase para gestionar los deudores de créditos hipotecarios en el sistema
 */
class MortgageDebtors {
  /**
   * Obtener todos los deudores de créditos con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de deudores de créditos
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT md.*, 
               m.credit_number,
               m.status as mortgage_status,
               m.principal_amount,
               m.current_balance,
               tp.identification_type as document_type,
               tp.identification_number as document_number,
               tp.name as debtor_name,
               tp.phone,
               tp.email,
               u.username as created_by_name
        FROM Cr_mortgage_debtors md
        INNER JOIN Cr_mortgages m ON md.mortgage_id = m.id
        INNER JOIN third_parties tp ON md.third_party_id = tp.id
        LEFT JOIN users u ON md.created_by = u.id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.mortgage_id) {
        conditions.push("md.mortgage_id = ?");
        queryParams.push(parseInt(filters.mortgage_id));
      }

      if (filters.third_party_id) {
        conditions.push("md.third_party_id = ?");
        queryParams.push(parseInt(filters.third_party_id));
      }

      if (filters.credit_number) {
        conditions.push("m.credit_number LIKE ?");
        queryParams.push(`%${filters.credit_number}%`);
      }

      if (filters.debtor_type) {
        conditions.push("md.debtor_type = ?");
        queryParams.push(filters.debtor_type);
      }

      if (filters.is_primary_debtor !== undefined) {
        conditions.push("md.is_primary_debtor = ?");
        queryParams.push(filters.is_primary_debtor);
      }

      if (filters.employment_status) {
        conditions.push("md.employment_status = ?");
        queryParams.push(filters.employment_status);
      }

      if (filters.document_number) {
        conditions.push("tp.identification_number LIKE ?");
        queryParams.push(`%${filters.document_number}%`);
      }

      if (filters.debtor_name) {
        conditions.push("tp.name LIKE ?");
        queryParams.push(`%${filters.debtor_name}%`);
      }

      if (filters.min_monthly_income) {
        conditions.push("md.monthly_income >= ?");
        queryParams.push(parseFloat(filters.min_monthly_income));
      }

      if (filters.max_monthly_income) {
        conditions.push("md.monthly_income <= ?");
        queryParams.push(parseFloat(filters.max_monthly_income));
      }

      if (filters.min_credit_score) {
        conditions.push("md.credit_score >= ?");
        queryParams.push(parseInt(filters.min_credit_score));
      }

      if (filters.max_credit_score) {
        conditions.push("md.credit_score <= ?");
        queryParams.push(parseInt(filters.max_credit_score));
      }

      if (filters.mortgage_status) {
        conditions.push("m.status = ?");
        queryParams.push(filters.mortgage_status);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY md.created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener deudores de créditos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un deudor de crédito por ID
   * @param {number} id - ID del deudor de crédito
   * @returns {Promise<Object>} Deudor de crédito
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                m.credit_number,
                m.status as mortgage_status,
                m.principal_amount,
                m.current_balance,
                m.interest_rate,
                m.start_date,
                m.end_date,
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as debtor_name,
                tp.phone,
                tp.email,
                tp.address,
                tp.city,
                u.username as created_by_name
         FROM Cr_mortgage_debtors md
         INNER JOIN Cr_mortgages m ON md.mortgage_id = m.id
         INNER JOIN third_parties tp ON md.third_party_id = tp.id
         LEFT JOIN users u ON md.created_by = u.id
         WHERE md.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener deudor de crédito con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener deudores de un crédito específico
   * @param {number} mortgageId - ID del crédito hipotecario
   * @returns {Promise<Array>} Lista de deudores del crédito
   */
  static async getByMortgageId(mortgageId) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as debtor_name,
                tp.phone,
                tp.email,
                u.username as created_by_name
         FROM Cr_mortgage_debtors md
         INNER JOIN third_parties tp ON md.third_party_id = tp.id
         LEFT JOIN users u ON md.created_by = u.id
         WHERE md.mortgage_id = ?
         ORDER BY md.is_primary_debtor DESC, md.responsibility_percentage DESC`,
        [mortgageId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener deudores por crédito ${mortgageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener deudores por tercero
   * @param {number} thirdPartyId - ID del tercero
   * @returns {Promise<Array>} Lista de créditos donde es deudor
   */
  static async getByThirdPartyId(thirdPartyId) {
    try {
      const [rows] = await pool.query(
        `SELECT md.*, 
                m.credit_number,
                m.status as mortgage_status,
                m.principal_amount,
                m.current_balance,
                m.start_date,
                u.username as created_by_name
         FROM Cr_mortgage_debtors md
         INNER JOIN Cr_mortgages m ON md.mortgage_id = m.id
         LEFT JOIN users u ON md.created_by = u.id
         WHERE md.third_party_id = ?
         ORDER BY md.created_at DESC`,
        [thirdPartyId]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener créditos por tercero ${thirdPartyId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo deudor de crédito
   * @param {Object} debtorData - Datos del deudor de crédito
   * @returns {Promise<Object>} Deudor de crédito creado
   */
  static async create(debtorData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el crédito hipotecario exista
      const [existingMortgage] = await connection.query(
        `SELECT id, credit_number, status FROM Cr_mortgages WHERE id = ?`,
        [debtorData.mortgage_id]
      );
      
      if (existingMortgage.length === 0) {
        throw new Error(`El crédito hipotecario con ID ${debtorData.mortgage_id} no existe`);
      }

      // Verificar que el tercero exista
      const [existingThirdParty] = await connection.query(
        `SELECT id, identification_number, name FROM third_parties WHERE id = ?`,
        [debtorData.third_party_id]
      );
      
      if (existingThirdParty.length === 0) {
        throw new Error(`El tercero con ID ${debtorData.third_party_id} no existe`);
      }

      // Verificar que no exista ya esta relación
      const [existingDebtor] = await connection.query(
        `SELECT id FROM Cr_mortgage_debtors WHERE mortgage_id = ? AND third_party_id = ?`,
        [debtorData.mortgage_id, debtorData.third_party_id]
      );
      
      if (existingDebtor.length > 0) {
        throw new Error(`El tercero "${existingThirdParty[0].name}" ya es deudor del crédito ${existingMortgage[0].credit_number}`);
      }

      // Si se marca como deudor principal, verificar que no haya otro
      if (debtorData.is_primary_debtor) {
        const [existingPrimary] = await connection.query(
          `SELECT id FROM Cr_mortgage_debtors WHERE mortgage_id = ? AND is_primary_debtor = TRUE`,
          [debtorData.mortgage_id]
        );
        
        if (existingPrimary.length > 0) {
          throw new Error(`El crédito ${existingMortgage[0].credit_number} ya tiene un deudor principal`);
        }
      }

      // Validar que los porcentajes de responsabilidad no excedan 100%
      const [currentPercentages] = await connection.query(
        `SELECT COALESCE(SUM(responsibility_percentage), 0) as total_percentage 
         FROM Cr_mortgage_debtors 
         WHERE mortgage_id = ?`,
        [debtorData.mortgage_id]
      );

      const newTotalPercentage = parseFloat(currentPercentages[0].total_percentage) + 
                                parseFloat(debtorData.responsibility_percentage || 100);

      if (newTotalPercentage > 100) {
        throw new Error(`El porcentaje total de responsabilidad excedería 100%. Total actual: ${currentPercentages[0].total_percentage}%, nuevo: ${debtorData.responsibility_percentage}%`);
      }
      
      // Insertar el deudor de crédito
      const [result] = await connection.query(
        `INSERT INTO Cr_mortgage_debtors 
        (mortgage_id, third_party_id, debtor_type, responsibility_percentage, is_primary_debtor,
         monthly_income, employment_status, employer_name, employment_start_date, 
         credit_score, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          debtorData.mortgage_id,
          debtorData.third_party_id,
          debtorData.debtor_type || 'primary',
          debtorData.responsibility_percentage || 100.00,
          debtorData.is_primary_debtor || false,
          debtorData.monthly_income || null,
          debtorData.employment_status || null,
          debtorData.employer_name || null,
          debtorData.employment_start_date || null,
          debtorData.credit_score || null,
          debtorData.notes || null,
          debtorData.created_by
        ]
      );
      
      const debtorId = result.insertId;
      
      await connection.commit();
      
      // Obtener el registro creado completo
      const createdDebtor = await this.getById(debtorId);
      
      return createdDebtor;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear deudor de crédito: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un deudor de crédito existente
   * @param {number} id - ID del deudor de crédito
   * @param {Object} debtorData - Datos actualizados del deudor
   * @returns {Promise<Object>} Deudor de crédito actualizado
   */
  static async update(id, debtorData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el deudor de crédito exista
      const [existingDebtor] = await connection.query(
        `SELECT md.*, m.credit_number 
         FROM Cr_mortgage_debtors md
         INNER JOIN Cr_mortgages m ON md.mortgage_id = m.id
         WHERE md.id = ?`,
        [id]
      );
      
      if (existingDebtor.length === 0) {
        throw new Error(`El deudor de crédito con ID ${id} no existe`);
      }

      // Si se quiere cambiar el estado de deudor principal
      if (debtorData.is_primary_debtor !== undefined) {
        if (debtorData.is_primary_debtor && !existingDebtor[0].is_primary_debtor) {
          // Verificar que no haya otro deudor principal
          const [existingPrimary] = await connection.query(
            `SELECT id FROM Cr_mortgage_debtors 
             WHERE mortgage_id = ? AND is_primary_debtor = TRUE AND id != ?`,
            [existingDebtor[0].mortgage_id, id]
          );
          
          if (existingPrimary.length > 0) {
            throw new Error(`El crédito ${existingDebtor[0].credit_number} ya tiene otro deudor principal`);
          }
        }
      }

      // Validar porcentajes de responsabilidad si se está actualizando
      if (debtorData.responsibility_percentage !== undefined) {
        const [currentPercentages] = await connection.query(
          `SELECT COALESCE(SUM(responsibility_percentage), 0) as total_percentage 
           FROM Cr_mortgage_debtors 
           WHERE mortgage_id = ? AND id != ?`,
          [existingDebtor[0].mortgage_id, id]
        );

        const newTotalPercentage = parseFloat(currentPercentages[0].total_percentage) + 
                                  parseFloat(debtorData.responsibility_percentage);

        if (newTotalPercentage > 100) {
          throw new Error(`El porcentaje total de responsabilidad excedería 100%. Total sin este deudor: ${currentPercentages[0].total_percentage}%, nuevo: ${debtorData.responsibility_percentage}%`);
        }
      }
      
      // Actualizar el deudor de crédito
      await connection.query(
        `UPDATE Cr_mortgage_debtors SET
         debtor_type = ?,
         responsibility_percentage = ?,
         is_primary_debtor = ?,
         monthly_income = ?,
         employment_status = ?,
         employer_name = ?,
         employment_start_date = ?,
         credit_score = ?,
         notes = ?
         WHERE id = ?`,
        [
          debtorData.debtor_type || existingDebtor[0].debtor_type,
          debtorData.responsibility_percentage || existingDebtor[0].responsibility_percentage,
          debtorData.is_primary_debtor !== undefined ? debtorData.is_primary_debtor : existingDebtor[0].is_primary_debtor,
          debtorData.monthly_income || existingDebtor[0].monthly_income,
          debtorData.employment_status || existingDebtor[0].employment_status,
          debtorData.employer_name || existingDebtor[0].employer_name,
          debtorData.employment_start_date || existingDebtor[0].employment_start_date,
          debtorData.credit_score || existingDebtor[0].credit_score,
          debtorData.notes || existingDebtor[0].notes,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el registro actualizado completo
      const updatedDebtor = await this.getById(id);
      
      return updatedDebtor;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar deudor de crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar un deudor de crédito
   * @param {number} id - ID del deudor de crédito
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el deudor de crédito exista
      const [existingDebtor] = await connection.query(
        `SELECT md.*, m.credit_number 
         FROM Cr_mortgage_debtors md
         INNER JOIN Cr_mortgages m ON md.mortgage_id = m.id
         WHERE md.id = ?`,
        [id]
      );
      
      if (existingDebtor.length === 0) {
        throw new Error(`El deudor de crédito con ID ${id} no existe`);
      }

      // Verificar que no sea el único deudor del crédito
      const [debtorCount] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgage_debtors WHERE mortgage_id = ?`,
        [existingDebtor[0].mortgage_id]
      );

      if (debtorCount[0].count <= 1) {
        throw new Error(`No se puede eliminar el único deudor del crédito ${existingDebtor[0].credit_number}`);
      }

      // Eliminar el deudor de crédito
      await connection.query(
        `DELETE FROM Cr_mortgage_debtors WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar deudor de crédito ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de deudores de créditos
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_debtors,
          COUNT(DISTINCT mortgage_id) as mortgages_with_debtors,
          COUNT(DISTINCT third_party_id) as unique_third_parties,
          SUM(CASE WHEN debtor_type = 'primary' THEN 1 ELSE 0 END) as primary_debtors,
          SUM(CASE WHEN debtor_type = 'secondary' THEN 1 ELSE 0 END) as secondary_debtors,
          SUM(CASE WHEN debtor_type = 'guarantor' THEN 1 ELSE 0 END) as guarantors,
          SUM(CASE WHEN is_primary_debtor = TRUE THEN 1 ELSE 0 END) as primary_marked_debtors,
          AVG(responsibility_percentage) as avg_responsibility_percentage,
          AVG(monthly_income) as avg_monthly_income,
          AVG(credit_score) as avg_credit_score
        FROM Cr_mortgage_debtors
      `);

      const [byDebtorType] = await pool.query(`
        SELECT 
          debtor_type,
          COUNT(*) as count,
          AVG(responsibility_percentage) as avg_responsibility,
          AVG(monthly_income) as avg_income,
          AVG(credit_score) as avg_credit_score,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Cr_mortgage_debtors), 2) as percentage
        FROM Cr_mortgage_debtors
        GROUP BY debtor_type
        ORDER BY count DESC
      `);

      const [byEmploymentStatus] = await pool.query(`
        SELECT 
          employment_status,
          COUNT(*) as count,
          AVG(monthly_income) as avg_income,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Cr_mortgage_debtors WHERE employment_status IS NOT NULL), 2) as percentage
        FROM Cr_mortgage_debtors
        WHERE employment_status IS NOT NULL
        GROUP BY employment_status
        ORDER BY count DESC
      `);

      const [responsibilityDistribution] = await pool.query(`
        SELECT 
          CASE 
            WHEN responsibility_percentage <= 25 THEN '0-25%'
            WHEN responsibility_percentage <= 50 THEN '26-50%'
            WHEN responsibility_percentage <= 75 THEN '51-75%'
            WHEN responsibility_percentage <= 100 THEN '76-100%'
            ELSE 'Más de 100%'
          END as responsibility_range,
          COUNT(*) as count,
          AVG(monthly_income) as avg_income
        FROM Cr_mortgage_debtors
        GROUP BY 
          CASE 
            WHEN responsibility_percentage <= 25 THEN '0-25%'
            WHEN responsibility_percentage <= 50 THEN '26-50%'
            WHEN responsibility_percentage <= 75 THEN '51-75%'
            WHEN responsibility_percentage <= 100 THEN '76-100%'
            ELSE 'Más de 100%'
          END
        ORDER BY count DESC
      `);

      return {
        general: generalStats[0],
        by_debtor_type: byDebtorType,
        by_employment_status: byEmploymentStatus,
        responsibility_distribution: responsibilityDistribution
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de deudores: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener opciones para formularios
   * @returns {Promise<Object>} Opciones estructuradas para formularios
   */
  static async getFormOptions() {
    try {
      const [activeMortgages] = await pool.query(`
        SELECT m.id, m.credit_number, m.principal_amount, m.current_balance,
               p.property_code, p.address
        FROM Cr_mortgages m
        INNER JOIN Cr_properties p ON m.property_id = p.id
        WHERE m.status = 'active' AND m.is_active = TRUE
        ORDER BY m.credit_number ASC
      `);

      const [availableThirdParties] = await pool.query(`
        SELECT tp.id, tp.identification_type, tp.identification_number, tp.name, tp.phone, tp.email
        FROM third_parties tp
        WHERE tp.is_active = TRUE
        ORDER BY tp.name ASC
      `);
      
      return {
        active_mortgages: activeMortgages.map(m => ({
          value: m.id,
          label: `${m.credit_number} - ${m.property_code}`,
          credit_number: m.credit_number,
          property_code: m.property_code,
          address: m.address,
          principal_amount: m.principal_amount,
          current_balance: m.current_balance
        })),
        available_third_parties: availableThirdParties.map(tp => ({
          value: tp.id,
          label: `${tp.name} - ${tp.identification_number}`,
          document_type: tp.identification_type,
          document_number: tp.identification_number,
          name: tp.name,
          phone: tp.phone,
          email: tp.email
        })),
        debtor_types: [
          { value: 'primary', label: 'Deudor Principal' },
          { value: 'secondary', label: 'Deudor Secundario' },
          { value: 'guarantor', label: 'Garante' }
        ],
        employment_statuses: [
          { value: 'employed', label: 'Empleado' },
          { value: 'self_employed', label: 'Independiente' },
          { value: 'unemployed', label: 'Desempleado' },
          { value: 'retired', label: 'Pensionado' },
          { value: 'other', label: 'Otro' }
        ]
      };
    } catch (error) {
      logger.error(`Error al obtener opciones para formularios: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MortgageDebtors;