/**
 * Rutas para la gestión de configuraciones de cuotas de créditos hipotecarios
 * @module routes/Creditos/quotaConfigurationsRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const QuotaConfigurationsController = require('../../controllers/Creditos/QuotaConfigurationsController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas (DEBEN IR ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/credits/quota-configurations/active
 * @desc Obtener todas las configuraciones de cuotas activas
 * @access Privado
 */
router.get('/active', QuotaConfigurationsController.getActive);

/**
 * @route GET /api/credits/quota-configurations/options
 * @desc Obtener opciones para formularios (enums)
 * @access Privado
 */
router.get('/options', QuotaConfigurationsController.getFormOptions);

/**
 * @route GET /api/credits/quota-configurations/statistics
 * @desc Obtener estadísticas de configuraciones de cuotas
 * @access Privado
 */
router.get('/statistics', QuotaConfigurationsController.getStatistics);

/**
 * @route GET /api/credits/quota-configurations/by-credit-type/:creditTypeId
 * @desc Obtener configuraciones por tipo de crédito
 * @access Privado
 */
router.get('/by-credit-type/:creditTypeId', QuotaConfigurationsController.getByCreditType);

// ============================================================
// Rutas principales CRUD
// ============================================================

/**
 * @route GET /api/credits/quota-configurations
 * @desc Obtener todas las configuraciones de cuotas con filtros opcionales
 * @access Privado
 * @query {string} name - Filtrar por nombre (búsqueda parcial)
 * @query {number} credit_type_id - Filtrar por tipo de crédito
 * @query {string} quota_type - Filtrar por tipo de cuota (fixed, ordinary)
 * @query {boolean} is_active - Filtrar por estado activo
 * @query {number} limit - Limitar número de resultados
 */
router.get('/', QuotaConfigurationsController.getAll);

/**
 * @route POST /api/credits/quota-configurations
 * @desc Crear una nueva configuración de cuota
 * @access Privado
 * @body {number} credit_type_id - ID del tipo de crédito (requerido)
 * @body {string} quota_type - Tipo de cuota: fixed, ordinary (requerido)
 * @body {string} name - Nombre de la configuración (requerido)
 * @body {string} description - Descripción de la configuración
 * @body {number} management_fee_percentage - Porcentaje de cuota de manejo (0-1)
 * @body {number} management_fee_amount - Monto fijo de cuota de manejo
 * @body {number} minimum_payment_percentage - Porcentaje mínimo de pago (0-1)
 * @body {number} grace_period_days - Días de gracia para pagos
 * @body {number} late_payment_penalty_percentage - Porcentaje de penalización (0-1)
 * @body {boolean} is_active - Estado activo
 */
router.post('/', QuotaConfigurationsController.create);

/**
 * @route GET /api/credits/quota-configurations/:id
 * @desc Obtener una configuración de cuota por ID
 * @access Privado
 */
router.get('/:id', QuotaConfigurationsController.getById);

/**
 * @route PUT /api/credits/quota-configurations/:id
 * @desc Actualizar una configuración de cuota existente
 * @access Privado
 * @body {number} credit_type_id - ID del tipo de crédito
 * @body {string} quota_type - Tipo de cuota: fixed, ordinary (requerido)
 * @body {string} name - Nombre de la configuración (requerido)
 * @body {string} description - Descripción de la configuración
 * @body {number} management_fee_percentage - Porcentaje de cuota de manejo (0-1)
 * @body {number} management_fee_amount - Monto fijo de cuota de manejo
 * @body {number} minimum_payment_percentage - Porcentaje mínimo de pago (0-1)
 * @body {number} grace_period_days - Días de gracia para pagos
 * @body {number} late_payment_penalty_percentage - Porcentaje de penalización (0-1)
 * @body {boolean} is_active - Estado activo
 */
router.put('/:id', QuotaConfigurationsController.update);

/**
 * @route PATCH /api/credits/quota-configurations/:id/toggle-active
 * @desc Alternar estado activo/inactivo de una configuración de cuota
 * @access Privado
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', QuotaConfigurationsController.toggleActive);

/**
 * @route DELETE /api/credits/quota-configurations/:id
 * @desc Eliminar una configuración de cuota (solo si no tiene créditos asociados)
 * @access Privado
 */
router.delete('/:id', QuotaConfigurationsController.delete);

module.exports = router; 