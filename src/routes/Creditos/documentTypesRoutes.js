/**
 * Rutas para la gestión de tipos de documentos
 * @module routes/Creditos/documentTypesRoutes
 */

const express = require('express');
const router = express.Router();
const DocumentTypesController = require('../../controllers/Creditos/DocumentTypesController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware para autenticación en todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/credits/document-types
 * @desc Obtener todos los tipos de documentos con filtros opcionales
 * @access Private
 * @queryParams {string} name - Nombre del tipo de documento (búsqueda parcial)
 * @queryParams {string} code - Código del tipo de documento (búsqueda parcial)
 * @queryParams {number} category_id - ID de la categoría
 * @queryParams {string} category_name - Nombre de la categoría (búsqueda parcial)
 * @queryParams {boolean} is_required - Es tipo requerido
 * @queryParams {boolean} is_active - Estado activo
 * @queryParams {boolean} requires_notarization - Requiere notarización
 * @queryParams {boolean} requires_registration - Requiere registro
 * @queryParams {boolean} has_validation_period - Tiene período de validación
 * @queryParams {number} max_file_size_mb - Tamaño máximo de archivo (filtro menor o igual)
 * @queryParams {number} limit - Límite de resultados
 */
router.get('/', DocumentTypesController.getAll);

/**
 * @route GET /api/credits/document-types/active
 * @desc Obtener solo tipos de documentos activos
 * @access Private
 */
router.get('/active', DocumentTypesController.getActive);

/**
 * @route GET /api/credits/document-types/required
 * @desc Obtener tipos de documentos requeridos
 * @access Private
 */
router.get('/required', DocumentTypesController.getRequired);

/**
 * @route GET /api/credits/document-types/statistics
 * @desc Obtener estadísticas de tipos de documentos
 * @access Private
 */
router.get('/statistics', DocumentTypesController.getStatistics);

/**
 * @route GET /api/credits/document-types/form-options
 * @desc Obtener opciones para formularios
 * @access Private
 */
router.get('/form-options', DocumentTypesController.getFormOptions);

/**
 * @route GET /api/credits/document-types/check-code/:code
 * @desc Verificar disponibilidad de código de tipo de documento
 * @access Private
 * @queryParams {number} exclude_id - ID a excluir de la verificación (para actualizaciones)
 */
router.get('/check-code/:code', DocumentTypesController.checkCodeAvailability);

/**
 * @route GET /api/credits/document-types/code/:code
 * @desc Obtener un tipo de documento específico por código
 * @access Private
 */
router.get('/code/:code', DocumentTypesController.getByCode);

/**
 * @route GET /api/credits/document-types/category/:categoryId
 * @desc Obtener tipos de documentos por categoría
 * @access Private
 */
router.get('/category/:categoryId', DocumentTypesController.getByCategoryId);

/**
 * @route GET /api/credits/document-types/:id
 * @desc Obtener un tipo de documento específico por ID
 * @access Private
 */
router.get('/:id', DocumentTypesController.getById);

/**
 * @route POST /api/credits/document-types
 * @desc Crear un nuevo tipo de documento
 * @access Private
 * @body {Object} documentTypeData - Datos del tipo de documento
 * @body {number} documentTypeData.category_id - ID de la categoría (requerido)
 * @body {string} documentTypeData.name - Nombre del tipo de documento (requerido, 3-100 caracteres)
 * @body {string} documentTypeData.code - Código único del tipo de documento (requerido, 2-20 caracteres)
 * @body {string} [documentTypeData.description] - Descripción del documento (máx. 1000 caracteres)
 * @body {boolean} [documentTypeData.is_required=true] - Es tipo requerido
 * @body {number} [documentTypeData.validation_period_days] - Período de validez en días (1-3650)
 * @body {boolean} [documentTypeData.requires_notarization=false] - Requiere notarización
 * @body {boolean} [documentTypeData.requires_registration=false] - Requiere registro
 * @body {string} [documentTypeData.file_types_allowed=pdf,jpg,jpeg,png] - Tipos de archivo permitidos (separados por comas)
 * @body {number} [documentTypeData.max_file_size_mb=10] - Tamaño máximo de archivo en MB (1-500)
 * @body {boolean} [documentTypeData.is_active=true] - Estado activo
 */
router.post('/', DocumentTypesController.create);

/**
 * @route PUT /api/credits/document-types/:id
 * @desc Actualizar un tipo de documento existente
 * @access Private
 * @body {Object} documentTypeData - Datos actualizados del tipo de documento
 * @body {number} [documentTypeData.category_id] - ID de la categoría
 * @body {string} documentTypeData.name - Nombre del tipo de documento (3-100 caracteres)
 * @body {string} documentTypeData.code - Código único del tipo de documento (2-20 caracteres)
 * @body {string} [documentTypeData.description] - Descripción del documento (máx. 1000 caracteres)
 * @body {boolean} [documentTypeData.is_required] - Es tipo requerido
 * @body {number} [documentTypeData.validation_period_days] - Período de validez en días (1-3650)
 * @body {boolean} [documentTypeData.requires_notarization] - Requiere notarización
 * @body {boolean} [documentTypeData.requires_registration] - Requiere registro
 * @body {string} [documentTypeData.file_types_allowed] - Tipos de archivo permitidos (separados por comas)
 * @body {number} [documentTypeData.max_file_size_mb] - Tamaño máximo de archivo en MB (1-500)
 * @body {boolean} [documentTypeData.is_active] - Estado activo
 */
router.put('/:id', DocumentTypesController.update);

/**
 * @route PATCH /api/credits/document-types/:id/toggle-active
 * @desc Alternar estado activo/inactivo de un tipo de documento
 * @access Private
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', DocumentTypesController.toggleActive);

/**
 * @route DELETE /api/credits/document-types/:id
 * @desc Eliminar un tipo de documento (solo si no tiene documentos asociados)
 * @access Private
 */
router.delete('/:id', DocumentTypesController.delete);

module.exports = router; 