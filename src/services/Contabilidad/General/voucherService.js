/**
 * Servicio para gestionar comprobantes contables
 * @module services/Contabilidad/General/voucherService
 */

const Voucher = require('../../../models/Contabilidad/General/voucherModel');
const VoucherType = require('../../../models/Contabilidad/General/voucherTypeModel');
const logger = require('../../../utils/logger');

/**
 * Validar un asiento contable (cuadre débito/crédito)
 * @param {Array} lines - Líneas del asiento a validar
 * @returns {Object} Resultado de la validación
 */
const validateVoucher = (lines) => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return {
      valid: false,
      errors: ['No se han proporcionado líneas para el comprobante']
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const errors = [];

  // Validar cada línea
  lines.forEach((line, index) => {
    // Validar que tenga una cuenta
    if (!line.account_id) {
      errors.push(`La línea ${index + 1} no tiene una cuenta contable asociada`);
    }

    // Validar que los montos sean números
    const debitAmount = parseFloat(line.debit_amount || 0);
    const creditAmount = parseFloat(line.credit_amount || 0);

    if (isNaN(debitAmount) || debitAmount < 0) {
      errors.push(`La línea ${index + 1} tiene un valor de débito inválido`);
    }

    if (isNaN(creditAmount) || creditAmount < 0) {
      errors.push(`La línea ${index + 1} tiene un valor de crédito inválido`);
    }

    // Validar que no tenga débito y crédito a la vez
    if (debitAmount > 0 && creditAmount > 0) {
      errors.push(`La línea ${index + 1} no puede tener valor en débito y crédito simultáneamente`);
    }

    // Sumar totales
    totalDebit += debitAmount;
    totalCredit += creditAmount;
  });

  // Validar cuadre del asiento
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    errors.push(`El comprobante no está cuadrado. Total débito: ${totalDebit}, Total crédito: ${totalCredit}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    totalDebit,
    totalCredit
  };
};

/**
 * Obtener todos los comprobantes contables con filtros
 * @param {Object} filters - Filtros para la búsqueda
 * @returns {Promise<Object>} Resultado con comprobantes y paginación
 */
const getAllVouchers = async (filters) => {
  try {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 25;

    // Preparar filtros
    const searchFilters = {
      ...filters,
      page,
      limit
    };

    // Obtener comprobantes según filtros
    const vouchers = await Voucher.findAll(searchFilters);
    
    // Obtener total para paginación
    const total = await Voucher.countAll(searchFilters);

    return {
      vouchers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error al obtener comprobantes: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener un comprobante por su ID
 * @param {number} id - ID del comprobante
 * @returns {Promise<Object>} Comprobante con sus líneas
 */
const getVoucherById = async (id) => {
  try {
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      throw new Error('Comprobante no encontrado');
    }
    
    return voucher;
  } catch (error) {
    logger.error(`Error al obtener comprobante por ID: ${error.message}`);
    throw error;
  }
};

/**
 * Crear un nuevo comprobante contable
 * @param {Object} data - Datos completos del comprobante
 * @param {number} userId - ID del usuario que crea
 * @returns {Promise<Object>} Resultado de la operación
 */
const createVoucher = async (data, userId) => {
  try {
    // Validar datos básicos del comprobante
    if (!data.voucher_type_id) {
      throw new Error('El tipo de comprobante es requerido');
    }
    
    if (!data.date) {
      throw new Error('La fecha del comprobante es requerida');
    }
    
    if (!data.fiscal_period_id) {
      throw new Error('El periodo fiscal es requerido');
    }
    
    // Validar las líneas si están presentes
    if (data.voucher_lines && Array.isArray(data.voucher_lines)) {
      const validation = validateVoucher(data.voucher_lines);
    
    if (!validation.valid) {
      throw new Error(`Error en la validación del comprobante: ${validation.errors.join(', ')}`);
    }
    }
    
    // Establecer el usuario que crea
    data.created_by = userId;
    
    // Crear el comprobante
    const result = await Voucher.create(data);
    
    return result;
  } catch (error) {
    logger.error(`Error al crear comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Actualizar un comprobante existente
 * @param {number} id - ID del comprobante
 * @param {Object} data - Datos actualizados
 * @param {number} userId - ID del usuario que actualiza
 * @returns {Promise<boolean>} Resultado de la operación
 */
const updateVoucher = async (id, data, userId) => {
  try {
    // Validar las líneas si están presentes
    if (data.voucher_lines && Array.isArray(data.voucher_lines)) {
      const validation = validateVoucher(data.voucher_lines);
    
    if (!validation.valid) {
      throw new Error(`Error en la validación del comprobante: ${validation.errors.join(', ')}`);
    }
    }
    
    // Establecer el usuario que actualiza
    data.updated_by = userId;
    
    // Actualizar el comprobante usando el método que maneja líneas
    const result = await Voucher.updateWithLines(id, data);
    
    return result;
  } catch (error) {
    logger.error(`Error al actualizar comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Aprobar un comprobante
 * @param {number} id - ID del comprobante
 * @param {number} userId - ID del usuario que aprueba
 * @returns {Promise<Object>} Resultado de la operación
 */
const approveVoucher = async (id, userId) => {
  try {
    const result = await Voucher.approve(id, userId);
    return result;
  } catch (error) {
    logger.error(`Error al aprobar comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Anular un comprobante
 * @param {number} id - ID del comprobante
 * @param {string} reason - Motivo de la anulación
 * @param {number} userId - ID del usuario que anula
 * @returns {Promise<boolean>} Resultado de la operación
 */
const cancelVoucher = async (id, reason, userId) => {
  try {
    if (!reason) {
      throw new Error('El motivo de anulación es obligatorio');
    }
    
    const result = await Voucher.cancel(id, reason, userId);
    return result;
  } catch (error) {
    logger.error(`Error al anular comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Duplicar un comprobante existente
 * @param {number} id - ID del comprobante a duplicar
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Nuevo comprobante creado
 */
const duplicateVoucher = async (id, userId) => {
  try {
    const result = await Voucher.duplicate(id, userId);
    return result;
  } catch (error) {
    logger.error(`Error al duplicar comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener todos los tipos de comprobantes
 * @returns {Promise<Array>} Lista de tipos de comprobantes
 */
const getVoucherTypes = async () => {
  try {
    const types = await VoucherType.findAll();
    return types;
  } catch (error) {
    logger.error(`Error al obtener tipos de comprobantes: ${error.message}`);
    throw error;
  }
};

/**
 * Crear un nuevo tipo de comprobante
 * @param {Object} data - Datos del tipo de comprobante
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Tipo de comprobante creado
 */
const createVoucherType = async (data, userId) => {
  try {
    const result = await VoucherType.create(data, userId);
    return result;
  } catch (error) {
    logger.error(`Error al crear tipo de comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Actualizar un tipo de comprobante
 * @param {string} id - ID del tipo de comprobante
 * @param {Object} data - Datos a actualizar
 * @param {number} userId - ID del usuario
 * @returns {Promise<boolean>} Resultado de la operación
 */
const updateVoucherType = async (id, data, userId) => {
  try {
    const result = await VoucherType.update(id, data, userId);
    return result;
  } catch (error) {
    logger.error(`Error al actualizar tipo de comprobante: ${error.message}`);
    throw error;
  }
};

/**
 * Generar reporte de comprobantes por período
 * @param {Object} filters - Filtros para el reporte
 * @returns {Promise<Object>} Datos del reporte
 */
const generateVoucherReport = async (filters) => {
  try {
    // Validar filtros mínimos
    if (!filters.start_date || !filters.end_date) {
      throw new Error('Las fechas de inicio y fin son obligatorias para el reporte');
    }
    
    // Obtener comprobantes para el reporte
    const vouchers = await Voucher.findAll({
      start_date: filters.start_date,
      end_date: filters.end_date,
      voucher_type_id: filters.voucher_type_id,
      status: filters.status
    });
    
    // Calcular totales
    let totalDebit = 0;
    let totalCredit = 0;
    
    vouchers.forEach(voucher => {
      totalDebit += parseFloat(voucher.total_debit || 0);
      totalCredit += parseFloat(voucher.total_credit || 0);
    });
    
    return {
      filters,
      vouchers,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        count: vouchers.length
      }
    };
  } catch (error) {
    logger.error(`Error al generar reporte de comprobantes: ${error.message}`);
    throw error;
  }
};

module.exports = {
  validateVoucher,
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  approveVoucher,
  cancelVoucher,
  duplicateVoucher,
  getVoucherTypes,
  createVoucherType,
  updateVoucherType,
  generateVoucherReport
}; 