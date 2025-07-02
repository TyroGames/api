/**
 * Rutas para la gestión de tipos de créditos hipotecarios
 * @module routes/Creditos/creditTypesRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const CreditTypesController = require('../../controllers/Creditos/CreditTypesController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas (DEBEN IR ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/credits/types/active
 * @desc Obtener todos los tipos de créditos activos
 * @access Privado
 */
router.get('/active', CreditTypesController.getActive);

/**
 * @route GET /api/credits/types/options
 * @desc Obtener opciones para formularios (enums)
 * @access Privado
 */
router.get('/options', CreditTypesController.getFormOptions);

/**
 * @route GET /api/credits/types/statistics
 * @desc Obtener estadísticas de tipos de créditos
 * @access Privado
 */
router.get('/statistics', CreditTypesController.getStatistics);

/**
 * @route GET /api/credits/types/check-code/:code
 * @desc Verificar disponibilidad de código
 * @access Privado
 */
router.get('/check-code/:code', CreditTypesController.checkCodeAvailability);

/**
 * @route GET /api/credits/types/code/:code
 * @desc Obtener un tipo de crédito por código
 * @access Privado
 */
router.get('/code/:code', CreditTypesController.getByCode);

// ============================================================
// Rutas principales CRUD
// ============================================================

/**
 * @route GET /api/credits/types
 * @desc Obtener todos los tipos de créditos con filtros opcionales
 * @access Privado
 * @query {string} code - Filtrar por código (búsqueda parcial)
 * @query {string} name - Filtrar por nombre (búsqueda parcial)
 * @query {string} payment_frequency - Filtrar por frecuencia de pago
 * @query {string} interest_calculation_method - Filtrar por método de cálculo
 * @query {boolean} is_active - Filtrar por estado activo
 * @query {number} limit - Limitar número de resultados
 */
router.get('/', CreditTypesController.getAll);

/**
 * @route POST /api/credits/types
 * @desc Crear un nuevo tipo de crédito
 * @access Privado
 * @body {string} code - Código único del tipo de crédito (requerido)
 * @body {string} name - Nombre del tipo de crédito (requerido)
 * @body {string} description - Descripción del tipo de crédito
 * @body {string} payment_frequency - Frecuencia de pago (monthly, quarterly, semiannual, annual)
 * @body {string} interest_calculation_method - Método de cálculo (simple, compound)
 * @body {boolean} allows_early_payment - Permite pagos anticipados
 * @body {boolean} allows_partial_payment - Permite pagos parciales
 * @body {boolean} requires_guarantee - Requiere garantía hipotecaria
 * @body {boolean} is_active - Estado activo
 */
router.post('/', CreditTypesController.create);

/**
 * @route GET /api/credits/types/:id
 * @desc Obtener un tipo de crédito por ID
 * @access Privado
 */
router.get('/:id', CreditTypesController.getById);

/**
 * @route PUT /api/credits/types/:id
 * @desc Actualizar un tipo de crédito existente
 * @access Privado
 * @body {string} code - Código único del tipo de crédito (requerido)
 * @body {string} name - Nombre del tipo de crédito (requerido)
 * @body {string} description - Descripción del tipo de crédito
 * @body {string} payment_frequency - Frecuencia de pago (monthly, quarterly, semiannual, annual)
 * @body {string} interest_calculation_method - Método de cálculo (simple, compound)
 * @body {boolean} allows_early_payment - Permite pagos anticipados
 * @body {boolean} allows_partial_payment - Permite pagos parciales
 * @body {boolean} requires_guarantee - Requiere garantía hipotecaria
 * @body {boolean} is_active - Estado activo
 */
router.put('/:id', CreditTypesController.update);

/**
 * @route PATCH /api/credits/types/:id/toggle-active
 * @desc Alternar estado activo/inactivo de un tipo de crédito
 * @access Privado
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', CreditTypesController.toggleActive);

/**
 * @route DELETE /api/credits/types/:id
 * @desc Eliminar un tipo de crédito (solo si no tiene créditos asociados)
 * @access Privado
 */
router.delete('/:id', CreditTypesController.delete);

module.exports = router; 