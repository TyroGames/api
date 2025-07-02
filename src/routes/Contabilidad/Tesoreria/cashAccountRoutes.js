/**
 * Rutas para la gestión de cuentas de efectivo en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/cashAccountRoutes
 */

const express = require('express');
const router = express.Router();
const CashAccountController = require('../../../controllers/Contabilidad/Tesoreria/cashAccountController');
const { verifyToken } = require('../../../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/cash-accounts:
 *   get:
 *     summary: Obtener todas las cuentas de efectivo
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: is_petty_cash
 *         schema:
 *           type: boolean
 *         description: Filtrar por tipo de caja (menor o general)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrar por ubicación
 *       - in: query
 *         name: responsible_user_id
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario responsable
 *       - in: query
 *         name: currency_id
 *         schema:
 *           type: integer
 *         description: Filtrar por moneda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de cuentas de efectivo obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', CashAccountController.getAll);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/search:
 *   get:
 *     summary: Buscar cuentas de efectivo por texto
 *     tags: [Cuentas de Efectivo]
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
router.get('/search', CashAccountController.search);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/summary:
 *   get:
 *     summary: Obtener resumen de cuentas de efectivo por moneda
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/summary', CashAccountController.getSummaryByCurrency);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/my-accounts:
 *   get:
 *     summary: Obtener mis cuentas de efectivo asignadas
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mis cuentas de efectivo obtenidas exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/my-accounts', CashAccountController.getMyAccounts);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/responsible/{userId}:
 *   get:
 *     summary: Obtener cuentas de efectivo por responsable
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario responsable
 *     responses:
 *       200:
 *         description: Cuentas por responsable obtenidas exitosamente
 *       400:
 *         description: ID de usuario inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/responsible/:userId', CashAccountController.getByResponsible);

/**
 * @swagger
 * /api/tesoreria/cash-accounts:
 *   post:
 *     summary: Crear una nueva cuenta de efectivo
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - currency_id
 *               - gl_account_id
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 description: Código único de la cuenta de efectivo
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nombre descriptivo de la cuenta
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción detallada (opcional)
 *               currency_id:
 *                 type: integer
 *                 description: ID de la moneda
 *               gl_account_id:
 *                 type: integer
 *                 description: ID de la cuenta contable asociada
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 description: Ubicación física de la caja (opcional)
 *               responsible_user_id:
 *                 type: integer
 *                 description: ID del usuario responsable (opcional)
 *               max_amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Monto máximo permitido (opcional)
 *               current_balance:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Saldo inicial (opcional)
 *               is_petty_cash:
 *                 type: boolean
 *                 description: Indica si es una caja menor
 *     responses:
 *       201:
 *         description: Cuenta de efectivo creada exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', CashAccountController.create);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/{id}:
 *   get:
 *     summary: Obtener una cuenta de efectivo por ID
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
 *     responses:
 *       200:
 *         description: Cuenta de efectivo obtenida exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Cuenta de efectivo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', CashAccountController.getById);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/{id}:
 *   put:
 *     summary: Actualizar una cuenta de efectivo
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 description: Código único de la cuenta de efectivo
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Nombre descriptivo de la cuenta
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción detallada
 *               currency_id:
 *                 type: integer
 *                 description: ID de la moneda
 *               gl_account_id:
 *                 type: integer
 *                 description: ID de la cuenta contable asociada
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 description: Ubicación física de la caja
 *               responsible_user_id:
 *                 type: integer
 *                 description: ID del usuario responsable
 *               max_amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0
 *                 description: Monto máximo permitido
 *               is_petty_cash:
 *                 type: boolean
 *                 description: Indica si es una caja menor
 *               is_active:
 *                 type: boolean
 *                 description: Estado activo/inactivo
 *     responses:
 *       200:
 *         description: Cuenta de efectivo actualizada exitosamente
 *       400:
 *         description: Errores de validación o ID inválido
 *       404:
 *         description: Cuenta de efectivo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', CashAccountController.update);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/{id}/deactivate:
 *   delete:
 *     summary: Desactivar una cuenta de efectivo
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
 *     responses:
 *       200:
 *         description: Cuenta de efectivo desactivada exitosamente
 *       400:
 *         description: ID inválido o cuenta no puede ser desactivada
 *       404:
 *         description: Cuenta de efectivo no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id/deactivate', CashAccountController.deactivate);

/**
 * @swagger
 * /api/tesoreria/cash-accounts/{id}/balance:
 *   get:
 *     summary: Obtener saldo actual de una cuenta de efectivo
 *     tags: [Cuentas de Efectivo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta de efectivo
 *     responses:
 *       200:
 *         description: Saldo obtenido exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Cuenta de efectivo no encontrada o inactiva
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/balance', CashAccountController.getBalance);

module.exports = router;