/**
 * Rutas para la gestión de propietarios de propiedades hipotecarias
 * @module routes/Creditos/propertyOwnersRoutes
 */

const express = require('express');
const router = express.Router();
const PropertyOwnersController = require('../../controllers/Creditos/PropertyOwnersController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware para autenticación en todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/credits/property-owners
 * @desc Obtener todos los propietarios con filtros opcionales
 * @access Private
 * @queryParams {number} property_id - ID de la propiedad
 * @queryParams {number} third_party_id - ID del tercero
 * @queryParams {string} property_code - Código de propiedad (búsqueda parcial)
 * @queryParams {string} owner_name - Nombre del propietario (búsqueda parcial)
 * @queryParams {string} owner_document - Documento del propietario (búsqueda parcial)
 * @queryParams {boolean} is_primary_owner - Es propietario principal
 * @queryParams {number} min_ownership_percentage - Porcentaje mínimo de propiedad
 * @queryParams {number} max_ownership_percentage - Porcentaje máximo de propiedad
 * @queryParams {string} property_city - Ciudad de la propiedad
 * @queryParams {string} property_state - Estado de la propiedad
 * @queryParams {number} limit - Límite de resultados
 */
router.get('/', PropertyOwnersController.getAll);

/**
 * @route GET /api/credits/property-owners/primary
 * @desc Obtener solo propietarios principales
 * @access Private
 */
router.get('/primary', PropertyOwnersController.getPrimaryOwners);

/**
 * @route GET /api/credits/property-owners/statistics
 * @desc Obtener estadísticas de propietarios
 * @access Private
 */
router.get('/statistics', PropertyOwnersController.getStatistics);

/**
 * @route GET /api/credits/property-owners/property/:propertyId
 * @desc Obtener propietarios por ID de propiedad
 * @access Private
 */
router.get('/property/:propertyId', PropertyOwnersController.getByPropertyId);

/**
 * @route GET /api/credits/property-owners/third-party/:thirdPartyId
 * @desc Obtener propiedades por ID de tercero
 * @access Private
 */
router.get('/third-party/:thirdPartyId', PropertyOwnersController.getByThirdPartyId);

/**
 * @route GET /api/credits/property-owners/check-relation/:propertyId/:thirdPartyId
 * @desc Verificar si una relación propiedad-tercero ya existe
 * @access Private
 * @queryParams {number} exclude_id - ID a excluir de la verificación (para actualizaciones)
 */
router.get('/check-relation/:propertyId/:thirdPartyId', PropertyOwnersController.checkRelationExists);

/**
 * @route GET /api/credits/property-owners/total-percentage/:propertyId
 * @desc Obtener porcentaje total de propiedad por propiedad
 * @access Private
 * @queryParams {number} exclude_id - ID a excluir del cálculo (para actualizaciones)
 */
router.get('/total-percentage/:propertyId', PropertyOwnersController.getTotalOwnershipPercentage);

/**
 * @route GET /api/credits/property-owners/:id
 * @desc Obtener un propietario específico por ID
 * @access Private
 */
router.get('/:id', PropertyOwnersController.getById);

/**
 * @route POST /api/credits/property-owners
 * @desc Crear un nuevo propietario de propiedad
 * @access Private
 * @body {Object} ownerData - Datos del propietario
 * @body {number} ownerData.property_id - ID de la propiedad (requerido)
 * @body {number} ownerData.third_party_id - ID del tercero (requerido)
 * @body {number} [ownerData.ownership_percentage=100] - Porcentaje de propiedad (0.01-100)
 * @body {boolean} [ownerData.is_primary_owner=false] - Es propietario principal
 * @body {string} [ownerData.acquisition_date] - Fecha de adquisición
 * @body {number} [ownerData.acquisition_cost] - Costo de adquisición
 * @body {string} [ownerData.notes] - Notas adicionales
 */
router.post('/', PropertyOwnersController.create);

/**
 * @route POST /api/credits/property-owners/:propertyId/transfer
 * @desc Transferir propiedad entre terceros
 * @access Private
 * @body {Object} transferData - Datos de la transferencia
 * @body {number} transferData.fromThirdPartyId - ID del tercero que transfiere (requerido)
 * @body {number} transferData.toThirdPartyId - ID del tercero que recibe (requerido)
 * @body {number} transferData.transferPercentage - Porcentaje a transferir (requerido)
 */
router.post('/:propertyId/transfer', PropertyOwnersController.transferOwnership);

/**
 * @route PUT /api/credits/property-owners/:id
 * @desc Actualizar un propietario existente
 * @access Private
 * @body {Object} ownerData - Datos actualizados del propietario
 * @body {number} [ownerData.ownership_percentage] - Porcentaje de propiedad (0.01-100)
 * @body {boolean} [ownerData.is_primary_owner] - Es propietario principal
 * @body {string} [ownerData.acquisition_date] - Fecha de adquisición
 * @body {number} [ownerData.acquisition_cost] - Costo de adquisición
 * @body {string} [ownerData.notes] - Notas adicionales
 */
router.put('/:id', PropertyOwnersController.update);

/**
 * @route DELETE /api/credits/property-owners/:id
 * @desc Eliminar un propietario (solo si no es el único propietario)
 * @access Private
 */
router.delete('/:id', PropertyOwnersController.delete);

module.exports = router; 