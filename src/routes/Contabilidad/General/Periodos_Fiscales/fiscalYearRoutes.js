/**
 * Rutas para la gestión de años fiscales
 * @module routes/Contabilidad/General/Periodos_Fiscales/fiscalYearRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const FiscalYearController = require('../../../../controllers/Contabilidad/General/Periodos_Fiscales/fiscalYearController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas para Años Fiscales (ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/accounting/fiscal-years/active
 * @desc Obtener el año fiscal activo
 * @access Privado
 */
router.get('/active', FiscalYearController.getActiveFiscalYear);

/**
 * @route GET /api/accounting/fiscal-years/company/:companyId
 * @desc Obtener años fiscales por compañía
 * @access Privado
 */
router.get('/company/:companyId', FiscalYearController.getYearsByCompany);

/**
 * @route GET /api/accounting/fiscal-years/year/:year
 * @desc Obtener año fiscal por número de año
 * @access Privado
 */
router.get('/year/:year', FiscalYearController.getByYear);

/**
 * @route GET /api/accounting/fiscal-years/closed
 * @desc Obtener años fiscales cerrados
 * @access Privado
 */
router.get('/closed', FiscalYearController.getClosedYears);

/**
 * @route GET /api/accounting/fiscal-years/open
 * @desc Obtener años fiscales abiertos
 * @access Privado
 */
router.get('/open', FiscalYearController.getOpenYears);

/**
 * @route POST /api/accounting/fiscal-years/validate-dates
 * @desc Validar fechas de año fiscal
 * @access Privado
 */
router.post('/validate-dates', FiscalYearController.validateDates);

/**
 * @route GET /api/accounting/fiscal-years/can-create-new
 * @desc Verificar si se puede crear un nuevo año fiscal
 * @access Privado
 */
router.get('/can-create-new', FiscalYearController.canCreateNew);

// ============================================================
// Rutas para Años Fiscales (CRUD básico)
// ============================================================

/**
 * @route GET /api/accounting/fiscal-years
 * @desc Obtener todos los años fiscales
 * @access Privado
 */
router.get('/', FiscalYearController.getAll);

/**
 * @route POST /api/accounting/fiscal-years
 * @desc Crear un nuevo año fiscal
 * @access Privado
 */
router.post('/', FiscalYearController.create);

/**
 * @route GET /api/accounting/fiscal-years/:id
 * @desc Obtener un año fiscal por ID
 * @access Privado
 */
router.get('/:id', FiscalYearController.getById);

/**
 * @route PUT /api/accounting/fiscal-years/:id
 * @desc Actualizar un año fiscal existente
 * @access Privado
 */
router.put('/:id', FiscalYearController.update);

/**
 * @route DELETE /api/accounting/fiscal-years/:id
 * @desc Eliminar un año fiscal
 * @access Privado
 */
router.delete('/:id', FiscalYearController.delete);

/**
 * @route PATCH /api/accounting/fiscal-years/:id/close
 * @desc Cerrar un año fiscal
 * @access Privado
 */
router.patch('/:id/close', FiscalYearController.closeFiscalYear);

/**
 * @route PATCH /api/accounting/fiscal-years/:id/activate
 * @desc Activar un año fiscal
 * @access Privado
 */
router.patch('/:id/activate', FiscalYearController.activateFiscalYear);

/**
 * @route GET /api/accounting/fiscal-years/:id/periods
 * @desc Obtener períodos de un año fiscal
 * @access Privado
 */
router.get('/:id/periods', FiscalYearController.getYearPeriods);

/**
 * @route POST /api/accounting/fiscal-years/:id/generate-periods
 * @desc Generar períodos para un año fiscal
 * @access Privado
 */
router.post('/:id/generate-periods', FiscalYearController.generatePeriods);

/**
 * @route GET /api/accounting/fiscal-years/:id/statistics
 * @desc Obtener estadísticas de un año fiscal
 * @access Privado
 */
router.get('/:id/statistics', FiscalYearController.getYearStatistics);

/**
 * @route GET /api/accounting/fiscal-years/:id/summary
 * @desc Obtener resumen de un año fiscal
 * @access Privado
 */
router.get('/:id/summary', FiscalYearController.getYearStatistics);

module.exports = router; 