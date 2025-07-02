/**
 * Rutas para gestionar los créditos hipotecarios principales del sistema de créditos
 * @module routes/Creditos/mortgagesRoutes
 */

const express = require('express');
const router = express.Router();
const MortgagesController = require('../../controllers/Creditos/MortgagesController');
const { verifyToken } = require('../../middlewares/auth');

router.use(verifyToken);

/**
 * @route   GET /api/credits/mortgages
 * @desc    Obtener todos los créditos hipotecarios con filtros opcionales
 * @access  Private
 * @query   {string} credit_number - Filtrar por número de crédito (parcial)
 * @query   {number} credit_type_id - Filtrar por ID del tipo de crédito
 * @query   {number} quota_configuration_id - Filtrar por ID de configuración de cuotas
 * @query   {number} property_id - Filtrar por ID de propiedad
 * @query   {string} property_code - Filtrar por código de propiedad (parcial)
 * @query   {string} property_city - Filtrar por ciudad de propiedad (parcial)
 * @query   {string} status - Filtrar por estado (active, paid_off, defaulted, cancelled, suspended)
 * @query   {boolean} is_active - Filtrar por estado del sistema (true/false)
 * @query   {number} min_principal_amount - Monto principal mínimo
 * @query   {number} max_principal_amount - Monto principal máximo
 * @query   {number} min_interest_rate - Tasa de interés mínima
 * @query   {number} max_interest_rate - Tasa de interés máxima
 * @query   {string} start_date_from - Fecha de inicio desde (YYYY-MM-DD)
 * @query   {string} start_date_to - Fecha de inicio hasta (YYYY-MM-DD)
 * @query   {string} end_date_from - Fecha de fin desde (YYYY-MM-DD)
 * @query   {string} end_date_to - Fecha de fin hasta (YYYY-MM-DD)
 * @query   {string} payment_frequency - Filtrar por frecuencia de pago
 * @query   {boolean} overdue_payments - Filtrar créditos con pagos vencidos
 * @query   {number} limit - Limitar número de resultados
 */
router.get('/', MortgagesController.getAll);

/**
 * @route   GET /api/credits/mortgages/active
 * @desc    Obtener solo créditos hipotecarios activos
 * @access  Private
 */
router.get('/active', MortgagesController.getActive);

/**
 * @route   GET /api/credits/mortgages/overdue
 * @desc    Obtener créditos con pagos vencidos
 * @access  Private
 */
router.get('/overdue', MortgagesController.getOverduePayments);

/**
 * @route   GET /api/credits/mortgages/statistics
 * @desc    Obtener estadísticas de créditos hipotecarios
 * @access  Private
 */
router.get('/statistics',  MortgagesController.getStatistics);

/**
 * @route   GET /api/credits/mortgages/form-options
 * @desc    Obtener opciones para formularios
 * @access  Private
 */
router.get('/form-options',  MortgagesController.getFormOptions);

/**
 * @route   GET /api/credits/mortgages/check/:creditNumber
 * @desc    Verificar disponibilidad de número de crédito
 * @access  Private
 * @param   {string} creditNumber - Número de crédito a verificar
 * @query   {number} excludeId - ID a excluir de la verificación (opcional)
 */
router.get('/check/:creditNumber',  MortgagesController.checkCreditNumber);

/**
 * @route   GET /api/credits/mortgages/number/:creditNumber
 * @desc    Obtener un crédito hipotecario por número de crédito
 * @access  Private
 * @param   {string} creditNumber - Número del crédito hipotecario
 */
router.get('/number/:creditNumber',  MortgagesController.getByCreditNumber);

/**
 * @route   GET /api/credits/mortgages/property/:propertyId
 * @desc    Obtener créditos hipotecarios por propiedad
 * @access  Private
 * @param   {number} propertyId - ID de la propiedad
 */
router.get('/property/:propertyId',  MortgagesController.getByPropertyId);

/**
 * @route   GET /api/credits/mortgages/:id
 * @desc    Obtener un crédito hipotecario por ID
 * @access  Private
 * @param   {number} id - ID del crédito hipotecario
 */
router.get('/:id',  MortgagesController.getById);

/**
 * @route   POST /api/credits/mortgages
 * @desc    Crear un nuevo crédito hipotecario
 * @access  Private
 * @body    {Object} mortgageData - Datos del crédito hipotecario
 * @body    {string} credit_number - Número único del crédito (requerido)
 * @body    {number} credit_type_id - ID del tipo de crédito (requerido)
 * @body    {number} quota_configuration_id - ID de configuración de cuotas (requerido)
 * @body    {number} property_id - ID de la propiedad (requerido)
 * @body    {number} principal_amount - Monto principal del crédito (requerido)
 * @body    {number} interest_rate - Tasa de interés anual (requerido)
 * @body    {string} interest_rate_type - Tipo de tasa (nominal/effective)
 * @body    {string} start_date - Fecha de inicio (YYYY-MM-DD) (requerido)
 * @body    {string} end_date - Fecha de vencimiento (YYYY-MM-DD) (requerido)
 * @body    {number} payment_day - Día del mes para pagos (1-31) (requerido)
 * @body    {string} payment_frequency - Frecuencia de pagos (monthly/quarterly/semiannual/annual)
 * @body    {string} status - Estado del crédito (active/paid_off/defaulted/cancelled/suspended)
 * @body    {string} notes - Notas adicionales
 */
router.post('/',  MortgagesController.create);

/**
 * @route   PUT /api/credits/mortgages/:id
 * @desc    Actualizar un crédito hipotecario completo
 * @access  Private
 * @param   {number} id - ID del crédito hipotecario
 * @body    {Object} mortgageData - Datos actualizados del crédito
 * @body    {string} credit_number - Número único del crédito
 * @body    {number} principal_amount - Monto principal del crédito
 * @body    {number} interest_rate - Tasa de interés anual
 * @body    {string} interest_rate_type - Tipo de tasa (nominal/effective)
 * @body    {string} start_date - Fecha de inicio (YYYY-MM-DD)
 * @body    {string} end_date - Fecha de vencimiento (YYYY-MM-DD)
 * @body    {number} payment_day - Día del mes para pagos (1-31)
 * @body    {string} payment_frequency - Frecuencia de pagos
 * @body    {number} current_balance - Saldo actual del crédito
 * @body    {number} total_paid_amount - Total pagado hasta la fecha
 * @body    {number} total_interest_paid - Total de intereses pagados
 * @body    {number} total_principal_paid - Total de capital pagado
 * @body    {number} total_management_fees_paid - Total de cuotas de manejo pagadas
 * @body    {string} next_payment_date - Próxima fecha de pago (YYYY-MM-DD)
 * @body    {string} last_payment_date - Última fecha de pago (YYYY-MM-DD)
 * @body    {string} status - Estado del crédito
 * @body    {string} default_date - Fecha de incumplimiento (YYYY-MM-DD)
 * @body    {string} default_reason - Razón del incumplimiento
 * @body    {string} grace_period_end_date - Fecha de fin del período de gracia (YYYY-MM-DD)
 * @body    {string} notes - Notas adicionales
 * @body    {boolean} is_active - Estado del sistema
 */
router.put('/:id',  MortgagesController.update);

/**
 * @route   PATCH /api/credits/mortgages/:id/status
 * @desc    Cambiar estado de un crédito hipotecario
 * @access  Private
 * @param   {number} id - ID del crédito hipotecario
 * @body    {Object} statusData - Datos del cambio de estado
 * @body    {string} status - Nuevo estado (active/paid_off/defaulted/cancelled/suspended) (requerido)
 * @body    {string} reason - Razón del cambio (requerido para defaulted/cancelled)
 */
router.patch('/:id/status',  MortgagesController.changeStatus);

module.exports = router;