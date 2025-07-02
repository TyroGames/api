/**
 * Rutas para la gestión de conciliaciones bancarias en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/bankReconciliationRoutes
 */

const express = require('express');
const router = express.Router();
const BankReconciliationController = require('../../../controllers/Contabilidad/Tesoreria/bankReconciliationController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/reconciliations:
 *   get:
 *     summary: Obtener todas las conciliaciones bancarias
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bank_account_id
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria para filtrar
 *       - in: query
 *         name: statement_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del extracto para filtrar
 *       - in: query
 *         name: statement_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del extracto para filtrar
 *       - in: query
 *         name: is_reconciled
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de conciliación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de conciliaciones bancarias obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', BankReconciliationController.getAll);

/**
 * @swagger
 * /api/tesoreria/reconciliations/search:
 *   get:
 *     summary: Buscar conciliaciones bancarias por texto
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Término de búsqueda (mínimo 2 caracteres)
 *     responses:
 *       200:
 *         description: Búsqueda completada exitosamente
 *       400:
 *         description: Término de búsqueda inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/search', BankReconciliationController.search);

/**
 * @swagger
 * /api/tesoreria/reconciliations/account/{accountId}/summary:
 *   get:
 *     summary: Obtener resumen de conciliaciones por cuenta bancaria
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del período
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del período
 *     responses:
 *       200:
 *         description: Resumen de conciliaciones obtenido exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/summary', BankReconciliationController.getSummaryByAccount);

/**
 * @swagger
 * /api/tesoreria/reconciliations/account/{accountId}/unreconciled:
 *   get:
 *     summary: Obtener transacciones no conciliadas de una cuenta bancaria
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar transacciones
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar transacciones
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer, payment, receipt]
 *         description: Tipo de transacción para filtrar
 *       - in: query
 *         name: amount_min
 *         schema:
 *           type: number
 *         description: Monto mínimo para filtrar
 *       - in: query
 *         name: amount_max
 *         schema:
 *           type: number
 *         description: Monto máximo para filtrar
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Transacciones no conciliadas obtenidas exitosamente
 *       400:
 *         description: ID de cuenta inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/unreconciled', BankReconciliationController.getUnreconciledTransactions);

/**
 * @swagger
 * /api/tesoreria/reconciliations:
 *   post:
 *     summary: Crear una nueva conciliación bancaria
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_account_id
 *               - statement_date
 *               - statement_balance
 *             properties:
 *               bank_account_id:
 *                 type: integer
 *                 description: ID de la cuenta bancaria
 *               statement_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del extracto bancario
 *               statement_balance:
 *                 type: number
 *                 format: decimal
 *                 description: Saldo según el extracto bancario
 *               reconciled_balance:
 *                 type: number
 *                 format: decimal
 *                 description: Saldo reconciliado inicial (opcional)
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs de transacciones a incluir automáticamente
 *     responses:
 *       201:
 *         description: Conciliación bancaria creada exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', BankReconciliationController.create);

/**
 * @swagger
 * /api/tesoreria/reconciliations/{id}:
 *   get:
 *     summary: Obtener una conciliación bancaria por ID
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación bancaria
 *     responses:
 *       200:
 *         description: Conciliación bancaria obtenida exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Conciliación bancaria no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', BankReconciliationController.getById);

/**
 * @swagger
 * /api/tesoreria/reconciliations/{id}/items:
 *   get:
 *     summary: Obtener items de una conciliación bancaria
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación bancaria
 *     responses:
 *       200:
 *         description: Items de conciliación obtenidos exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Conciliación bancaria no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/items', BankReconciliationController.getReconciliationItems);

/**
 * @swagger
 * /api/tesoreria/reconciliations/{id}/auto-reconcile:
 *   post:
 *     summary: Realizar conciliación automática
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación bancaria
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exact_match:
 *                 type: boolean
 *                 default: true
 *                 description: Activar matching exacto por fecha y monto
 *               reference_match:
 *                 type: boolean
 *                 default: true
 *                 description: Activar matching por número de referencia
 *               range_match:
 *                 type: boolean
 *                 default: true
 *                 description: Activar matching por rango de fechas
 *               max_days_diff:
 *                 type: integer
 *                 default: 3
 *                 minimum: 0
 *                 description: Máxima diferencia en días para matching por rango
 *               date_from:
 *                 type: string
 *                 format: date
 *                 description: Fecha inicial para buscar transacciones (opcional)
 *               date_to:
 *                 type: string
 *                 format: date
 *                 description: Fecha final para buscar transacciones (opcional)
 *     responses:
 *       200:
 *         description: Conciliación automática completada exitosamente
 *       400:
 *         description: ID inválido o criterios incorrectos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/auto-reconcile', BankReconciliationController.performAutoReconciliation);

/**
 * @swagger
 * /api/tesoreria/reconciliations/{id}/reconcile:
 *   post:
 *     summary: Conciliar transacciones manualmente
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación bancaria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_ids
 *             properties:
 *               transaction_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 description: Array de IDs de transacciones a conciliar
 *     responses:
 *       200:
 *         description: Transacciones conciliadas exitosamente
 *       400:
 *         description: ID inválido o array de transacciones vacío
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/reconcile', BankReconciliationController.reconcileTransactions);

/**
 * @swagger
 * /api/tesoreria/reconciliations/{id}/complete:
 *   post:
 *     summary: Completar una conciliación bancaria
 *     tags: [Conciliación Bancaria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la conciliación bancaria
 *     responses:
 *       200:
 *         description: Conciliación bancaria completada exitosamente
 *       400:
 *         description: ID inválido o conciliación ya completada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/complete', BankReconciliationController.completeReconciliation);

module.exports = router;