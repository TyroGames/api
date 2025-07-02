/**
 * Rutas para la gestión de arqueos de efectivo en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/cashReconciliationRoutes
 */

const express = require('express');
const router = express.Router();
const CashReconciliationController = require('../../../controllers/Contabilidad/Tesoreria/cashReconciliationController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations:
 *   get:
 *     summary: Obtener todos los arqueos de efectivo
 *     tags: [Arqueos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cash_account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de cuenta de efectivo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, adjusted]
 *         description: Filtrar por estado del arqueo
 *       - in: query
 *         name: difference_type
 *         schema:
 *           type: string
 *           enum: [balanced, overage, shortage]
 *         description: Filtrar por tipo de diferencia
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
 *         name: reconciled_by
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario que realizó el arqueo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de arqueos de efectivo obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', CashReconciliationController.getAll);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/search:
 *   get:
 *     summary: Buscar arqueos de efectivo por texto
 *     tags: [Arqueos de Efectivo]
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
router.get('/search', CashReconciliationController.search);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/pending-critical:
 *   get:
 *     summary: Obtener arqueos pendientes críticos
 *     tags: [Arqueos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days_threshold
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Días de antigüedad para considerar crítico
 *     responses:
 *       200:
 *         description: Arqueos críticos obtenidos exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/pending-critical', CashReconciliationController.getPendingCritical);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/summary:
 *   get:
 *     summary: Obtener resumen global de arqueos por período
 *     tags: [Arqueos de Efectivo]
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
router.get('/summary', CashReconciliationController.getSummaryByPeriod);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/account/{accountId}:
 *   get:
 *     summary: Obtener arqueos de efectivo por cuenta
 *     tags: [Arqueos de Efectivo]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, adjusted]
 *         description: Filtrar por estado del arqueo
 *       - in: query
 *         name: difference_type
 *         schema:
 *           type: string
 *           enum: [balanced, overage, shortage]
 *         description: Filtrar por tipo de diferencia
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
 *         description: Arqueos por cuenta obtenidos exitosamente
 *       400:
 *         description: ID de cuenta inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId', CashReconciliationController.getByCashAccount);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/account/{accountId}/summary:
 *   get:
 *     summary: Obtener resumen de arqueos por cuenta y período
 *     tags: [Arqueos de Efectivo]
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
 *         description: Resumen por cuenta obtenido exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/summary', CashReconciliationController.getSummaryByPeriod);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/account/{accountId}/statistics:
 *   get:
 *     summary: Obtener estadísticas de arqueos por cuenta
 *     tags: [Arqueos de Efectivo]
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
 *         name: last_months
 *         schema:
 *           type: integer
 *           default: 6
 *           minimum: 1
 *           maximum: 24
 *         description: Número de meses hacia atrás para análisis
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/account/:accountId/statistics', CashReconciliationController.getAccountStatistics);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations:
 *   post:
 *     summary: Crear un nuevo arqueo de efectivo
 *     tags: [Arqueos de Efectivo]
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
 *               - reconciliation_date
 *               - physical_count
 *             properties:
 *               cash_account_id:
 *                 type: integer
 *                 description: ID de la cuenta de efectivo
 *               reconciliation_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del arqueo
 *               physical_count:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Conteo físico del efectivo
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notas u observaciones del arqueo (opcional)
 *     responses:
 *       201:
 *         description: Arqueo de efectivo creado exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', CashReconciliationController.create);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/{id}:
 *   get:
 *     summary: Obtener un arqueo de efectivo por ID
 *     tags: [Arqueos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del arqueo de efectivo
 *     responses:
 *       200:
 *         description: Arqueo de efectivo obtenido exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Arqueo de efectivo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', CashReconciliationController.getById);

/**
 * @swagger
 * /api/tesoreria/cash-reconciliations/{id}/approve:
 *   post:
 *     summary: Aprobar un arqueo de efectivo
 *     tags: [Arqueos de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del arqueo de efectivo
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               create_adjustment:
 *                 type: boolean
 *                 default: false
 *                 description: Crear ajuste automático si hay diferencias
 *     responses:
 *       200:
 *         description: Arqueo aprobado exitosamente
 *       400:
 *         description: ID inválido o arqueo no puede ser aprobado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/approve', CashReconciliationController.approve);

module.exports = router; 