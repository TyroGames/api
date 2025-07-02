/**
 * Modelo para gestionar las plantillas de comprobantes contables
 * @module models/Contabilidad/General/Comprobantes_Contables/voucherTemplateModel
 */

const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

/**
 * Clase para gestionar las plantillas de comprobantes contables en el sistema
 */
class VoucherTemplate {
  /**
   * Obtener todas las plantillas con filtros opcionales
   * @param {Object} filters - Filtros para la búsqueda (opcional)
   * @returns {Promise<Array>} Lista de plantillas
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT vt.*, 
               vtype.name as voucher_type_name,
               vtype.code as voucher_type_code,
               COUNT(vtl.id) as total_lines,
               CASE WHEN vt.is_active = 1 THEN 'Activa' ELSE 'Inactiva' END as status_label
        FROM voucher_templates vt
        LEFT JOIN accounting_voucher_types vtype ON vt.voucher_type_id = vtype.id
        LEFT JOIN voucher_template_lines vtl ON vt.id = vtl.template_id
      `;

      const queryParams = [];
      const conditions = [];

      // Aplicar filtros si existen
      if (filters.name) {
        conditions.push("vt.name LIKE ?");
        queryParams.push(`%${filters.name}%`);
      }

      if (filters.voucher_type_id) {
        conditions.push("vt.voucher_type_id = ?");
        queryParams.push(filters.voucher_type_id);
      }

      if (filters.is_active !== undefined) {
        conditions.push("vt.is_active = ?");
        queryParams.push(filters.is_active);
      }

      if (filters.category) {
        conditions.push("vt.category LIKE ?");
        queryParams.push(`%${filters.category}%`);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY vt.id ORDER BY vt.name";

      const [rows] = await pool.query(query, queryParams);
      return rows;
    } catch (error) {
      logger.error(`Error al obtener plantillas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una plantilla por ID con sus líneas
   * @param {number} id - ID de la plantilla
   * @returns {Promise<Object>} Plantilla completa con líneas
   */
  static async findById(id) {
    try {
      // Obtener datos de la plantilla
      const [templateRows] = await pool.query(
        `SELECT vt.*, 
                vtype.name as voucher_type_name,
                vtype.code as voucher_type_code,
                vtype.requires_third_party,
                vtype.requires_reference
         FROM voucher_templates vt
         LEFT JOIN accounting_voucher_types vtype ON vt.voucher_type_id = vtype.id
         WHERE vt.id = ?`,
        [id]
      );

      if (!templateRows.length) {
        return null;
      }

      const template = templateRows[0];

      // Obtener líneas de la plantilla
      const [lineRows] = await pool.query(
        `SELECT vtl.*, 
                coa.code as account_code,
                coa.name as account_name,
                tp.name as third_party_name
         FROM voucher_template_lines vtl
         LEFT JOIN chart_of_accounts coa ON vtl.account_id = coa.id
         LEFT JOIN third_parties tp ON vtl.third_party_id = tp.id
         WHERE vtl.template_id = ?
         ORDER BY vtl.line_number`,
        [id]
      );

      template.lines = lineRows;

      return template;
    } catch (error) {
      logger.error(`Error al obtener plantilla con ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear una nueva plantilla
   * @param {Object} templateData - Datos de la plantilla
   * @param {number} userId - ID del usuario que crea
   * @returns {Promise<Object>} Plantilla creada
   */
  static async create(templateData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe una plantilla con el mismo nombre
      const [existingName] = await connection.query(
        `SELECT id FROM voucher_templates WHERE name = ?`,
        [templateData.name]
      );
      
      if (existingName.length > 0) {
        throw new Error(`Ya existe una plantilla con el nombre ${templateData.name}`);
      }
      
      // Insertar la plantilla
      const [result] = await connection.query(
        `INSERT INTO voucher_templates 
        (name, description, voucher_type_id, category, is_active, 
         default_description, default_reference, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          templateData.name,
          templateData.description || '',
          templateData.voucher_type_id,
          templateData.category || 'General',
          templateData.is_active !== undefined ? templateData.is_active : true,
          templateData.default_description || '',
          templateData.default_reference || '',
          userId
        ]
      );
      
      const templateId = result.insertId;
      
      // Insertar líneas de plantilla si existen
      if (templateData.lines && Array.isArray(templateData.lines) && templateData.lines.length > 0) {
        for (let i = 0; i < templateData.lines.length; i++) {
          const line = templateData.lines[i];
          await connection.query(
            `INSERT INTO voucher_template_lines 
            (template_id, line_number, account_id, third_party_id, description, 
             debit_amount, credit_amount, amount_type, is_required)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              templateId,
              line.line_number || (i + 1),
              line.account_id,
              line.third_party_id || null,
              line.description || '',
              parseFloat(line.debit_amount || 0),
              parseFloat(line.credit_amount || 0),
              line.amount_type || 'fixed', // fixed, percentage, manual
              line.is_required !== undefined ? line.is_required : true
            ]
          );
        }
      }
      
      await connection.commit();
      
      // Obtener la plantilla creada con sus relaciones
      const createdTemplate = await this.findById(templateId);
      return createdTemplate;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al crear plantilla: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar una plantilla existente
   * @param {number} id - ID de la plantilla
   * @param {Object} templateData - Datos actualizados
   * @param {number} userId - ID del usuario que actualiza
   * @returns {Promise<Object>} Plantilla actualizada
   */
  static async update(id, templateData, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la plantilla exista
      const [templateCheck] = await connection.query(
        `SELECT id FROM voucher_templates WHERE id = ?`,
        [id]
      );
      
      if (!templateCheck.length) {
        throw new Error(`La plantilla con ID ${id} no existe`);
      }
      
      // Verificar si el nuevo nombre ya existe en otra plantilla
      if (templateData.name) {
        const [existingName] = await connection.query(
          `SELECT id FROM voucher_templates WHERE name = ? AND id != ?`,
          [templateData.name, id]
        );
        
        if (existingName.length > 0) {
          throw new Error(`Ya existe otra plantilla con el nombre ${templateData.name}`);
        }
      }
      
      // Actualizar la plantilla
      await connection.query(
        `UPDATE voucher_templates SET
         name = ?,
         description = ?,
         voucher_type_id = ?,
         category = ?,
         is_active = ?,
         default_description = ?,
         default_reference = ?,
         updated_by = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          templateData.name,
          templateData.description || '',
          templateData.voucher_type_id,
          templateData.category || 'General',
          templateData.is_active !== undefined ? templateData.is_active : true,
          templateData.default_description || '',
          templateData.default_reference || '',
          userId,
          id
        ]
      );
      
      // Si se proporcionan líneas, reemplazar todas
      if (templateData.lines && Array.isArray(templateData.lines)) {
        // Eliminar líneas existentes
        await connection.query(
          `DELETE FROM voucher_template_lines WHERE template_id = ?`,
          [id]
        );
        
        // Insertar nuevas líneas
        for (let i = 0; i < templateData.lines.length; i++) {
          const line = templateData.lines[i];
          await connection.query(
            `INSERT INTO voucher_template_lines 
            (template_id, line_number, account_id, third_party_id, description, 
             debit_amount, credit_amount, amount_type, is_required)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              line.line_number || (i + 1),
              line.account_id,
              line.third_party_id || null,
              line.description || '',
              parseFloat(line.debit_amount || 0),
              parseFloat(line.credit_amount || 0),
              line.amount_type || 'fixed',
              line.is_required !== undefined ? line.is_required : true
            ]
          );
        }
      }
      
      await connection.commit();
      
      // Obtener la plantilla actualizada
      const updatedTemplate = await this.findById(id);
      return updatedTemplate;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al actualizar plantilla ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar una plantilla
   * @param {number} id - ID de la plantilla
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la plantilla exista
      const [templateCheck] = await connection.query(
        `SELECT name FROM voucher_templates WHERE id = ?`,
        [id]
      );
      
      if (!templateCheck.length) {
        throw new Error(`La plantilla con ID ${id} no existe`);
      }
      
      // Eliminar líneas de la plantilla
      await connection.query(
        `DELETE FROM voucher_template_lines WHERE template_id = ?`,
        [id]
      );
      
      // Eliminar la plantilla
      const [result] = await connection.query(
        `DELETE FROM voucher_templates WHERE id = ?`,
        [id]
      );
      
      await connection.commit();
      
      return { 
        id, 
        name: templateCheck[0].name,
        deleted: true 
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`Error al eliminar plantilla ${id}: ${error.message}`);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generar comprobante a partir de una plantilla
   * @param {number} templateId - ID de la plantilla
   * @param {Object} data - Datos específicos para el comprobante
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Datos del comprobante generado
   */
  static async generateVoucher(templateId, data, userId) {
    try {
      const template = await this.findById(templateId);
      
      if (!template) {
        throw new Error(`Plantilla con ID ${templateId} no encontrada`);
      }
      
      if (!template.is_active) {
        throw new Error(`La plantilla "${template.name}" no está activa`);
      }
      
      // Generar estructura de comprobante
      const voucherData = {
        voucher_type_id: template.voucher_type_id,
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description || template.default_description,
        reference: data.reference || template.default_reference,
        third_party_id: data.third_party_id || null,
        voucher_lines: []
      };
      
      // Generar líneas del comprobante
      template.lines.forEach((templateLine, index) => {
        const line = {
          line_number: index + 1,
          account_id: templateLine.account_id,
          third_party_id: templateLine.third_party_id || data.third_party_id || null,
          description: templateLine.description || voucherData.description,
          debit_amount: 0,
          credit_amount: 0
        };
        
        // Calcular montos según el tipo
        if (templateLine.amount_type === 'fixed') {
          line.debit_amount = templateLine.debit_amount;
          line.credit_amount = templateLine.credit_amount;
        } else if (templateLine.amount_type === 'percentage' && data.total_amount) {
          const percentage = templateLine.debit_amount || templateLine.credit_amount;
          const amount = (data.total_amount * percentage) / 100;
          if (templateLine.debit_amount > 0) {
            line.debit_amount = amount;
          } else {
            line.credit_amount = amount;
          }
        } else if (templateLine.amount_type === 'manual') {
          // Los montos se proporcionarán manualmente
          line.debit_amount = data.amounts?.[index]?.debit_amount || 0;
          line.credit_amount = data.amounts?.[index]?.credit_amount || 0;
        }
        
        voucherData.voucher_lines.push(line);
      });
      
      return voucherData;
    } catch (error) {
      logger.error(`Error al generar comprobante desde plantilla ${templateId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener categorías disponibles
   * @returns {Promise<Array>} Lista de categorías
   */
  static async getCategories() {
    try {
      const [rows] = await pool.query(
        `SELECT DISTINCT category as name, COUNT(*) as total
         FROM voucher_templates 
         WHERE category IS NOT NULL AND category != ''
         GROUP BY category
         ORDER BY category`
      );
      return rows;
    } catch (error) {
      logger.error(`Error al obtener categorías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Alternar estado activo/inactivo de una plantilla
   * @param {number} id - ID de la plantilla
   * @param {boolean} isActive - Nuevo estado activo
   * @returns {Promise<Object>} Plantilla actualizada
   */
  static async toggleActive(id, isActive) {
    try {
      const [result] = await pool.query(
        `UPDATE voucher_templates SET is_active = ?, updated_at = NOW() WHERE id = ?`,
        [isActive, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error(`La plantilla con ID ${id} no existe`);
      }
      
      return await this.findById(id);
    } catch (error) {
      logger.error(`Error al cambiar estado de la plantilla ${id}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = VoucherTemplate; 