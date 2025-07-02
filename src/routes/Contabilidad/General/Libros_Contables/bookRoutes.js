/**
 * Rutas para el módulo de Libros Contables
 * @module routes/Contabilidad/General/Libros_Contables/bookRoutes
 */

const express = require('express');
const router = express.Router();
const BookController = require('../../../../controllers/Contabilidad/General/Libros_Contables/bookController');
const { verifyToken } = require('../../../../middlewares/auth');
const logger = require('../../../../utils/logger');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Middleware de logging para todas las rutas de libros contables
router.use((req, res, next) => {
    logger.info(`[LIBROS_CONTABLES] ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user?.id || 'N/A'}`);
    next();
});

/**
 * @route   GET /api/contabilidad/libros-contables/filter-data
 * @desc    Obtener datos para filtros (períodos fiscales, cuentas, etc.)
 * @access  Private
 */
router.get('/filter-data', BookController.getFilterData);

/**
 * @route   GET /api/contabilidad/libros-contables/libro-diario
 * @desc    Obtener libro diario con filtros y paginación
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {string} [status] - Estado del asiento (draft|posted|reversed)
 * @params  {number} [third_party_id] - ID del tercero
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {string} [entry_number] - Número de asiento (búsqueda parcial)
 * @params  {number} [page=1] - Página (mínimo 1)
 * @params  {number} [limit=50] - Registros por página (máximo 500)
 * @params  {boolean} [include_details=false] - Incluir detalles de asientos
 */
router.get('/libro-diario', BookController.getLibroDiario);

/**
 * @route   GET /api/contabilidad/libros-contables/libro-mayor
 * @desc    Obtener libro mayor por cuenta
 * @access  Private
 * @params  {number} account_id - ID de la cuenta contable (requerido)
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 */
router.get('/libro-mayor', BookController.getLibroMayor);

/**
 * @route   GET /api/contabilidad/libros-contables/balance-comprobacion
 * @desc    Obtener balance de comprobación
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {boolean} [include_zero_balances=false] - Incluir cuentas con saldo cero
 */
router.get('/balance-comprobacion', BookController.getBalanceComprobacion);

// ===============================
// RUTAS DE EXPORTACIÓN A PDF
// ===============================

/**
 * @route   GET /api/contabilidad/libros-contables/export/libro-diario/pdf
 * @desc    Exportar libro diario a PDF
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {string} [status] - Estado del asiento (draft|posted|reversed)
 * @params  {number} [third_party_id] - ID del tercero
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {string} [entry_number] - Número de asiento (búsqueda parcial)
 * @params  {boolean} [include_details=true] - Incluir detalles de asientos
 */
router.get('/export/libro-diario/pdf', BookController.exportLibroDiarioPDF);

/**
 * @route   GET /api/contabilidad/libros-contables/export/libro-mayor/pdf
 * @desc    Exportar libro mayor a PDF
 * @access  Private
 * @params  {number} account_id - ID de la cuenta contable (requerido)
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 */
router.get('/export/libro-mayor/pdf', BookController.exportLibroMayorPDF);

/**
 * @route   GET /api/contabilidad/libros-contables/export/balance-comprobacion/pdf
 * @desc    Exportar balance de comprobación a PDF
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {boolean} [include_zero_balances=false] - Incluir cuentas con saldo cero
 */
router.get('/export/balance-comprobacion/pdf', BookController.exportBalanceComprobacionPDF);

// ===============================
// RUTAS DE EXPORTACIÓN A EXCEL
// ===============================

/**
 * @route   GET /api/contabilidad/libros-contables/export/libro-diario/excel
 * @desc    Exportar libro diario a Excel
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {string} [status] - Estado del asiento (draft|posted|reversed)
 * @params  {number} [third_party_id] - ID del tercero
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {string} [entry_number] - Número de asiento (búsqueda parcial)
 * @params  {boolean} [include_details=true] - Incluir detalles de asientos
 */
router.get('/export/libro-diario/excel', BookController.exportLibroDiarioExcel);

/**
 * @route   GET /api/contabilidad/libros-contables/export/libro-mayor/excel
 * @desc    Exportar libro mayor a Excel
 * @access  Private
 * @params  {number} account_id - ID de la cuenta contable (requerido)
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 */
router.get('/export/libro-mayor/excel', BookController.exportLibroMayorExcel);

/**
 * @route   GET /api/contabilidad/libros-contables/export/balance-comprobacion/excel
 * @desc    Exportar balance de comprobación a Excel
 * @access  Private
 * @params  {string} [fecha_inicio] - Fecha de inicio (YYYY-MM-DD)
 * @params  {string} [fecha_fin] - Fecha de fin (YYYY-MM-DD)
 * @params  {number} [fiscal_period_id] - ID del período fiscal
 * @params  {boolean} [include_zero_balances=false] - Incluir cuentas con saldo cero
 */
router.get('/export/balance-comprobacion/excel', BookController.exportBalanceComprobacionExcel);

// ===============================
// MANEJO DE ERRORES
// ===============================

// Middleware de manejo de errores específico para libros contables
router.use((err, req, res, next) => {
    logger.error(`[LIBROS_CONTABLES_ERROR] ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'N/A'
    });

    // Errores específicos de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.details || [err.message]
        });
    }

    // Errores de base de datos
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
            success: false,
            message: 'Error en la estructura de la base de datos',
            error: 'Contacte al administrador del sistema'
        });
    }

    // Error de cuenta no encontrada
    if (err.message.includes('Cuenta contable no encontrada')) {
        return res.status(404).json({
            success: false,
            message: 'Cuenta contable no encontrada',
            error: 'La cuenta especificada no existe o no está activa'
        });
    }

    // Error de permisos
    if (err.name === 'UnauthorizedError' || err.message.includes('permission')) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para realizar esta acción',
            error: 'Contacte al administrador para obtener los permisos necesarios'
        });
    }

    // Error genérico del servidor
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error del sistema'
    });
});

module.exports = router;