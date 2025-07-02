/**
 * Rutas para la gestión de notarías del sistema de créditos hipotecarios
 * @module routes/Creditos/notariesRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const NotariesController = require('../../controllers/Creditos/NotariesController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas específicas (DEBEN IR ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/credits/notaries/active
 * @desc Obtener todas las notarías activas
 * @access Privado
 */
router.get('/active', NotariesController.getActive);

/**
 * @route GET /api/credits/notaries/cities
 * @desc Obtener ciudades únicas de las notarías
 * @access Privado
 */
router.get('/cities', NotariesController.getCities);

/**
 * @route GET /api/credits/notaries/states
 * @desc Obtener estados únicos de las notarías
 * @access Privado
 */
router.get('/states', NotariesController.getStates);

/**
 * @route GET /api/credits/notaries/statistics
 * @desc Obtener estadísticas de notarías
 * @access Privado
 */
router.get('/statistics', NotariesController.getStatistics);

/**
 * @route GET /api/credits/notaries/code/:code
 * @desc Obtener notaría por código
 * @access Privado
 */
router.get('/code/:code', NotariesController.getByCode);

/**
 * @route GET /api/credits/notaries/city/:city
 * @desc Obtener notarías por ciudad
 * @access Privado
 */
router.get('/city/:city', NotariesController.getByCity);

/**
 * @route GET /api/credits/notaries/check-code/:code
 * @desc Verificar disponibilidad de código de notaría
 * @access Privado
 * @query {number} excludeId - ID a excluir de la verificación (para actualizaciones)
 */
router.get('/check-code/:code', NotariesController.checkCodeAvailability);

// ============================================================
// Rutas principales CRUD
// ============================================================

/**
 * @route GET /api/credits/notaries
 * @desc Obtener todas las notarías con filtros opcionales
 * @access Privado
 * @query {string} notary_code - Filtrar por código de notaría (búsqueda parcial)
 * @query {string} name - Filtrar por nombre (búsqueda parcial)
 * @query {string} city - Filtrar por ciudad (búsqueda parcial)
 * @query {string} state - Filtrar por estado (búsqueda parcial)
 * @query {boolean} is_active - Filtrar por estado activo
 * @query {number} limit - Limitar número de resultados
 */
router.get('/', NotariesController.getAll);

/**
 * @route POST /api/credits/notaries
 * @desc Crear una nueva notaría
 * @access Privado
 * @body {string} notary_code - Código único de la notaría (requerido)
 * @body {string} name - Nombre de la notaría (requerido)
 * @body {string} address - Dirección de la notaría (requerido)
 * @body {string} city - Ciudad de la notaría (requerido)
 * @body {string} state - Estado/departamento de la notaría (requerido)
 * @body {string} phone - Teléfono de la notaría
 * @body {string} email - Email de la notaría
 * @body {string} website - Sitio web de la notaría
 * @body {boolean} is_active - Estado activo
 */
router.post('/', NotariesController.create);

/**
 * @route GET /api/credits/notaries/:id
 * @desc Obtener una notaría por ID
 * @access Privado
 */
router.get('/:id', NotariesController.getById);

/**
 * @route PUT /api/credits/notaries/:id
 * @desc Actualizar una notaría existente
 * @access Privado
 * @body {string} notary_code - Código único de la notaría (requerido)
 * @body {string} name - Nombre de la notaría (requerido)
 * @body {string} address - Dirección de la notaría (requerido)
 * @body {string} city - Ciudad de la notaría (requerido)
 * @body {string} state - Estado/departamento de la notaría (requerido)
 * @body {string} phone - Teléfono de la notaría
 * @body {string} email - Email de la notaría
 * @body {string} website - Sitio web de la notaría
 * @body {boolean} is_active - Estado activo
 */
router.put('/:id', NotariesController.update);

/**
 * @route PATCH /api/credits/notaries/:id/toggle-active
 * @desc Alternar estado activo/inactivo de una notaría
 * @access Privado
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', NotariesController.toggleActive);

/**
 * @route DELETE /api/credits/notaries/:id
 * @desc Eliminar una notaría (solo si no tiene documentos asociados)
 * @access Privado
 */
router.delete('/:id', NotariesController.delete);

module.exports = router; 