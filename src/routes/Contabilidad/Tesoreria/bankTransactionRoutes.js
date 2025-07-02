/**
 * Rutas para la gestión de movimientos bancarios en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/bankTransactionRoutes
 */

const express = require('express');
const router = express.Router();
const BankTransactionController = require('../../../controllers/Contabilidad/Tesoreria/bankTransactionController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/tesoreria/transactions
 * @desc Obtener todos los movimientos bancarios
 * @query {number} bank_account_id - ID de la cuenta bancaria para filtrar
 * @query {string} transaction_type - Tipo de transacción: deposit, withdrawal, transfer, payment, receipt
 * @query {string} status - Estado: pending, cleared, bounced, voided
 * @query {string} date_from - Fecha inicial para filtrar
 * @query {string} date_to - Fecha final para filtrar
 * @query {number} amount_min - Monto mínimo para filtrar
 * @query {number} amount_max - Monto máximo para filtrar
 * @query {number} third_party_id - ID del tercero para filtrar
 * @query {number} limit - Número máximo de registros a retornar
 * @access Privado
 */
router.get('/', BankTransactionController.getAll);

/**
 * @route GET /api/tesoreria/transactions/search
 * @desc Buscar movimientos bancarios por texto
 * @query {string} q - Término de búsqueda (mínimo 2 caracteres)
 * @access Privado
 */
router.get('/search', BankTransactionController.search);

/**
 * @route GET /api/tesoreria/transactions/account/:accountId
 * @desc Obtener movimientos bancarios por cuenta
 * @query {number} limit - Número máximo de registros a retornar
 * @access Privado
 */
router.get('/account/:accountId', BankTransactionController.getByBankAccount);

/**
 * @route POST /api/tesoreria/transactions
 * @desc Crear un nuevo movimiento bancario
 * @body {number} bank_account_id - ID de la cuenta bancaria (requerido)
 * @body {string} transaction_type - Tipo: deposit, withdrawal, transfer, payment, receipt (requerido)
 * @body {string} date - Fecha de la transacción (requerido)
 * @body {number} amount - Monto de la transacción (requerido)
 * @body {string} description - Descripción de la transacción (opcional)
 * @body {string} reference_number - Número de referencia (opcional)
 * @body {number} third_party_id - ID del tercero relacionado (opcional)
 * @body {string} document_type - Tipo de documento relacionado (opcional)
 * @body {number} document_id - ID del documento relacionado (opcional)
 * @access Privado
 */
router.post('/', BankTransactionController.create);

/**
 * @route GET /api/tesoreria/transactions/:id
 * @desc Obtener un movimiento bancario por ID
 * @access Privado
 */
router.get('/:id', BankTransactionController.getById);

/**
 * @route PUT /api/tesoreria/transactions/:id
 * @desc Actualizar un movimiento bancario
 * @body {string} date - Fecha de la transacción (opcional)
 * @body {number} amount - Monto de la transacción (opcional)
 * @body {string} description - Descripción de la transacción (opcional)
 * @body {string} reference_number - Número de referencia (opcional)
 * @body {number} third_party_id - ID del tercero relacionado (opcional)
 * @access Privado
 */
router.put('/:id', BankTransactionController.update);

/**
 * @route POST /api/tesoreria/transactions/:id/confirm
 * @desc Confirmar un movimiento bancario pendiente
 * @body {string} cleared_date - Fecha de confirmación (opcional)
 * @access Privado
 */
router.post('/:id/confirm', BankTransactionController.confirm);

/**
 * @route POST /api/tesoreria/transactions/:id/void
 * @desc Anular un movimiento bancario
 * @body {string} reason - Motivo de la anulación (opcional)
 * @access Privado
 */
router.post('/:id/void', BankTransactionController.void);

module.exports = router; 