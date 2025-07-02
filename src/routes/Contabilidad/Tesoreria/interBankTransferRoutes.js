/**
 * Rutas para la gestión de transferencias interbancarias en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/interBankTransferRoutes
 */

const express = require('express');
const router = express.Router();
const InterBankTransferController = require('../../../controllers/Contabilidad/Tesoreria/interBankTransferController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers:
 *   get:
 *     summary: Obtener todas las transferencias interbancarias
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_bank_account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de cuenta bancaria origen
 *       - in: query
 *         name: to_bank_account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de cuenta bancaria destino
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_transit, completed, failed, cancelled]
 *         description: Filtrar por estado de la transferencia
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
 *         name: transfer_number
 *         schema:
 *           type: string
 *         description: Filtrar por número de transferencia
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de transferencias interbancarias obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', InterBankTransferController.getAll);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/search:
 *   get:
 *     summary: Buscar transferencias interbancarias por texto
 *     tags: [Transferencias Interbancarias]
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
router.get('/search', InterBankTransferController.search);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/pending-critical:
 *   get:
 *     summary: Obtener transferencias pendientes críticas
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days_threshold
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Días de antigüedad para considerar crítico
 *     responses:
 *       200:
 *         description: Transferencias críticas obtenidas exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pending-critical', InterBankTransferController.getPendingCritical);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/summary:
 *   get:
 *     summary: Obtener resumen global de transferencias por período
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Resumen global obtenido exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/summary', InterBankTransferController.getSummaryByPeriod);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/account/{accountId}:
 *   get:
 *     summary: Obtener transferencias interbancarias por cuenta bancaria
 *     tags: [Transferencias Interbancarias]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_transit, completed, failed, cancelled]
 *         description: Filtrar por estado de la transferencia
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [incoming, outgoing]
 *         description: Filtrar por dirección (incoming=entrante, outgoing=saliente)
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
 *         description: Transferencias por cuenta obtenidas exitosamente
 *       400:
 *         description: ID de cuenta inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId', InterBankTransferController.getByBankAccount);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/account/{accountId}/summary:
 *   get:
 *     summary: Obtener resumen de transferencias por cuenta y período
 *     tags: [Transferencias Interbancarias]
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
 *         description: Resumen por cuenta obtenido exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/summary', InterBankTransferController.getSummaryByPeriod);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers:
 *   post:
 *     summary: Crear una nueva transferencia interbancaria
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_bank_account_id
 *               - to_bank_account_id
 *               - transfer_date
 *               - amount
 *             properties:
 *               from_bank_account_id:
 *                 type: integer
 *                 description: ID de la cuenta bancaria origen
 *               to_bank_account_id:
 *                 type: integer
 *                 description: ID de la cuenta bancaria destino
 *               transfer_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la transferencia
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Monto a transferir
 *               fee_amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 default: 0
 *                 description: Monto de comisiones (opcional)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción de la transferencia (opcional)
 *               reference:
 *                 type: string
 *                 maxLength: 50
 *                 description: Referencia bancaria (opcional)
 *     responses:
 *       201:
 *         description: Transferencia interbancaria creada exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', InterBankTransferController.create);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/{id}:
 *   get:
 *     summary: Obtener una transferencia interbancaria por ID
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transferencia interbancaria
 *     responses:
 *       200:
 *         description: Transferencia interbancaria obtenida exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Transferencia interbancaria no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', InterBankTransferController.getById);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/{id}/process:
 *   post:
 *     summary: Procesar una transferencia interbancaria
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transferencia interbancaria
 *     responses:
 *       200:
 *         description: Transferencia procesada exitosamente
 *       400:
 *         description: ID inválido o transferencia no puede ser procesada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/process', InterBankTransferController.process);

/**
 * @swagger
 * /api/tesoreria/inter-bank-transfers/{id}/cancel:
 *   post:
 *     summary: Cancelar una transferencia interbancaria
 *     tags: [Transferencias Interbancarias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transferencia interbancaria
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 255
 *                 description: Razón de la cancelación (opcional)
 *     responses:
 *       200:
 *         description: Transferencia cancelada exitosamente
 *       400:
 *         description: ID inválido o transferencia ya cancelada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/cancel', InterBankTransferController.cancel);

module.exports = router;