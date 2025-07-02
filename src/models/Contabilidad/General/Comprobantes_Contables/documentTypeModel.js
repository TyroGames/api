/**
 * Modelo para gestionar los tipos de comprobantes contables
 * @module models/Contabilidad/General/Comprobantes_Contables/documentTypeModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar los tipos de comprobantes contables en el sistema
 */
class DocumentType {
  /**
   * Obtener todos los tipos de comprobantes contables
   * @param {Object} filters - Filtros para la búsqueda (opcional)
   * @returns {Promise<Array>} Lista de tipos de comprobantes
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT vt.*, COUNT(v.id) as total_vouchers
        FROM accounting_voucher_types vt
        LEFT JOIN accounting_vouchers v ON vt.id = v.voucher_type_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("vt.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.code) {
        conditions.push("vt.code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.is_active !== undefined) {
        conditions.push("vt.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY vt.id ORDER BY vt.name";

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener tipos de comprobantes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de comprobante por ID
   * @param {number} id - ID del tipo de comprobante
   * @returns {Promise<Object>} Tipo de comprobante
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT vt.*, COUNT(v.id) as total_vouchers
         FROM accounting_voucher_types vt
         LEFT JOIN accounting_vouchers v ON vt.id = v.voucher_type_id
         WHERE vt.id = ?
         GROUP BY vt.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un tipo de comprobante por código
   * @param {string} codigo - Código del tipo de comprobante
   * @returns {Promise<Object>} Tipo de comprobante
   */
  static async getByCode(codigo) {
    try {
      const [rows] = await pool.query(
        `SELECT vt.*, COUNT(v.id) as total_vouchers
         FROM accounting_voucher_types vt
         LEFT JOIN accounting_vouchers v ON vt.id = v.voucher_type_id
         WHERE vt.code = ?
         GROUP BY vt.id`,
        [codigo]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante con código ${codigo}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tipo de comprobante
   * @param {Object} typeData - Datos del tipo de comprobante
   * @returns {Promise<Object>} Tipo de comprobante creado
   */
  static async create(typeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe un tipo con el mismo código
      const [existingCode] = await connection.query(
        `SELECT id FROM accounting_voucher_types WHERE code = ?`,
        [typeData.code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe un tipo de comprobante con el código ${typeData.code}`);
      }
      
      // Insertar el tipo de comprobante
      const [result] = await connection.query(
        `INSERT INTO accounting_voucher_types 
        (code, name, description, nature, consecutive, print_format, 
         requires_third_party, requires_cost_center, requires_reference, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          typeData.code,
          typeData.name,
          typeData.description || '',
          typeData.nature,
          typeData.consecutive || 1,
          typeData.print_format || '',
          typeData.requires_third_party || false,
          typeData.requires_cost_center || false,
          typeData.requires_reference || false,
          typeData.is_active !== undefined ? typeData.is_active : true
        ]
      );
      
      const typeId = result.insertId;
      
      await connection.commit();
      
      return { id: typeId, ...typeData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear tipo de comprobante: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar un tipo de comprobante existente
   * @param {number} id - ID del tipo de comprobante
   * @param {Object} typeData - Datos actualizados del tipo de comprobante
   * @returns {Promise<Object>} Tipo de comprobante actualizado
   */
  static async update(id, typeData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el tipo exista
      const [typeCheck] = await connection.query(
        `SELECT id FROM accounting_voucher_types WHERE id = ?`,
        [id]
      );
      
      if (!typeCheck.length) {
        throw new Error(`El tipo de comprobante con ID ${id} no existe`);
      }
      
      // Verificar si el código nuevo ya existe en otro tipo
      if (typeData.code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM accounting_voucher_types WHERE code = ? AND id != ?`,
          [typeData.code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otro tipo de comprobante con el código ${typeData.code}`);
        }
      }
      
      // Actualizar el tipo de comprobante
      await connection.query(
        `UPDATE accounting_voucher_types SET
         code = ?,
         name = ?,
         description = ?,
         nature = ?,
         print_format = ?,
         requires_third_party = ?,
         requires_cost_center = ?,
         requires_reference = ?,
         is_active = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          typeData.code,
          typeData.name,
          typeData.description || '',
          typeData.nature,
          typeData.print_format || '',
          typeData.requires_third_party || false,
          typeData.requires_cost_center || false,
          typeData.requires_reference || false,
          typeData.is_active !== undefined ? typeData.is_active : true,
          id
        ]
      );
      
      await connection.commit();
      
      return { id, ...typeData };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar tipo de comprobante ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar el consecutivo de un tipo de comprobante
   * @param {number} id - ID del tipo de comprobante
   * @param {number} consecutivo - Nuevo valor del consecutivo
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async updateConsecutivo(id, consecutivo) {
    try {
      // Validar que el consecutivo sea un número entero positivo
      const newConsecutivo = parseInt(consecutivo);
      if (isNaN(newConsecutivo) || newConsecutivo <= 0) {
        throw new Error('El consecutivo debe ser un número entero positivo');
      }
      
      // Actualizar el consecutivo
      await pool.query(
        `UPDATE accounting_voucher_types SET consecutive = ? WHERE id = ?`,
        [newConsecutivo, id]
      );
      
      return { id, consecutive: newConsecutivo, updated: true };
    } catch (error) {
      logger.error(`Error al actualizar consecutivo del tipo de comprobante ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambiar el estado de activación de un tipo de comprobante
   * @param {number} id - ID del tipo de comprobante
   * @param {boolean} activo - Nuevo estado de activación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async toggleActive(id, activo) {
    try {
      const newActive = Boolean(activo);
      
      await pool.query(
        `UPDATE accounting_voucher_types SET is_active = ? WHERE id = ?`,
        [newActive, id]
      );
      
      return { id, is_active: newActive, updated: true };
    } catch (error) {
      logger.error(`Error al cambiar estado de activación del tipo de comprobante ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un tipo de comprobante (solo si no tiene comprobantes asociados)
   * @param {number} id - ID del tipo de comprobante
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si hay comprobantes asociados
      const [comprobantesCheck] = await connection.query(
        `SELECT COUNT(*) as total FROM accounting_vouchers WHERE voucher_type_id = ?`,
        [id]
      );
      
      if (comprobantesCheck[0].total > 0) {
        throw new Error(`No se puede eliminar el tipo de comprobante porque tiene ${comprobantesCheck[0].total} comprobantes asociados`);
      }
      
      // Eliminar el tipo de comprobante
      await connection.query(
        `DELETE FROM accounting_voucher_types WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar tipo de comprobante ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener estadísticas de uso de un tipo de comprobante
   * @param {number} id - ID del tipo de comprobante
   * @returns {Promise<Object>} Estadísticas del tipo de comprobante
   */
  static async getStats(id) {
    try {
      // Obtener estadísticas básicas
      const [basicStats] = await pool.query(
        `SELECT 
           COUNT(*) as total_vouchers,
           SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as total_drafts,
           SUM(CASE WHEN status = 'VALIDATED' THEN 1 ELSE 0 END) as total_validated,
           SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as total_approved,
           SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as total_cancelled,
           MIN(date) as first_voucher_date,
           MAX(date) as last_voucher_date
         FROM accounting_vouchers
         WHERE voucher_type_id = ?`,
        [id]
      );
      
      // Obtener totales por mes (último año)
      const [monthlyStats] = await pool.query(
        `SELECT 
           YEAR(date) as year,
           MONTH(date) as month,
           COUNT(*) as total
         FROM accounting_vouchers
         WHERE voucher_type_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
         GROUP BY YEAR(date), MONTH(date)
         ORDER BY YEAR(date), MONTH(date)`,
        [id]
      );
      
      return {
        ...basicStats[0],
        monthly_stats: monthlyStats
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas del tipo de comprobante ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DocumentType; 