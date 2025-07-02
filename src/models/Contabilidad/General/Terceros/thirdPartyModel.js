/**
 * Modelo para gestionar los terceros (clientes, proveedores, acreedores, etc.)
 * @module models/Contabilidad/General/Terceros/thirdPartyModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar los terceros en el sistema
 */
class ThirdParty {
  /**
   * Obtener todos los terceros con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise<Array>} Lista de terceros
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT t.*, 
               CASE 
                 WHEN t.verification_digit IS NOT NULL THEN CONCAT(t.identification_number, '-', t.verification_digit) 
                 ELSE t.identification_number 
               END as formatted_identification
        FROM third_parties t
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.code) {
        conditions.push("t.code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.identification_number) {
        conditions.push("t.identification_number LIKE ?");
        queryParams.push(`%${filters.identification_number}%`);
      }

      if (filters.name) {
        conditions.push("t.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.is_customer !== undefined) {
        conditions.push("t.is_customer = ?");
        queryParams.push(filters.is_customer === 'true' || filters.is_customer === true ? 1 : 0);
      }

      if (filters.is_supplier !== undefined) {
        conditions.push("t.is_supplier = ?");
        queryParams.push(filters.is_supplier === 'true' || filters.is_supplier === true ? 1 : 0);
      }

      if (filters.is_creditor !== undefined) {
        conditions.push("t.is_creditor = ?");
        queryParams.push(filters.is_creditor === 'true' || filters.is_creditor === true ? 1 : 0);
      }

      if (filters.is_active !== undefined) {
        conditions.push("t.is_active = ?");
        queryParams.push(filters.is_active === 'true' || filters.is_active === true ? 1 : 0);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY t.name";

      if (filters.limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(filters.limit));
      }

      const [rows] = await pool.query(query, queryParams);
    
      return rows;
    } catch (error) {
      logger.error(`Error al obtener terceros: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tercero por su ID
   * @param {number} id - ID del tercero
   * @returns {Promise<Object>} Datos del tercero
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT t.*, 
                CASE 
                  WHEN t.verification_digit IS NOT NULL THEN CONCAT(t.identification_number, '-', t.verification_digit) 
                  ELSE t.identification_number 
                END as formatted_identification
         FROM third_parties t
         WHERE t.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tercero con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tercero
   * @param {Object} thirdPartyData - Datos del tercero
   * @returns {Promise<Object>} Tercero creado
   */
  static async create(thirdPartyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe un tercero con el mismo número y tipo de identificación
      const [existingCheck] = await connection.query(
        `SELECT id FROM third_parties 
         WHERE identification_type = ? AND identification_number = ?`,
        [thirdPartyData.identification_type, thirdPartyData.identification_number]
      );
      
      if (existingCheck.length > 0) {
        throw new Error(`Ya existe un tercero con identificación ${thirdPartyData.identification_type} ${thirdPartyData.identification_number}`);
      }
      
      // Si no se proporciona un código, generar uno automáticamente
      if (!thirdPartyData.code) {
        const [lastCode] = await connection.query(
          `SELECT code FROM third_parties ORDER BY id DESC LIMIT 1`
        );
        
        let newCode = '1000'; // Código por defecto si no hay terceros
        if (lastCode.length > 0) {
          const lastNumber = parseInt(lastCode[0].code);
          newCode = (lastNumber + 1).toString();
        }
        
        thirdPartyData.code = newCode;
      }
      
      // Insertar el tercero
      const [result] = await connection.query(
        `INSERT INTO third_parties (
          code, identification_type, identification_number, verification_digit,
          name, commercial_name, address, city, state, country, postal_code,
          phone, mobile, email, contact_person, website, tax_regime,
          is_vat_responsible, is_withholding_agent, is_customer, is_supplier,
          is_creditor, is_employee, is_shareholder, is_other, notes,
          receivable_account_id, payable_account_id, credit_limit, payment_terms,
          is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          thirdPartyData.code,
          thirdPartyData.identification_type,
          thirdPartyData.identification_number,
          thirdPartyData.verification_digit || null,
          thirdPartyData.name,
          thirdPartyData.commercial_name || null,
          thirdPartyData.address || null,
          thirdPartyData.city || null,
          thirdPartyData.state || null,
          thirdPartyData.country || null,
          thirdPartyData.postal_code || null,
          thirdPartyData.phone || null,
          thirdPartyData.mobile || null,
          thirdPartyData.email || null,
          thirdPartyData.contact_person || null,
          thirdPartyData.website || null,
          thirdPartyData.tax_regime,
          thirdPartyData.is_vat_responsible ? 1 : 0,
          thirdPartyData.is_withholding_agent ? 1 : 0,
          thirdPartyData.is_customer ? 1 : 0,
          thirdPartyData.is_supplier ? 1 : 0,
          thirdPartyData.is_creditor ? 1 : 0,
          thirdPartyData.is_employee ? 1 : 0,
          thirdPartyData.is_shareholder ? 1 : 0,
          thirdPartyData.is_other ? 1 : 0,
          thirdPartyData.notes || null,
          thirdPartyData.receivable_account_id || null,
          thirdPartyData.payable_account_id || null,
          thirdPartyData.credit_limit || 0,
          thirdPartyData.payment_terms || 0,
          thirdPartyData.is_active !== undefined ? thirdPartyData.is_active : 1,
          thirdPartyData.created_by
        ]
      );
      
      const thirdPartyId = result.insertId;
      
      await connection.commit();
      
      return { id: thirdPartyId, ...thirdPartyData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear tercero: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un tercero existente
   * @param {number} id - ID del tercero
   * @param {Object} thirdPartyData - Datos actualizados del tercero
   * @returns {Promise<Object>} Tercero actualizado
   */
  static async update(id, thirdPartyData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tercero exista
      const [thirdPartyCheck] = await connection.query(
        `SELECT id FROM third_parties WHERE id = ?`,
        [id]
      );
      
      if (!thirdPartyCheck.length) {
        throw new Error(`El tercero con ID ${id} no existe`);
      }
      
      // Verificar si ya existe otro tercero con el mismo número y tipo de identificación
      if (thirdPartyData.identification_number && thirdPartyData.identification_type) {
        const [existingCheck] = await connection.query(
          `SELECT id FROM third_parties 
           WHERE identification_type = ? AND identification_number = ? AND id != ?`,
          [thirdPartyData.identification_type, thirdPartyData.identification_number, id]
        );
        
        if (existingCheck.length > 0) {
          throw new Error(`Ya existe otro tercero con identificación ${thirdPartyData.identification_type} ${thirdPartyData.identification_number}`);
        }
      }
      
      // Actualizar el tercero
      await connection.query(
        `UPDATE third_parties SET
         identification_type = IFNULL(?, identification_type),
         identification_number = IFNULL(?, identification_number),
         verification_digit = ?,
         name = IFNULL(?, name),
         commercial_name = ?,
         address = ?,
         city = ?,
         state = ?,
         country = ?,
         postal_code = ?,
         phone = ?,
         mobile = ?,
         email = ?,
         contact_person = ?,
         website = ?,
         tax_regime = IFNULL(?, tax_regime),
         is_vat_responsible = IFNULL(?, is_vat_responsible),
         is_withholding_agent = IFNULL(?, is_withholding_agent),
         is_customer = IFNULL(?, is_customer),
         is_supplier = IFNULL(?, is_supplier),
         is_creditor = IFNULL(?, is_creditor),
         is_employee = IFNULL(?, is_employee),
         is_shareholder = IFNULL(?, is_shareholder),
         is_other = IFNULL(?, is_other),
         notes = ?,
         receivable_account_id = ?,
         payable_account_id = ?,
         credit_limit = IFNULL(?, credit_limit),
         payment_terms = IFNULL(?, payment_terms),
         is_active = IFNULL(?, is_active),
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [
          thirdPartyData.identification_type || null,
          thirdPartyData.identification_number || null,
          thirdPartyData.verification_digit || null,
          thirdPartyData.name || null,
          thirdPartyData.commercial_name || null,
          thirdPartyData.address || null,
          thirdPartyData.city || null,
          thirdPartyData.state || null,
          thirdPartyData.country || null,
          thirdPartyData.postal_code || null,
          thirdPartyData.phone || null,
          thirdPartyData.mobile || null,
          thirdPartyData.email || null,
          thirdPartyData.contact_person || null,
          thirdPartyData.website || null,
          thirdPartyData.tax_regime || null,
          thirdPartyData.is_vat_responsible !== undefined ? (thirdPartyData.is_vat_responsible ? 1 : 0) : null,
          thirdPartyData.is_withholding_agent !== undefined ? (thirdPartyData.is_withholding_agent ? 1 : 0) : null,
          thirdPartyData.is_customer !== undefined ? (thirdPartyData.is_customer ? 1 : 0) : null,
          thirdPartyData.is_supplier !== undefined ? (thirdPartyData.is_supplier ? 1 : 0) : null,
          thirdPartyData.is_creditor !== undefined ? (thirdPartyData.is_creditor ? 1 : 0) : null,
          thirdPartyData.is_employee !== undefined ? (thirdPartyData.is_employee ? 1 : 0) : null,
          thirdPartyData.is_shareholder !== undefined ? (thirdPartyData.is_shareholder ? 1 : 0) : null,
          thirdPartyData.is_other !== undefined ? (thirdPartyData.is_other ? 1 : 0) : null,
          thirdPartyData.notes || null,
          thirdPartyData.receivable_account_id || null,
          thirdPartyData.payable_account_id || null,
          thirdPartyData.credit_limit || null,
          thirdPartyData.payment_terms || null,
          thirdPartyData.is_active !== undefined ? (thirdPartyData.is_active ? 1 : 0) : null,
          thirdPartyData.updated_by,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el tercero actualizado
      const updatedThirdParty = await this.getById(id);
      
      return updatedThirdParty;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar tercero ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cambiar el estado activo/inactivo de un tercero
   * @param {number} id - ID del tercero
   * @param {boolean} isActive - Estado a establecer
   * @param {number} userId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async toggleStatus(id, isActive, userId) {
    try {
      // Verificar que el tercero exista
      const thirdParty = await this.getById(id);
      
      if (!thirdParty) {
        throw new Error(`El tercero con ID ${id} no existe`);
      }
      
      // Actualizar el estado
      await pool.query(
        `UPDATE third_parties SET
         is_active = ?,
         updated_at = NOW(),
         updated_by = ?
         WHERE id = ?`,
        [isActive ? 1 : 0, userId, id]
      );
      
      return { 
        id, 
        is_active: isActive,
        updated_by: userId,
        update_date: new Date()
      };
    } catch (error) {
      logger.error(`Error al cambiar estado del tercero ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar terceros por término de búsqueda
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>} Array de terceros que coinciden con la búsqueda
   */
  static async search(searchTerm) {
    try {
      const [rows] = await pool.query(
        `SELECT t.*, 
                CASE 
                  WHEN t.verification_digit IS NOT NULL THEN CONCAT(t.identification_number, '-', t.verification_digit) 
                  ELSE t.identification_number 
                END as formatted_identification
         FROM third_parties t
         WHERE t.name LIKE ? 
         OR t.commercial_name LIKE ? 
         OR t.code LIKE ? 
         OR t.identification_number LIKE ?
         ORDER BY t.name
         LIMIT 50`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      logger.error(`Error al buscar terceros con término "${searchTerm}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si existe un tercero por número de identificación
   * @param {string} identificationType - Tipo de identificación
   * @param {string} identificationNumber - Número de identificación
   * @returns {Promise<Object|null>} Datos del tercero si existe, null si no existe
   */
  static async checkIdentificationExists(identificationType, identificationNumber) {
    try {
      const [rows] = await pool.query(
        `SELECT t.*, 
                CASE 
                  WHEN t.verification_digit IS NOT NULL THEN CONCAT(t.identification_number, '-', t.verification_digit) 
                  ELSE t.identification_number 
                END as formatted_identification
         FROM third_parties t
         WHERE t.identification_type = ? AND t.identification_number = ?`,
        [identificationType, identificationNumber]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      logger.error(`Error al verificar identificación ${identificationType} ${identificationNumber}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ThirdParty; 