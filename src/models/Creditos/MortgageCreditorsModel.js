/**
 * Modelo para gestionar los acreedores de créditos hipotecarios (Cr_mortgage_creditors)
 * @module models/Creditos/MortgageCreditorsModel
 */

const { pool } = require("../../config/db");


class MortgageCreditorsModel {
  /**
   * Obtener todos los acreedores con filtros y paginación
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT mc.id,
               mc.mortgage_id,
               mc.third_party_id,
               mc.creditor_type,
               mc.investment_amount,
               mc.investment_percentage,
               mc.interest_rate_share,
               mc.management_fee_share,
               mc.is_primary_creditor,
               mc.investment_start_date,
               mc.investment_end_date,
               mc.notes,
               mc.created_at,
               m.credit_number,
               m.principal_amount,
               m.current_balance,
               m.status as mortgage_status,
               tp.identification_type as document_type,
               tp.identification_number as document_number,
               tp.name as creditor_name,
               tp.phone,
               tp.email,
               u.username as created_by_name
        FROM Cr_mortgage_creditors mc
        INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
        INNER JOIN third_parties tp ON mc.third_party_id = tp.id
        INNER JOIN users u ON mc.created_by = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      // Aplicar filtros
      if (filters.mortgage_id) {
        query += ` AND mc.mortgage_id = ?`;
        queryParams.push(filters.mortgage_id);
      }

      if (filters.third_party_id) {
        query += ` AND mc.third_party_id = ?`;
        queryParams.push(filters.third_party_id);
      }

      if (filters.creditor_type) {
        query += ` AND mc.creditor_type = ?`;
        queryParams.push(filters.creditor_type);
      }

      if (filters.is_primary_creditor !== undefined) {
        query += ` AND mc.is_primary_creditor = ?`;
        queryParams.push(filters.is_primary_creditor);
      }

      if (filters.credit_number) {
        query += ` AND m.credit_number LIKE ?`;
        queryParams.push(`%${filters.credit_number}%`);
      }

      if (filters.document_number) {
        query += ` AND tp.identification_number LIKE ?`;
        queryParams.push(`%${filters.document_number}%`);
      }

      if (filters.creditor_name) {
        query += ` AND tp.name LIKE ?`;
        queryParams.push(`%${filters.creditor_name}%`);
      }

      if (filters.investment_amount_min) {
        query += ` AND mc.investment_amount >= ?`;
        queryParams.push(filters.investment_amount_min);
      }

      if (filters.investment_amount_max) {
        query += ` AND mc.investment_amount <= ?`;
        queryParams.push(filters.investment_amount_max);
      }

      if (filters.investment_start_date_from) {
        query += ` AND mc.investment_start_date >= ?`;
        queryParams.push(filters.investment_start_date_from);
      }

      if (filters.investment_start_date_to) {
        query += ` AND mc.investment_start_date <= ?`;
        queryParams.push(filters.investment_start_date_to);
      }

      if (filters.active_investments_only) {
        query += ` AND (mc.investment_end_date IS NULL OR mc.investment_end_date > CURDATE())`;
      }

      // Ordenamiento
      const validSortFields = [
        'mc.created_at', 'mc.investment_amount', 'mc.investment_percentage',
        'mc.investment_start_date', 'creditor_name', 'm.credit_number'
      ];
      const sortField = validSortFields.includes(filters.sort_by) ? filters.sort_by : 'mc.created_at';
      const sortOrder = filters.sort_order === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortField} ${sortOrder}`;

      // Paginación
      if (filters.limit) {
        const limit = parseInt(filters.limit, 10);
        const offset = filters.page ? (parseInt(filters.page, 10) - 1) * limit : 0;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
      }

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener acreedores de créditos: ${error.message}`);
    }
  }

  /**
   * Obtener acreedor por ID
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT mc.*,
                m.credit_number,
                m.principal_amount,
                m.current_balance,
                m.status as mortgage_status,
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as creditor_name,
                tp.phone,
                tp.email,
                u.username as created_by_name
         FROM Cr_mortgage_creditors mc
         INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
         INNER JOIN third_parties tp ON mc.third_party_id = tp.id
         INNER JOIN users u ON mc.created_by = u.id
         WHERE mc.id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener acreedor por ID: ${error.message}`);
    }
  }

  /**
   * Obtener acreedores por crédito hipotecario
   */
  static async getByMortgageId(mortgageId) {
    try {
      const [rows] = await pool.query(
        `SELECT mc.*,
                tp.identification_type as document_type,
                tp.identification_number as document_number,
                tp.name as creditor_name,
                tp.phone,
                tp.email,
                u.username as created_by_name
         FROM Cr_mortgage_creditors mc
         INNER JOIN third_parties tp ON mc.third_party_id = tp.id
         INNER JOIN users u ON mc.created_by = u.id
         WHERE mc.mortgage_id = ?
         ORDER BY mc.is_primary_creditor DESC, mc.investment_amount DESC`,
        [mortgageId]
      );

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener acreedores por crédito: ${error.message}`);
    }
  }

  /**
   * Obtener acreedores por tercero
   */
  static async getByThirdPartyId(thirdPartyId) {
    try {
      const [rows] = await pool.query(
        `SELECT mc.*,
                m.credit_number,
                m.principal_amount,
                m.current_balance,
                m.status as mortgage_status
         FROM Cr_mortgage_creditors mc
         INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
         WHERE mc.third_party_id = ?
         ORDER BY mc.investment_start_date DESC`,
        [thirdPartyId]
      );

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener acreedores por tercero: ${error.message}`);
    }
  }

  /**
   * Crear nuevo acreedor
   */
  static async create(creditorData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que el crédito exista
      const [existingMortgage] = await connection.query(
        `SELECT id, credit_number, principal_amount, status FROM Cr_mortgages WHERE id = ?`,
        [creditorData.mortgage_id]
      );

      if (existingMortgage.length === 0) {
        throw new Error('El crédito hipotecario especificado no existe');
      }

      if (existingMortgage[0].status !== 'active') {
        throw new Error('Solo se pueden agregar acreedores a créditos activos');
      }

      // Verificar que el tercero exista
      const [existingThirdParty] = await connection.query(
        `SELECT id, identification_number, name FROM third_parties WHERE id = ?`,
        [creditorData.third_party_id]
      );

      if (existingThirdParty.length === 0) {
        throw new Error('El tercero especificado no existe');
      }

      // Verificar que no sea ya acreedor del mismo crédito
      const [existingCreditor] = await connection.query(
        `SELECT id FROM Cr_mortgage_creditors WHERE mortgage_id = ? AND third_party_id = ?`,
        [creditorData.mortgage_id, creditorData.third_party_id]
      );

      if (existingCreditor.length > 0) {
        throw new Error(`El tercero "${existingThirdParty[0].name}" ya es acreedor del crédito ${existingMortgage[0].credit_number}`);
      }

      // Validar porcentajes
      if (creditorData.investment_percentage && (creditorData.investment_percentage < 0 || creditorData.investment_percentage > 100)) {
        throw new Error('El porcentaje de inversión debe estar entre 0 y 100');
      }

      if (creditorData.interest_rate_share && (creditorData.interest_rate_share < 0 || creditorData.interest_rate_share > 100)) {
        throw new Error('El porcentaje de participación en intereses debe estar entre 0 y 100');
      }

      if (creditorData.management_fee_share && (creditorData.management_fee_share < 0 || creditorData.management_fee_share > 100)) {
        throw new Error('El porcentaje de cuota de manejo debe estar entre 0 y 100');
      }

      // Validar monto de inversión
      if (creditorData.investment_amount <= 0) {
        throw new Error('El monto de inversión debe ser mayor a cero');
      }

      // Validar fechas
      if (creditorData.investment_end_date && creditorData.investment_end_date <= creditorData.investment_start_date) {
        throw new Error('La fecha de fin de inversión debe ser posterior a la fecha de inicio');
      }

      // Si es acreedor principal, verificar que no haya otro
      if (creditorData.is_primary_creditor) {
        const [existingPrimary] = await connection.query(
          `SELECT id FROM Cr_mortgage_creditors WHERE mortgage_id = ? AND is_primary_creditor = TRUE`,
          [creditorData.mortgage_id]
        );

        if (existingPrimary.length > 0) {
          throw new Error('Ya existe un acreedor principal para este crédito');
        }
      }

      // Crear el acreedor
      const [result] = await connection.query(
        `INSERT INTO Cr_mortgage_creditors (
          mortgage_id, third_party_id, creditor_type, investment_amount,
          investment_percentage, interest_rate_share, management_fee_share,
          is_primary_creditor, investment_start_date, investment_end_date,
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          creditorData.mortgage_id,
          creditorData.third_party_id,
          creditorData.creditor_type || 'primary',
          creditorData.investment_amount,
          creditorData.investment_percentage || 100.00,
          creditorData.interest_rate_share || 100.00,
          creditorData.management_fee_share || 0.00,
          creditorData.is_primary_creditor || false,
          creditorData.investment_start_date,
          creditorData.investment_end_date || null,
          creditorData.notes || null,
          creditorData.created_by
        ]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al crear acreedor: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar acreedor existente
   */
  static async update(id, creditorData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que el acreedor exista
      const [existingCreditor] = await connection.query(
        `SELECT * FROM Cr_mortgage_creditors WHERE id = ?`,
        [id]
      );

      if (existingCreditor.length === 0) {
        throw new Error('El acreedor especificado no existe');
      }

      const currentCreditor = existingCreditor[0];

      // Validar porcentajes
      if (creditorData.investment_percentage && (creditorData.investment_percentage < 0 || creditorData.investment_percentage > 100)) {
        throw new Error('El porcentaje de inversión debe estar entre 0 y 100');
      }

      if (creditorData.interest_rate_share && (creditorData.interest_rate_share < 0 || creditorData.interest_rate_share > 100)) {
        throw new Error('El porcentaje de participación en intereses debe estar entre 0 y 100');
      }

      if (creditorData.management_fee_share && (creditorData.management_fee_share < 0 || creditorData.management_fee_share > 100)) {
        throw new Error('El porcentaje de cuota de manejo debe estar entre 0 y 100');
      }

      // Validar monto de inversión
      if (creditorData.investment_amount && creditorData.investment_amount <= 0) {
        throw new Error('El monto de inversión debe ser mayor a cero');
      }

      // Validar fechas
      if (creditorData.investment_end_date && creditorData.investment_start_date) {
        if (creditorData.investment_end_date <= creditorData.investment_start_date) {
          throw new Error('La fecha de fin de inversión debe ser posterior a la fecha de inicio');
        }
      }

      // Si se está marcando como acreedor principal, verificar que no haya otro
      if (creditorData.is_primary_creditor && !currentCreditor.is_primary_creditor) {
        const [existingPrimary] = await connection.query(
          `SELECT id FROM Cr_mortgage_creditors WHERE mortgage_id = ? AND is_primary_creditor = TRUE AND id != ?`,
          [currentCreditor.mortgage_id, id]
        );

        if (existingPrimary.length > 0) {
          throw new Error('Ya existe un acreedor principal para este crédito');
        }
      }

      // Actualizar el acreedor
      const updateFields = [];
      const updateValues = [];

      if (creditorData.creditor_type !== undefined) {
        updateFields.push('creditor_type = ?');
        updateValues.push(creditorData.creditor_type);
      }

      if (creditorData.investment_amount !== undefined) {
        updateFields.push('investment_amount = ?');
        updateValues.push(creditorData.investment_amount);
      }

      if (creditorData.investment_percentage !== undefined) {
        updateFields.push('investment_percentage = ?');
        updateValues.push(creditorData.investment_percentage);
      }

      if (creditorData.interest_rate_share !== undefined) {
        updateFields.push('interest_rate_share = ?');
        updateValues.push(creditorData.interest_rate_share);
      }

      if (creditorData.management_fee_share !== undefined) {
        updateFields.push('management_fee_share = ?');
        updateValues.push(creditorData.management_fee_share);
      }

      if (creditorData.is_primary_creditor !== undefined) {
        updateFields.push('is_primary_creditor = ?');
        updateValues.push(creditorData.is_primary_creditor);
      }

      if (creditorData.investment_start_date !== undefined) {
        updateFields.push('investment_start_date = ?');
        updateValues.push(creditorData.investment_start_date);
      }

      if (creditorData.investment_end_date !== undefined) {
        updateFields.push('investment_end_date = ?');
        updateValues.push(creditorData.investment_end_date);
      }

      if (creditorData.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(creditorData.notes);
      }

      if (updateFields.length === 0) {
        throw new Error('No se proporcionaron datos para actualizar');
      }

      updateValues.push(id);

      await connection.query(
        `UPDATE Cr_mortgage_creditors SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      await connection.commit();
      return { id, updated: true };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al actualizar acreedor: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar acreedor
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que el acreedor exista
      const [existingCreditor] = await connection.query(
        `SELECT mc.*, m.credit_number 
         FROM Cr_mortgage_creditors mc
         INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
         WHERE mc.id = ?`,
        [id]
      );

      if (existingCreditor.length === 0) {
        throw new Error('El acreedor especificado no existe');
      }

      const creditor = existingCreditor[0];

      // Verificar que no sea el único acreedor del crédito
      const [creditorCount] = await connection.query(
        `SELECT COUNT(*) as count FROM Cr_mortgage_creditors WHERE mortgage_id = ?`,
        [creditor.mortgage_id]
      );

      if (creditorCount[0].count === 1) {
        throw new Error('No se puede eliminar el único acreedor del crédito');
      }

      // Eliminar el acreedor
      await connection.query(
        `DELETE FROM Cr_mortgage_creditors WHERE id = ?`,
        [id]
      );

      await connection.commit();
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al eliminar acreedor: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar acreedor principal
   */
  static async changePrimaryCreditor(mortgageId, newPrimaryCreditorId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que ambos acreedores existan y pertenezcan al mismo crédito
      const [creditors] = await connection.query(
        `SELECT id, is_primary_creditor FROM Cr_mortgage_creditors 
         WHERE mortgage_id = ? AND id IN (?, (SELECT id FROM Cr_mortgage_creditors WHERE mortgage_id = ? AND is_primary_creditor = TRUE))`,
        [mortgageId, newPrimaryCreditorId, mortgageId]
      );

      if (creditors.length === 0) {
        throw new Error('No se encontraron acreedores válidos para el cambio');
      }

      // Quitar flag de acreedor principal a todos los acreedores del crédito
      await connection.query(
        `UPDATE Cr_mortgage_creditors SET is_primary_creditor = FALSE WHERE mortgage_id = ?`,
        [mortgageId]
      );

      // Asignar flag de acreedor principal al nuevo acreedor
      await connection.query(
        `UPDATE Cr_mortgage_creditors SET is_primary_creditor = TRUE WHERE id = ?`,
        [newPrimaryCreditorId]
      );

      await connection.commit();
      return { mortgageId, newPrimaryCreditorId, changed: true };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al cambiar acreedor principal: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de acreedores
   */
  static async getStatistics() {
    try {
      const [generalStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_creditors,
          COUNT(DISTINCT mortgage_id) as total_mortgages_with_creditors,
          COUNT(DISTINCT third_party_id) as unique_creditors,
          SUM(investment_amount) as total_investment_amount,
          AVG(investment_amount) as average_investment_amount,
          COUNT(CASE WHEN is_primary_creditor = TRUE THEN 1 END) as primary_creditors,
          COUNT(CASE WHEN creditor_type = 'investor' THEN 1 END) as investors,
          COUNT(CASE WHEN investment_end_date IS NULL OR investment_end_date > CURDATE() THEN 1 END) as active_investments
        FROM Cr_mortgage_creditors
      `);

      const [creditorTypeStats] = await pool.query(`
        SELECT 
          creditor_type,
          COUNT(*) as count,
          SUM(investment_amount) as total_investment,
          AVG(investment_amount) as average_investment
        FROM Cr_mortgage_creditors
        GROUP BY creditor_type
      `);

      const [investmentRangeStats] = await pool.query(`
        SELECT 
          CASE
            WHEN investment_amount < 10000000 THEN 'Menos de $10M'
            WHEN investment_amount < 50000000 THEN '$10M - $50M'
            WHEN investment_amount < 100000000 THEN '$50M - $100M'
            ELSE 'Más de $100M'
          END as investment_range,
          COUNT(*) as count
        FROM Cr_mortgage_creditors
        GROUP BY investment_range
      `);

      return {
        general: generalStats[0],
        by_creditor_type: creditorTypeStats,
        by_investment_range: investmentRangeStats
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener opciones para formularios
   */
  static async getFormOptions() {
    try {
      const [availableMortgages] = await pool.query(`
        SELECT m.id, m.credit_number, m.principal_amount, m.current_balance,
               ct.name as credit_type_name
        FROM Cr_mortgages m
        INNER JOIN Cr_credit_types ct ON m.credit_type_id = ct.id
        WHERE m.status = 'active' AND m.is_active = TRUE
        ORDER BY m.credit_number ASC
      `);

      const [availableThirdParties] = await pool.query(`
        SELECT tp.id, tp.identification_number, tp.name, tp.phone, tp.email
        FROM third_parties tp
        WHERE tp.is_active = TRUE
        ORDER BY tp.name ASC
      `);

      return {
        creditor_types: [
          { value: 'primary', label: 'Primario' },
          { value: 'secondary', label: 'Secundario' },
          { value: 'investor', label: 'Inversionista' }
        ],
        available_mortgages: availableMortgages,
        available_third_parties: availableThirdParties
      };
    } catch (error) {
      throw new Error(`Error al obtener opciones para formularios: ${error.message}`);
    }
  }

  /**
   * Verificar si un tercero puede ser eliminado (no tiene acreedurías activas)
   */
  static async canDeleteThirdParty(thirdPartyId) {
    try {
      const [activeCredits] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM Cr_mortgage_creditors mc
         INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
         WHERE mc.third_party_id = ? AND m.status = 'active'`,
        [thirdPartyId]
      );

      return activeCredits[0].count === 0;
    } catch (error) {
      throw new Error(`Error al verificar si el tercero puede ser eliminado: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de inversiones por acreedor
   */
  static async getInvestmentSummaryByCreditor(thirdPartyId) {
    try {
      const [summary] = await pool.query(`
        SELECT 
          tp.name as creditor_name,
          tp.identification_number,
          COUNT(mc.id) as total_investments,
          SUM(mc.investment_amount) as total_invested,
          AVG(mc.investment_amount) as average_investment,
          COUNT(CASE WHEN mc.is_primary_creditor = TRUE THEN 1 END) as primary_investments,
          COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_investments,
          MIN(mc.investment_start_date) as first_investment_date,
          MAX(mc.investment_start_date) as latest_investment_date
        FROM Cr_mortgage_creditors mc
        INNER JOIN third_parties tp ON mc.third_party_id = tp.id
        INNER JOIN Cr_mortgages m ON mc.mortgage_id = m.id
        WHERE mc.third_party_id = ?
      `, [thirdPartyId]);

      return summary[0];
    } catch (error) {
      throw new Error(`Error al obtener resumen de inversiones: ${error.message}`);
    }
  }
}

module.exports = MortgageCreditorsModel;
