/**
 * Rutas para gestionar los deudores de créditos hipotecarios del sistema de créditos
 * @module routes/Creditos/mortgageDebtorsRoutes
 */

const express = require('express');
const router = express.Router();
const MortgageDebtorsController = require('../../controllers/Creditos/MortgageDebtorsController');
const { verifyToken } = require('../../middlewares/auth');

router.use(verifyToken);

/**
 * @route   GET /api/credits/debtors
 * @desc    Obtener todos los deudores de créditos con filtros opcionales
 * @access  Private
 * @query   {number} mortgage_id - Filtrar por ID del crédito hipotecario
 * @query   {number} third_party_id - Filtrar por ID del tercero
 * @query   {string} credit_number - Filtrar por número de crédito (parcial)
 * @query   {string} debtor_type - Filtrar por tipo de deudor (primary, secondary, guarantor)
 * @query   {boolean} is_primary_debtor - Filtrar por deudor principal (true/false)
 * @query   {string} employment_status - Filtrar por estado de empleo
 * @query   {string} document_number - Filtrar por número de documento (parcial)
 * @query   {string} debtor_name - Filtrar por nombre del deudor (parcial)
 * @query   {number} min_monthly_income - Ingreso mensual mínimo
 * @query   {number} max_monthly_income - Ingreso mensual máximo
 * @query   {number} min_credit_score - Puntaje de crédito mínimo
 * @query   {number} max_credit_score - Puntaje de crédito máximo
 * @query   {string} mortgage_status - Filtrar por estado del crédito
 * @query   {number} limit - Limitar número de resultados
 */
router.get('/', MortgageDebtorsController.getAll);

/**
 * @route   GET /api/credits/debtors/statistics
 * @desc    Obtener estadísticas de deudores de créditos
 * @access  Private
 */
router.get('/statistics', MortgageDebtorsController.getStatistics);

/**
 * @route   GET /api/credits/debtors/form-options
 * @desc    Obtener opciones para formularios
 * @access  Private
 */
router.get('/form-options', MortgageDebtorsController.getFormOptions);

/**
 * @route   GET /api/credits/debtors/mortgage/:mortgageId
 * @desc    Obtener deudores de un crédito específico
 * @access  Private
 * @param   {number} mortgageId - ID del crédito hipotecario
 */
router.get('/mortgage/:mortgageId', MortgageDebtorsController.getByMortgageId);

/**
 * @route   GET /api/credits/debtors/third-party/:thirdPartyId
 * @desc    Obtener créditos donde un tercero es deudor
 * @access  Private
 * @param   {number} thirdPartyId - ID del tercero
 */
router.get('/third-party/:thirdPartyId', MortgageDebtorsController.getByThirdPartyId);

/**
 * @route   GET /api/credits/debtors/:id
 * @desc    Obtener un deudor de crédito por ID
 * @access  Private
 * @param   {number} id - ID del deudor de crédito
 */
router.get('/:id', MortgageDebtorsController.getById);

/**
 * @route   POST /api/credits/debtors
 * @desc    Crear un nuevo deudor de crédito
 * @access  Private
 * @body    {Object} debtorData - Datos del deudor de crédito
 * @body    {number} mortgage_id - ID del crédito hipotecario (requerido)
 * @body    {number} third_party_id - ID del tercero (requerido)
 * @body    {string} debtor_type - Tipo de deudor (primary/secondary/guarantor)
 * @body    {number} responsibility_percentage - Porcentaje de responsabilidad (0.01-100)
 * @body    {boolean} is_primary_debtor - Indica si es deudor principal
 * @body    {number} monthly_income - Ingreso mensual del deudor
 * @body    {string} employment_status - Estado laboral (employed/self_employed/unemployed/retired/other)
 * @body    {string} employer_name - Nombre del empleador
 * @body    {string} employment_start_date - Fecha de inicio de empleo (YYYY-MM-DD)
 * @body    {number} credit_score - Puntaje de crédito (0-1000)
 * @body    {string} notes - Notas adicionales
 */
router.post('/', MortgageDebtorsController.create);

/**
 * @route   PUT /api/credits/debtors/:id
 * @desc    Actualizar un deudor de crédito existente
 * @access  Private
 * @param   {number} id - ID del deudor de crédito
 * @body    {Object} debtorData - Datos actualizados del deudor
 * @body    {string} debtor_type - Tipo de deudor (primary/secondary/guarantor)
 * @body    {number} responsibility_percentage - Porcentaje de responsabilidad (0.01-100)
 * @body    {boolean} is_primary_debtor - Indica si es deudor principal
 * @body    {number} monthly_income - Ingreso mensual del deudor
 * @body    {string} employment_status - Estado laboral
 * @body    {string} employer_name - Nombre del empleador
 * @body    {string} employment_start_date - Fecha de inicio de empleo (YYYY-MM-DD)
 * @body    {number} credit_score - Puntaje de crédito (0-1000)
 * @body    {string} notes - Notas adicionales
 */
router.put('/:id', MortgageDebtorsController.update);

/**
 * @route   DELETE /api/credits/debtors/:id
 * @desc    Eliminar un deudor de crédito
 * @access  Private
 * @param   {number} id - ID del deudor de crédito
 * @note    No se puede eliminar el único deudor de un crédito
 */
router.delete('/:id',  MortgageDebtorsController.delete);

module.exports = router; 