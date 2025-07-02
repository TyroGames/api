/**
 * Rutas para gestión de acreedores de créditos hipotecarios
 * @module routes/Contabilidad/creditos/mortgageCreditorsRoutes
 */

const express = require('express');
const router = express.Router();

const MortgageCreditorsController = require('../../controllers/Creditos/MortgageCreditorsController');
const { verifyToken } = require('../../middlewares/auth');


// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);



// Rutas CRUD básicas

/**
 * @route GET /api/credits/creditors
 * @desc Obtener todos los acreedores de créditos con filtros opcionales
 * @access Privado
 */
router.get('/', MortgageCreditorsController.getAll);

/**
 * @route POST /api/credits/creditors
 * @desc Crear nuevo acreedor de crédito
 * @access Privado
 */
router.post('/', MortgageCreditorsController.create);

/**
 * @route GET /api/credits/creditors/:id
 * @desc Obtener acreedor de crédito por ID
 * @access Privado
 */
router.get('/:id', MortgageCreditorsController.getById);

/**
 * @route PUT /api/credits/creditors/:id
 * @desc Actualizar acreedor de crédito existente
 * @access Privado
 */
router.put('/:id', MortgageCreditorsController.update);

/**
 * @route DELETE /api/credits/creditors/:id
 * @desc Eliminar acreedor de crédito
 * @access Privado
 */
router.delete('/:id', MortgageCreditorsController.delete);

// Rutas específicas (deben ir antes de las rutas con parámetros)

/**
 * @route GET /api/credits/creditors/statistics
 * @desc Obtener estadísticas de acreedores de créditos
 * @access Privado
 */
router.get('/statistics', MortgageCreditorsController.getStatistics);

/**
 * @route GET /api/credits/creditors/form-options
 * @desc Obtener opciones para formularios
 * @access Privado
 */
router.get('/form-options', MortgageCreditorsController.getFormOptions);

/**
 * @route GET /api/credits/creditors/search-advanced
 * @desc Búsqueda avanzada de acreedores
 * @access Privado
 */
router.get('/search-advanced', MortgageCreditorsController.searchAdvanced);

/**
 * @route GET /api/credits/creditors/primary
 * @desc Obtener solo acreedores principales
 * @access Privado
 */
router.get('/primary', MortgageCreditorsController.getPrimaryCreditors);

/**
 * @route GET /api/credits/creditors/investors
 * @desc Obtener inversionistas
 * @access Privado
 */
router.get('/investors', MortgageCreditorsController.getInvestors);

/**
 * @route GET /api/credits/creditors/active-investments
 * @desc Obtener inversiones activas
 * @access Privado
 */
router.get('/active-investments', MortgageCreditorsController.getActiveInvestments);

/**
 * @route GET /api/credits/creditors/mortgage/:mortgageId
 * @desc Obtener acreedores por ID de crédito hipotecario
 * @access Privado
 */
router.get('/mortgage/:mortgageId', MortgageCreditorsController.getByMortgageId);

/**
 * @route POST /api/credits/creditors/mortgage/:mortgageId/change-primary
 * @desc Cambiar acreedor principal de un crédito
 * @access Privado
 */
router.post('/mortgage/:mortgageId/change-primary', MortgageCreditorsController.changePrimaryCreditor);

/**
 * @route GET /api/credits/creditors/third-party/:thirdPartyId
 * @desc Obtener acreedurías por ID de tercero
 * @access Privado
 */
router.get('/third-party/:thirdPartyId', MortgageCreditorsController.getByThirdPartyId);

/**
 * @route GET /api/credits/creditors/third-party/:thirdPartyId/can-delete
 * @desc Verificar si un tercero puede ser eliminado
 * @access Privado
 */
router.get('/third-party/:thirdPartyId/can-delete', MortgageCreditorsController.canDeleteThirdParty);

/**
 * @route GET /api/credits/creditors/third-party/:thirdPartyId/investment-summary
 * @desc Obtener resumen de inversiones por acreedor
 * @access Privado
 */
router.get('/third-party/:thirdPartyId/investment-summary', MortgageCreditorsController.getInvestmentSummaryByCreditor);


module.exports = router;
