/**
 * Rutas para la gestión de períodos fiscales
 * @module routes/Contabilidad/General/Periodos_Fiscales/fiscalPeriodRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const FiscalPeriodController = require('../../../../controllers/Contabilidad/General/Periodos_Fiscales/fiscalPeriodController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas para Períodos Fiscales (ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/accounting/fiscal-periods/current
 * @desc Obtener el período fiscal activo actual
 * @access Privado
 */
router.get('/current', FiscalPeriodController.getCurrentPeriod);

/**
 * @route GET /api/accounting/fiscal-periods/by-year/:yearId
 * @desc Obtener períodos fiscales por año fiscal
 * @access Privado
 */
router.get('/by-year/:yearId', FiscalPeriodController.getPeriodsByYear);

/**
 * @route GET /api/accounting/fiscal-periods/company/:companyId
 * @desc Obtener períodos fiscales por compañía
 * @access Privado
 */
router.get('/company/:companyId', FiscalPeriodController.getPeriodsByCompany);

/**
 * @route GET /api/accounting/fiscal-periods/open
 * @desc Obtener períodos fiscales abiertos
 * @access Privado
 */
router.get('/open', FiscalPeriodController.getOpenPeriods);

/**
 * @route GET /api/accounting/fiscal-periods/closed
 * @desc Obtener períodos fiscales cerrados
 * @access Privado
 */
router.get('/closed', FiscalPeriodController.getClosedPeriods);

/**
 * @route GET /api/accounting/fiscal-periods/pending-close
 * @desc Obtener períodos fiscales pendientes de cierre
 * @access Privado
 */
router.get('/pending-close', FiscalPeriodController.getPendingClosePeriods);

/**
 * @route POST /api/accounting/fiscal-periods/generate-monthly/:yearId
 * @desc Generar períodos mensuales para un año fiscal
 * @access Privado
 */
router.post('/generate-monthly/:yearId', FiscalPeriodController.generateMonthlyPeriods);

/**
 * @route POST /api/accounting/fiscal-periods/validate-close-sequence
 * @desc Validar secuencia de cierre de períodos
 * @access Privado
 */
router.post('/validate-close-sequence', FiscalPeriodController.validateCloseSequence);

/**
 * @route POST /api/accounting/fiscal-periods/bulk-close
 * @desc Cierre masivo de períodos fiscales
 * @access Privado
 */
router.post('/bulk-close', FiscalPeriodController.bulkClosePeriods);

// ============================================================
// Rutas para Períodos Fiscales (CRUD básico)
// ============================================================

/**
 * @route GET /api/accounting/fiscal-periods
 * @desc Obtener todos los períodos fiscales
 * @access Privado
 */
router.get('/', FiscalPeriodController.getAll);

/**
 * @route POST /api/accounting/fiscal-periods
 * @desc Crear un nuevo período fiscal
 * @access Privado
 */
router.post('/', FiscalPeriodController.create);

/**
 * @route GET /api/accounting/fiscal-periods/:id
 * @desc Obtener un período fiscal por ID
 * @access Privado
 */
router.get('/:id', FiscalPeriodController.getById);

/**
 * @route PUT /api/accounting/fiscal-periods/:id
 * @desc Actualizar un período fiscal existente
 * @access Privado
 */
router.put('/:id', FiscalPeriodController.update);

/**
 * @route DELETE /api/accounting/fiscal-periods/:id
 * @desc Eliminar un período fiscal
 * @access Privado
 */
router.delete('/:id', FiscalPeriodController.delete);

/**
 * @route PATCH /api/accounting/fiscal-periods/:id/close
 * @desc Cerrar un período fiscal
 * @access Privado
 */
router.patch('/:id/close', FiscalPeriodController.closePeriod);

/**
 * @route PATCH /api/accounting/fiscal-periods/:id/reopen
 * @desc Reabrir un período fiscal
 * @access Privado
 */
router.patch('/:id/reopen', FiscalPeriodController.reopenPeriod);

/**
 * @route GET /api/accounting/fiscal-periods/:id/transactions
 * @desc Obtener transacciones de un período fiscal
 * @access Privado
 */
router.get('/:id/transactions', FiscalPeriodController.getPeriodTransactions);

/**
 * @route GET /api/accounting/fiscal-periods/:id/statistics
 * @desc Obtener estadísticas de un período fiscal
 * @access Privado
 */
router.get('/:id/statistics', FiscalPeriodController.getPeriodStatistics);

/**
 * @route GET /api/accounting/fiscal-periods/:id/vouchers
 * @desc Obtener comprobantes de un período fiscal
 * @access Privado
 */
router.get('/:id/vouchers', FiscalPeriodController.getPeriodVouchers);

/**
 * @route GET /api/accounting/fiscal-periods/:id/journal-entries
 * @desc Obtener asientos contables de un período fiscal
 * @access Privado
 */
router.get('/:id/journal-entries', FiscalPeriodController.getPeriodJournalEntries);

module.exports = router; 