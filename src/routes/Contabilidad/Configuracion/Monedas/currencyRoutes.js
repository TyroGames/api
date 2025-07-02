/**
 * Rutas para la gestión de monedas
 * @module routes/Contabilidad/Configuracion/Monedas/currencyRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const CurrencyController = require('../../../../controllers/Configuracion/currencyController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Monedas
// ============================================================

/**
 * @route GET /api/configuration/currencies
 * @desc Obtener todas las monedas
 * @access Privado
 */
router.get('/', CurrencyController.getAll);

/**
 * @route GET /api/configuration/currencies/:id
 * @desc Obtener una moneda por ID
 * @access Privado
 */
router.get('/:id', CurrencyController.getById);

/**
 * @route GET /api/configuration/currencies/code/:code
 * @desc Obtener una moneda por código
 * @access Privado
 */
router.get('/code/:code', CurrencyController.getByCode);

/**
 * @route GET /api/configuration/currencies/default
 * @desc Obtener la moneda predeterminada
 * @access Privado
 */
router.get('/default/get', CurrencyController.getDefault);

/**
 * @route POST /api/configuration/currencies
 * @desc Crear una nueva moneda
 * @access Privado
 */
router.post('/', CurrencyController.create);

/**
 * @route PUT /api/configuration/currencies/:id
 * @desc Actualizar una moneda existente
 * @access Privado
 */
router.put('/:id', CurrencyController.update);

/**
 * @route DELETE /api/configuration/currencies/:id
 * @desc Eliminar una moneda
 * @access Privado
 */
router.delete('/:id', CurrencyController.delete);

/**
 * @route PATCH /api/configuration/currencies/:id/set-default
 * @desc Establecer una moneda como predeterminada
 * @access Privado
 */
router.patch('/:id/set-default', CurrencyController.setAsDefault);

/**
 * @route GET /api/configuration/currencies/usage-stats
 * @desc Obtener estadísticas de uso de monedas
 * @access Privado
 */
router.get('/usage-stats', CurrencyController.getUsageStats);

module.exports = router; 