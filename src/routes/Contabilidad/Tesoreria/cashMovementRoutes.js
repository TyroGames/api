/**
 * Rutas para la gestión de movimientos de efectivo en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/cashMovementRoutes
 */

const express = require('express');
const router = express.Router();
const CashMovementController = require('../../../controllers/Contabilidad/Tesoreria/cashMovementController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/cash-movements:
 *   get:
 *     summary: Obtener todos los movimientos de efectivo
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cash_account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de cuenta de efectivo
 *       - in: query
 *         name: movement_type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer_in, transfer_out]
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filtrar por estado del movimiento
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar
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
 *         name: third_party_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de tercero
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de movimientos de efectivo obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', CashMovementController.getAll);

/**
 * @swagger
 * /api/tesoreria/cash-movements/search:
 *   get:
 *     summary: Buscar movimientos de efectivo por texto
 *     tags: [Movimientos de Efectivo]
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
router.get('/search', CashMovementController.search);

/**
 * @swagger
 * /api/tesoreria/cash-movements/transfer:
 *   post:
 *     summary: Transferir efectivo entre cuentas
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_cash_account_id
 *               - to_cash_account_id
 *               - amount
 *               - description
 *               - date
 *             properties:
 *               from_cash_account_id:
 *                 type: integer
 *                 description: ID de la cuenta de efectivo origen
 *               to_cash_account_id:
 *                 type: integer
 *                 description: ID de la cuenta de efectivo destino
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Monto a transferir
 *               description:
 *                 type: string
 *                 description: Descripción de la transferencia
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la transferencia
 *     responses:
 *       201:
 *         description: Transferencia realizada exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/transfer', CashMovementController.transfer);

/**
 * @swagger
 * /api/tesoreria/cash-movements/account/{accountId}:
 *   get:
 *     summary: Obtener movimientos de efectivo por cuenta
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
 *       - in: query
 *         name: movement_type
 *         schema:
 *           type: string
 *           enum: [income, expense, transfer_in, transfer_out]
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filtrar por estado del movimiento
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial para filtrar
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final para filtrar
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Movimientos por cuenta obtenidos exitosamente
 *       400:
 *         description: ID de cuenta inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId', CashMovementController.getByCashAccount);

/**
 * @swagger
 * /api/tesoreria/cash-movements/account/{accountId}/summary:
 *   get:
 *     summary: Obtener resumen de movimientos por cuenta y período
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
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
 *         description: Resumen obtenido exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/summary', CashMovementController.getSummaryByPeriod);

/**
 * @swagger
 * /api/tesoreria/cash-movements:
 *   post:
 *     summary: Crear un nuevo movimiento de efectivo
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cash_account_id
 *               - movement_type
 *               - date
 *               - amount
 *             properties:
 *               cash_account_id:
 *                 type: integer
 *                 description: ID de la cuenta de efectivo
 *               movement_type:
 *                 type: string
 *                 enum: [income, expense, transfer_in, transfer_out]
 *                 description: Tipo de movimiento
 *               reference_number:
 *                 type: string
 *                 maxLength: 50
 *                 description: Número de referencia (opcional, se genera automáticamente)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del movimiento
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción del movimiento
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Monto del movimiento
 *               document_type:
 *                 type: string
 *                 description: Tipo de documento soporte (opcional)
 *               document_id:
 *                 type: integer
 *                 description: ID del documento soporte (opcional)
 *               third_party_id:
 *                 type: integer
 *                 description: ID del tercero relacionado (opcional)
 *               auto_confirm:
 *                 type: boolean
 *                 description: Confirmar automáticamente el movimiento
 *     responses:
 *       201:
 *         description: Movimiento de efectivo creado exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', CashMovementController.create);

/**
 * @swagger
 * /api/tesoreria/cash-movements/{id}:
 *   get:
 *     summary: Obtener un movimiento de efectivo por ID
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del movimiento de efectivo
 *     responses:
 *       200:
 *         description: Movimiento de efectivo obtenido exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Movimiento de efectivo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', CashMovementController.getById);

/**
 * @swagger
 * /api/tesoreria/cash-movements/{id}/confirm:
 *   post:
 *     summary: Confirmar un movimiento de efectivo
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del movimiento de efectivo
 *     responses:
 *       200:
 *         description: Movimiento confirmado exitosamente
 *       400:
 *         description: ID inválido o movimiento no puede ser confirmado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/confirm', CashMovementController.confirm);

/**
 * @swagger
 * /api/tesoreria/cash-movements/{id}/cancel:
 *   post:
 *     summary: Cancelar un movimiento de efectivo
 *     tags: [Movimientos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del movimiento de efectivo
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación (opcional)
 *     responses:
 *       200:
 *         description: Movimiento cancelado exitosamente
 *       400:
 *         description: ID inválido o movimiento ya cancelado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/cancel', CashMovementController.cancel);

module.exports = router;