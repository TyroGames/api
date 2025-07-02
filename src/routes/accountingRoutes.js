const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const AccountTypeController = require('../controllers/accountTypeController');
const ChartOfAccountsController = require('../controllers/chartOfAccountsController');
const JournalEntryController = require('../controllers/journalEntryController');
const PucAccountController = require('../controllers/pucAccountController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Tipos de Cuenta
// ============================================================
/**
 * @route GET /api/accounting/account-types
 * @desc Obtener todos los tipos de cuenta
 * @access Privado
 */
router.get('/account-types', AccountTypeController.getAll);

/**
 * @route GET /api/accounting/account-types/:id
 * @desc Obtener un tipo de cuenta por su ID
 * @access Privado
 */
router.get('/account-types/:id', AccountTypeController.getById);

/**
 * @route POST /api/accounting/account-types
 * @desc Crear un nuevo tipo de cuenta
 * @access Privado
 */
router.post('/account-types', AccountTypeController.create);

/**
 * @route PUT /api/accounting/account-types/:id
 * @desc Actualizar un tipo de cuenta existente
 * @access Privado
 */
router.put('/account-types/:id', AccountTypeController.update);

/**
 * @route DELETE /api/accounting/account-types/:id
 * @desc Eliminar un tipo de cuenta
 * @access Privado
 */
router.delete('/account-types/:id', AccountTypeController.delete);

// ============================================================
// Rutas para Plan Único de Cuentas (PUC)
// ============================================================
/**
 * @route GET /api/accounting/puc-accounts
 * @desc Obtener todas las cuentas PUC
 * @access Privado
 */
router.get('/puc-accounts', PucAccountController.getAll);

/**
 * @route GET /api/accounting/puc-accounts/:id
 * @desc Obtener una cuenta PUC por su ID
 * @access Privado
 */
router.get('/puc-accounts/:id', PucAccountController.getById);

/**
 * @route GET /api/accounting/puc-accounts/code/:code
 * @desc Obtener una cuenta PUC por su código
 * @access Privado
 */
router.get('/puc-accounts/code/:code', PucAccountController.getByCode);

/**
 * @route GET /api/accounting/puc-accounts/children/:parentId
 * @desc Obtener las cuentas hijas de una cuenta padre
 * @access Privado
 */
router.get('/puc-accounts/children/:parentId', PucAccountController.getChildrenByParentId);

/**
 * @route POST /api/accounting/puc-accounts
 * @desc Crear una nueva cuenta PUC
 * @access Privado
 */
router.post('/puc-accounts', PucAccountController.create);

/**
 * @route PUT /api/accounting/puc-accounts/:id
 * @desc Actualizar una cuenta PUC existente
 * @access Privado
 */
router.put('/puc-accounts/:id', PucAccountController.update);

/**
 * @route DELETE /api/accounting/puc-accounts/:id
 * @desc Eliminar una cuenta PUC
 * @access Privado
 */
router.delete('/puc-accounts/:id', PucAccountController.delete);

// ============================================================
// Rutas para Plan de Cuentas
// ============================================================
/**
 * @route GET /api/accounting/chart-of-accounts
 * @desc Obtener todas las cuentas contables
 * @access Privado
 */
router.get('/chart-of-accounts', ChartOfAccountsController.getAll);

/**
 * @route GET /api/accounting/chart-of-accounts/hierarchical
 * @desc Obtener cuentas contables jerárquicamente
 * @access Privado
 */
router.get('/chart-of-accounts/hierarchical', ChartOfAccountsController.getHierarchical);

/**
 * @route GET /api/accounting/chart-of-accounts/:id
 * @desc Obtener una cuenta contable por su ID
 * @access Privado
 */
router.get('/chart-of-accounts/:id', ChartOfAccountsController.getById);

/**
 * @route GET /api/accounting/chart-of-accounts/code/:code
 * @desc Obtener una cuenta contable por su código
 * @access Privado
 */
router.get('/chart-of-accounts/code/:code', ChartOfAccountsController.getByCode);

/**
 * @route POST /api/accounting/chart-of-accounts
 * @desc Crear una nueva cuenta contable
 * @access Privado
 */
router.post('/chart-of-accounts', ChartOfAccountsController.create);

/**
 * @route PUT /api/accounting/chart-of-accounts/:id
 * @desc Actualizar una cuenta contable existente
 * @access Privado
 */
router.put('/chart-of-accounts/:id', ChartOfAccountsController.update);

/**
 * @route DELETE /api/accounting/chart-of-accounts/:id
 * @desc Eliminar una cuenta contable
 * @access Privado
 */
router.delete('/chart-of-accounts/:id', ChartOfAccountsController.delete);

/**
 * @route GET /api/accounting/chart-of-accounts/:accountId/balance/:fiscalPeriodId
 * @desc Obtener el saldo de una cuenta contable
 * @access Privado
 */
router.get('/chart-of-accounts/:accountId/balance/:fiscalPeriodId', ChartOfAccountsController.getBalance);

// ============================================================
// Rutas para Asientos Contables
// ============================================================
/**
 * @route GET /api/accounting/journal-entries
 * @desc Obtener todos los asientos contables
 * @access Privado
 */
router.get('/journal-entries', JournalEntryController.getAll);

/**
 * @route GET /api/accounting/journal-entries/:id
 * @desc Obtener un asiento contable por su ID
 * @access Privado
 */
router.get('/journal-entries/:id', JournalEntryController.getById);

/**
 * @route GET /api/accounting/journal-entries/number/:entryNumber
 * @desc Obtener un asiento contable por su número
 * @access Privado
 */
router.get('/journal-entries/number/:entryNumber', JournalEntryController.getByEntryNumber);

/**
 * @route POST /api/accounting/journal-entries
 * @desc Crear un nuevo asiento contable
 * @access Privado
 */
router.post('/journal-entries', JournalEntryController.create);

/**
 * @route PUT /api/accounting/journal-entries/:id
 * @desc Actualizar un asiento contable existente
 * @access Privado
 */
router.put('/journal-entries/:id', JournalEntryController.update);

/**
 * @route POST /api/accounting/journal-entries/:id/post
 * @desc Contabilizar un asiento
 * @access Privado
 */
router.post('/journal-entries/:id/post', JournalEntryController.post);

/**
 * @route POST /api/accounting/journal-entries/:id/reverse
 * @desc Revertir un asiento contable
 * @access Privado
 */
router.post('/journal-entries/:id/reverse', JournalEntryController.reverse);

module.exports = router; 