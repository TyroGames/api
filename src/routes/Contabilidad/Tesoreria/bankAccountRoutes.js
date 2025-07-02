/**
 * Rutas para la gestión de cuentas bancarias
 * @module routes/Contabilidad/Tesoreria/bankAccountRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middlewares/auth');
const BankAccountController = require('../../../controllers/Contabilidad/Tesoreria/bankAccountController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas (ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/tesoreria/bank-accounts/summary
 * @desc Obtener resumen de cuentas bancarias por moneda
 * @access Privado
 */
router.get('/summary', BankAccountController.getSummary);

/**
 * @route GET /api/tesoreria/bank-accounts/search
 * @desc Buscar cuentas bancarias por texto
 * @query {string} q - Texto a buscar
 * @access Privado
 */
router.get('/search', BankAccountController.search);

/**
 * @route GET /api/tesoreria/bank-accounts/account-number/:accountNumber
 * @desc Obtener cuenta bancaria por número de cuenta
 * @access Privado
 */
router.get('/account-number/:accountNumber', BankAccountController.getByAccountNumber);

// ============================================================
// Rutas de reportes para cuentas bancarias (ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/tesoreria/bank-accounts/reports/balances
 * @desc Generar reporte de saldos de cuentas bancarias
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @query {string} account_type - Filtro por tipo de cuenta
 * @query {string} bank_name - Filtro por banco
 * @access Privado
 */
router.get('/reports/balances', BankAccountController.generateBalancesReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/movements
 * @desc Generar reporte de movimientos bancarios
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @query {number} account_id - ID de cuenta específica (opcional)
 * @access Privado
 */
router.get('/reports/movements', BankAccountController.generateMovementsReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/cash-flow
 * @desc Generar reporte de flujo de caja por cuenta
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @query {number} account_id - ID de cuenta específica (opcional)
 * @access Privado
 */
router.get('/reports/cash-flow', BankAccountController.generateCashFlowReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/consolidated
 * @desc Generar reporte consolidado de posición bancaria
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date - Fecha de corte (opcional, por defecto hoy)
 * @access Privado
 */
router.get('/reports/consolidated', BankAccountController.generateConsolidatedReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/currency-analysis
 * @desc Generar reporte de análisis por moneda
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date - Fecha de corte (opcional)
 * @access Privado
 */
router.get('/reports/currency-analysis', BankAccountController.generateCurrencyAnalysisReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/transfers
 * @desc Generar reporte de transferencias interbancarias
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @access Privado
 */
router.get('/reports/transfers', BankAccountController.generateTransfersReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/reconciliations
 * @desc Generar reporte de conciliaciones bancarias
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @query {number} account_id - ID de cuenta específica (opcional)
 * @access Privado
 */
router.get('/reports/reconciliations', BankAccountController.generateReconciliationsReport);

/**
 * @route GET /api/tesoreria/bank-accounts/reports/account-statement/:id
 * @desc Generar estado de cuenta bancaria específica
 * @param {number} id - ID de la cuenta bancaria
 * @query {string} format - Formato del reporte (pdf, json)
 * @query {string} date_from - Fecha desde
 * @query {string} date_to - Fecha hasta
 * @access Privado
 */
router.get('/reports/account-statement/:id', BankAccountController.generateAccountStatement);

// ============================================================
// Rutas principales para Cuentas Bancarias
// ============================================================

/**
 * @route GET /api/tesoreria/bank-accounts
 * @desc Obtener todas las cuentas bancarias
 * @query {string} account_number - Filtro por número de cuenta
 * @query {string} bank_name - Filtro por nombre del banco
 * @query {string} account_type - Filtro por tipo de cuenta
 * @query {number} currency_id - Filtro por moneda
 * @query {boolean} is_active - Filtro por estado activo/inactivo
 * @query {number} limit - Límite de resultados
 * @access Privado
 */
router.get('/', BankAccountController.getAll);

/**
 * @route POST /api/tesoreria/bank-accounts
 * @desc Crear una nueva cuenta bancaria
 * @body {string} account_number - Número de cuenta (requerido)
 * @body {string} name - Nombre de la cuenta (requerido)
 * @body {string} bank_name - Nombre del banco (requerido)
 * @body {string} account_type - Tipo de cuenta: savings, checking, credit, investment, other (requerido)
 * @body {number} currency_id - ID de la moneda (requerido)
 * @body {number} gl_account_id - ID de la cuenta contable (requerido)
 * @body {number} initial_balance - Saldo inicial (opcional)
 * @body {boolean} is_active - Estado activo (opcional, por defecto true)
 * @access Privado
 */
router.post('/', BankAccountController.create);

/**
 * @route GET /api/tesoreria/bank-accounts/:id
 * @desc Obtener una cuenta bancaria por ID
 * @access Privado
 */
router.get('/:id', BankAccountController.getById);

/**
 * @route PUT /api/tesoreria/bank-accounts/:id
 * @desc Actualizar una cuenta bancaria existente
 * @body {string} account_number - Número de cuenta (opcional)
 * @body {string} name - Nombre de la cuenta (opcional)
 * @body {string} bank_name - Nombre del banco (opcional)
 * @body {string} account_type - Tipo de cuenta (opcional)
 * @body {number} currency_id - ID de la moneda (opcional)
 * @body {number} gl_account_id - ID de la cuenta contable (opcional)
 * @body {boolean} is_active - Estado activo (opcional)
 * @access Privado
 */
router.put('/:id', BankAccountController.update);

/**
 * @route DELETE /api/tesoreria/bank-accounts/:id
 * @desc Desactivar una cuenta bancaria (soft delete)
 * @access Privado
 */
router.delete('/:id', BankAccountController.deactivate);

// ============================================================
// Rutas de operaciones específicas
// ============================================================

/**
 * @route GET /api/tesoreria/bank-accounts/:id/balance
 * @desc Obtener el saldo actual de una cuenta bancaria
 * @access Privado
 */
router.get('/:id/balance', BankAccountController.getBalance);

/**
 * @route POST /api/tesoreria/bank-accounts/:id/activate
 * @desc Activar una cuenta bancaria desactivada
 * @access Privado
 */
router.post('/:id/activate', BankAccountController.activate);

/**
 * @route PATCH /api/tesoreria/bank-accounts/:id/toggle-active
 * @desc Alternar estado activo/inactivo de una cuenta bancaria
 * @body {boolean} is_active - Nuevo estado activo
 * @access Privado
 */
router.patch('/:id/toggle-active', BankAccountController.toggleActive);

module.exports = router; 