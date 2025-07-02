/**
 * Rutas para la gestión de categorías de documentos
 * @module routes/Creditos/documentCategoriesRoutes
 */

const express = require('express');
const router = express.Router();
const DocumentCategoriesController = require('../../controllers/Creditos/DocumentCategoriesController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware para autenticación en todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/credits/document-categories
 * @desc Obtener todas las categorías con filtros opcionales
 * @access Private
 * @queryParams {string} name - Nombre de la categoría (búsqueda parcial)
 * @queryParams {boolean} is_required - Es categoría requerida
 * @queryParams {boolean} is_active - Estado activo
 * @queryParams {boolean} has_validation_period - Tiene período de validación
 * @queryParams {number} limit - Límite de resultados
 */
router.get('/', DocumentCategoriesController.getAll);

/**
 * @route GET /api/credits/document-categories/active
 * @desc Obtener solo categorías activas
 * @access Private
 */
router.get('/active', DocumentCategoriesController.getActive);

/**
 * @route GET /api/credits/document-categories/required
 * @desc Obtener categorías requeridas
 * @access Private
 */
router.get('/required', DocumentCategoriesController.getRequired);

/**
 * @route GET /api/credits/document-categories/statistics
 * @desc Obtener estadísticas de categorías
 * @access Private
 */
router.get('/statistics', DocumentCategoriesController.getStatistics);

/**
 * @route GET /api/credits/document-categories/with-stats
 * @desc Obtener categorías con estadísticas detalladas
 * @access Private
 */
router.get('/with-stats', DocumentCategoriesController.getCategoriesWithStats);

/**
 * @route GET /api/credits/document-categories/form-options
 * @desc Obtener opciones para formularios
 * @access Private
 */
router.get('/form-options', DocumentCategoriesController.getFormOptions);

/**
 * @route GET /api/credits/document-categories/check-name/:name
 * @desc Verificar disponibilidad de nombre de categoría
 * @access Private
 * @queryParams {number} exclude_id - ID a excluir de la verificación (para actualizaciones)
 */
router.get('/check-name/:name', DocumentCategoriesController.checkNameAvailability);

/**
 * @route GET /api/credits/document-categories/name/:name
 * @desc Obtener una categoría específica por nombre
 * @access Private
 */
router.get('/name/:name', DocumentCategoriesController.getByName);

/**
 * @route GET /api/credits/document-categories/:id
 * @desc Obtener una categoría específica por ID
 * @access Private
 */
router.get('/:id', DocumentCategoriesController.getById);

/**
 * @route POST /api/credits/document-categories
 * @desc Crear una nueva categoría de documentos
 * @access Private
 * @body {Object} categoryData - Datos de la categoría
 * @body {string} categoryData.name - Nombre de la categoría (requerido, 3-100 caracteres)
 * @body {string} [categoryData.description] - Descripción de la categoría (máx. 1000 caracteres)
 * @body {boolean} [categoryData.is_required=true] - Es categoría requerida para créditos
 * @body {number} [categoryData.validation_period_days] - Período de validez en días (1-3650)
 * @body {boolean} [categoryData.is_active=true] - Estado activo
 */
router.post('/', DocumentCategoriesController.create);

/**
 * @route PUT /api/credits/document-categories/:id
 * @desc Actualizar una categoría existente
 * @access Private
 * @body {Object} categoryData - Datos actualizados de la categoría
 * @body {string} categoryData.name - Nombre de la categoría (3-100 caracteres)
 * @body {string} [categoryData.description] - Descripción de la categoría (máx. 1000 caracteres)
 * @body {boolean} [categoryData.is_required] - Es categoría requerida para créditos
 * @body {number} [categoryData.validation_period_days] - Período de validez en días (1-3650)
 * @body {boolean} [categoryData.is_active] - Estado activo
 */
router.put('/:id', DocumentCategoriesController.update);

/**
 * @route PATCH /api/credits/document-categories/:id/toggle-active
 * @desc Alternar estado activo/inactivo de una categoría
 * @access Private
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', DocumentCategoriesController.toggleActive);

/**
 * @route DELETE /api/credits/document-categories/:id
 * @desc Eliminar una categoría (solo si no tiene tipos de documentos asociados)
 * @access Private
 */
router.delete('/:id', DocumentCategoriesController.delete);

module.exports = router; 