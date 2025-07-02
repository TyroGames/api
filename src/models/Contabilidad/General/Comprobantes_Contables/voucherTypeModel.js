/**
 * Modelo para gestionar los tipos de comprobantes contables
 * @module models/Contabilidad/General/Comprobantes_Contables/voucherTypeModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar los tipos de comprobantes contables en el sistema
 */
class VoucherType {
  /**
   * Obtener todos los tipos de comprobantes contables
   * @param {Object} filters - Filtros para la búsqueda (opcional)
   * @returns {Promise<Array>} Lista de tipos de comprobantes
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT vt.*, vn.name as nature_name, vn.accounting_effect, vn.financial_statement_section,
               COUNT(v.id) as total_vouchers
        FROM accounting_voucher_types vt
        LEFT JOIN accounting_voucher_natures vn ON vt.nature_id = vn.id
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

      if (filters.nature_id) {
        conditions.push("vt.nature_id = ?");
        queryParams.push(filters.nature_id);
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
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT vt.*, vn.name as nature_name, vn.accounting_effect, vn.financial_statement_section,
                COUNT(v.id) as total_vouchers
         FROM accounting_voucher_types vt
         LEFT JOIN accounting_voucher_natures vn ON vt.nature_id = vn.id
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
   * @param {string} code - Código del tipo de comprobante
   * @returns {Promise<Object>} Tipo de comprobante
   */
  static async findByCode(code) {
    try {
      const [rows] = await pool.query(
        `SELECT vt.*, vn.name as nature_name, vn.accounting_effect, vn.financial_statement_section,
                COUNT(v.id) as total_vouchers
         FROM accounting_voucher_types vt
         LEFT JOIN accounting_voucher_natures vn ON vt.nature_id = vn.id
         LEFT JOIN accounting_vouchers v ON vt.id = v.voucher_type_id
         WHERE vt.code = ?
         GROUP BY vt.id`,
        [code]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener tipo de comprobante con código ${code}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo tipo de comprobante
   * @param {Object} typeData - Datos del tipo de comprobante
   * @param {number} userId - ID del usuario que crea
   * @returns {Promise<Object>} Tipo de comprobante creado
   */
  static async create(typeData, userId) {
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
        (code, name, description, nature_id, consecutive, print_format, 
         requires_third_party, requires_cost_center, requires_reference, is_active,
         created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          typeData.code,
          typeData.name,
          typeData.description || '',
          typeData.nature_id,
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
      
      // Obtener el tipo creado con sus relaciones
      const createdType = await this.findById(typeId);
      return createdType;
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
   * @param {number} userId - ID del usuario que actualiza
   * @returns {Promise<Object>} Tipo de comprobante actualizado
   */
  static async update(id, typeData, userId) {
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
         nature_id = ?,
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
          typeData.nature_id,
          typeData.print_format || '',
          typeData.requires_third_party || false,
          typeData.requires_cost_center || false,
          typeData.requires_reference || false,
          typeData.is_active !== undefined ? typeData.is_active : true,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener el tipo actualizado con sus relaciones
      const updatedType = await this.findById(id);
      return updatedType;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar tipo de comprobante ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
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
      const [vouchersCheck] = await connection.query(
        `SELECT COUNT(*) as total FROM accounting_vouchers WHERE voucher_type_id = ?`,
        [id]
      );
      
      if (vouchersCheck[0].total > 0) {
        throw new Error(`No se puede eliminar el tipo de comprobante porque tiene ${vouchersCheck[0].total} comprobantes asociados`);
      }
      
      // Eliminar el tipo de comprobante
      const [result] = await connection.query(
        `DELETE FROM accounting_voucher_types WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error(`El tipo de comprobante con ID ${id} no existe`);
      }
      
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
   * Alternar el estado activo/inactivo de un tipo de comprobante
   * @param {number} id - ID del tipo de comprobante
   * @param {boolean} isActive - Nuevo estado activo
   * @returns {Promise<Object>} Tipo de comprobante actualizado
   */
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        `UPDATE accounting_voucher_types SET is_active = ?, updated_at = NOW() WHERE id = ?`,
        [isActive, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error(`El tipo de comprobante con ID ${id} no existe`);
      }
      
      return await this.findById(id);
    } catch (error) {
      logger.error(`Error al cambiar estado del tipo de comprobante ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener naturalezas de comprobantes disponibles
   * @returns {Promise<Array>} Lista de naturalezas
   */
  static async getNatures() {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM accounting_voucher_natures ORDER BY name`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener naturalezas de comprobantes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todas las naturalezas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda (opcional)
   * @returns {Promise<Array>} Lista de naturalezas
   */
  static async getAllNatures(filters = {}) {
    try {
      let query = `
        SELECT vn.*, 
               COUNT(vt.id) as total_types
        FROM accounting_voucher_natures vn
        LEFT JOIN accounting_voucher_types vt ON vn.id = vt.nature_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("vn.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.code) {
        conditions.push("vn.code LIKE ?");
        queryParams.push(`%${filters.code}%`);
      }

      if (filters.accounting_effect) {
        conditions.push("vn.accounting_effect = ?");
        queryParams.push(filters.accounting_effect);
      }

      if (filters.financial_statement_section) {
        conditions.push("vn.financial_statement_section LIKE ?");
        queryParams.push(`%${filters.financial_statement_section}%`);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY vn.id ORDER BY vn.name";

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener naturalezas de comprobantes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una naturaleza por ID
   * @param {number} id - ID de la naturaleza
   * @returns {Promise<Object>} Naturaleza
   */
  static async getNatureById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT vn.*, 
                COUNT(vt.id) as total_types
         FROM accounting_voucher_natures vn
         LEFT JOIN accounting_voucher_types vt ON vn.id = vt.nature_id
         WHERE vn.id = ?
         GROUP BY vn.id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error(`Error al obtener naturaleza con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva naturaleza de comprobante
   * @param {Object} natureData - Datos de la naturaleza
   * @returns {Promise<Object>} Naturaleza creada
   */
  static async createNature(natureData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe una naturaleza con el mismo código
      const [existingCode] = await connection.query(
        `SELECT id FROM accounting_voucher_natures WHERE code = ?`,
        [natureData.code]
      );
      
      if (existingCode.length > 0) {
        throw new Error(`Ya existe una naturaleza con el código ${natureData.code}`);
      }
      
      // Insertar la naturaleza
      const [result] = await connection.query(
        `INSERT INTO accounting_voucher_natures 
        (code, name, accounting_effect, financial_statement_section)
        VALUES (?, ?, ?, ?)`,
        [
          natureData.code,
          natureData.name,
          natureData.accounting_effect,
          natureData.financial_statement_section
        ]
      );
      
      const natureId = result.insertId;
      
      await connection.commit();
      
      // Obtener la naturaleza creada con sus relaciones
      const createdNature = await this.getNatureById(natureId);
      return createdNature;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear naturaleza: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una naturaleza existente
   * @param {number} id - ID de la naturaleza
   * @param {Object} natureData - Datos actualizados de la naturaleza
   * @returns {Promise<Object>} Naturaleza actualizada
   */
  static async updateNature(id, natureData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la naturaleza exista
      const [natureCheck] = await connection.query(
        `SELECT id FROM accounting_voucher_natures WHERE id = ?`,
        [id]
      );
      
      if (!natureCheck.length) {
        throw new Error(`La naturaleza con ID ${id} no existe`);
      }
      
      // Verificar si el código nuevo ya existe en otra naturaleza
      if (natureData.code) {
        const [existingCode] = await connection.query(
          `SELECT id FROM accounting_voucher_natures WHERE code = ? AND id != ?`,
          [natureData.code, id]
        );
        
        if (existingCode.length > 0) {
          throw new Error(`Ya existe otra naturaleza con el código ${natureData.code}`);
        }
      }
      
      // Actualizar la naturaleza
      await connection.query(
        `UPDATE accounting_voucher_natures SET
         code = ?,
         name = ?,
         accounting_effect = ?,
         financial_statement_section = ?
         WHERE id = ?`,
        [
          natureData.code,
          natureData.name,
          natureData.accounting_effect,
          natureData.financial_statement_section,
          id
        ]
      );
      
      await connection.commit();
      
      // Obtener la naturaleza actualizada
      const updatedNature = await this.getNatureById(id);
      return updatedNature;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar naturaleza ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una naturaleza (solo si no tiene tipos asociados)
   * @param {number} id - ID de la naturaleza
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async deleteNature(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si hay tipos asociados
      const [typesCheck] = await connection.query(
        `SELECT COUNT(*) as total FROM accounting_voucher_types WHERE nature_id = ?`,
        [id]
      );
      
      if (typesCheck[0].total > 0) {
        throw new Error(`No se puede eliminar la naturaleza porque tiene ${typesCheck[0].total} tipos de comprobantes asociados`);
      }
      
      // Eliminar la naturaleza
      const [result] = await connection.query(
        `DELETE FROM accounting_voucher_natures WHERE id = ?`,
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error(`La naturaleza con ID ${id} no existe`);
      }
      
      await connection.commit();
      
      return { id, deleted: true };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar naturaleza ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar el siguiente número consecutivo para un tipo de comprobante
   * @param {number} voucherTypeId - ID del tipo de comprobante
   * @returns {Promise<number>} Siguiente número consecutivo
   */
  static async generateNextConsecutive(voucherTypeId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Obtener el consecutivo actual y actualizar
      const [updateResult] = await connection.query(
        `UPDATE accounting_voucher_types SET consecutive = consecutive + 1 WHERE id = ?`,
        [voucherTypeId]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error(`Tipo de comprobante con ID ${voucherTypeId} no encontrado`);
      }
      
      // Obtener el nuevo consecutivo
      const [result] = await connection.query(
        `SELECT consecutive FROM accounting_voucher_types WHERE id = ?`,
        [voucherTypeId]
      );
      
      await connection.commit();
      
      return result[0].consecutive;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al generar consecutivo para tipo ${voucherTypeId}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = VoucherType; 