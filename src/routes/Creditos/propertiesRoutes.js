/**
 * Rutas para la gestión de propiedades hipotecarias
 * @module routes/Creditos/propertiesRoutes
 */

const express = require('express');
const router = express.Router();
const PropertiesController = require('../../controllers/Creditos/PropertiesController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware para autenticación en todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/credits/properties
 * @desc Obtener todas las propiedades con filtros opcionales
 * @access Private
 * @queryParams {string} property_code - Código de propiedad (búsqueda parcial)
 * @queryParams {string} property_type - Tipo de propiedad
 * @queryParams {string} city - Ciudad
 * @queryParams {string} state - Estado/Departamento
 * @queryParams {number} stratum - Estrato
 * @queryParams {string} property_condition - Estado de la propiedad
 * @queryParams {number} min_value - Valor mínimo
 * @queryParams {number} max_value - Valor máximo
 * @queryParams {number} min_area - Área mínima
 * @queryParams {number} max_area - Área máxima
 * @queryParams {boolean} is_active - Estado activo
 * @queryParams {number} limit - Límite de resultados
 */
router.get('/', PropertiesController.getAll);

/**
 * @route GET /api/credits/properties/active
 * @desc Obtener solo propiedades activas
 * @access Private
 */
router.get('/active', PropertiesController.getActive);

/**
 * @route GET /api/credits/properties/cities
 * @desc Obtener ciudades disponibles con estadísticas
 * @access Private
 */
router.get('/cities', PropertiesController.getCities);

/**
 * @route GET /api/credits/properties/states
 * @desc Obtener estados disponibles con estadísticas
 * @access Private
 */
router.get('/states', PropertiesController.getStates);

/**
 * @route GET /api/credits/properties/types
 * @desc Obtener tipos de propiedades disponibles con estadísticas
 * @access Private
 */
router.get('/types', PropertiesController.getPropertyTypes);

/**
 * @route GET /api/credits/properties/statistics
 * @desc Obtener estadísticas generales de propiedades
 * @access Private
 */
router.get('/statistics', PropertiesController.getStatistics);

/**
 * @route GET /api/credits/properties/form-options
 * @desc Obtener opciones para formularios (tipos, ciudades, estados, etc.)
 * @access Private
 */
router.get('/form-options', PropertiesController.getFormOptions);

/**
 * @route GET /api/credits/properties/check-code/:code
 * @desc Verificar disponibilidad de código de propiedad
 * @access Private
 * @queryParams {number} exclude_id - ID a excluir de la verificación (para actualizaciones)
 */
router.get('/check-code/:code', PropertiesController.checkCodeAvailability);

/**
 * @route GET /api/credits/properties/code/:code
 * @desc Obtener una propiedad específica por código
 * @access Private
 */
router.get('/code/:code', PropertiesController.getByCode);

/**
 * @route GET /api/credits/properties/city/:city
 * @desc Obtener propiedades por ciudad
 * @access Private
 */
router.get('/city/:city', PropertiesController.getByCity);

/**
 * @route GET /api/credits/properties/:id
 * @desc Obtener una propiedad específica por ID
 * @access Private
 */
router.get('/:id', PropertiesController.getById);

/**
 * @route POST /api/credits/properties
 * @desc Crear una nueva propiedad
 * @access Private
 * @body {Object} propertyData - Datos de la propiedad
 * @body {string} propertyData.property_code - Código único de la propiedad (requerido)
 * @body {string} propertyData.property_type - Tipo de propiedad (requerido)
 * @body {string} propertyData.address - Dirección completa (requerido)
 * @body {string} propertyData.city - Ciudad (requerido)
 * @body {string} propertyData.state - Estado/Departamento (requerido)
 * @body {number} propertyData.property_value - Valor de la propiedad (requerido)
 * @body {string} [propertyData.postal_code] - Código postal
 * @body {string} [propertyData.country=Colombia] - País
 * @body {number} [propertyData.area_sqm] - Área en metros cuadrados
 * @body {number} [propertyData.construction_year] - Año de construcción
 * @body {string} [propertyData.appraisal_date] - Fecha de avalúo
 * @body {number} [propertyData.appraisal_value] - Valor de avalúo
 * @body {string} [propertyData.appraisal_company] - Empresa de avalúo
 * @body {number} [propertyData.property_tax_value] - Valor de impuestos
 * @body {string} [propertyData.property_tax_number] - Número de predial
 * @body {string} [propertyData.registration_number] - Número de matrícula
 * @body {string} [propertyData.cadastral_number] - Número catastral
 * @body {number} [propertyData.stratum] - Estrato (1-6)
 * @body {string} [propertyData.utilities_available] - Servicios públicos
 * @body {string} [propertyData.property_condition=good] - Estado de la propiedad
 * @body {string} [propertyData.notes] - Notas adicionales
 * @body {boolean} [propertyData.is_active=true] - Estado activo
 */
router.post('/', PropertiesController.create);

/**
 * @route PUT /api/credits/properties/:id
 * @desc Actualizar una propiedad existente
 * @access Private
 * @body {Object} propertyData - Datos actualizados de la propiedad
 */
router.put('/:id', PropertiesController.update);

/**
 * @route PATCH /api/credits/properties/:id/toggle-active
 * @desc Alternar estado activo/inactivo de una propiedad
 * @access Private
 * @body {boolean} is_active - Nuevo estado activo
 */
router.patch('/:id/toggle-active', PropertiesController.toggleActive);

/**
 * @route DELETE /api/credits/properties/:id
 * @desc Eliminar una propiedad (solo si no tiene créditos asociados)
 * @access Private
 */
router.delete('/:id', PropertiesController.delete);

module.exports = router; 