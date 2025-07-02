/**
 * Rutas para la gestión de terceros (clientes, proveedores, acreedores, etc.)
 * @module routes/Contabilidad/General/Terceros/thirdPartyRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const ThirdPartyController = require('../../../../controllers/Contabilidad/General/Terceros/thirdPartyController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Terceros
// ============================================================

/**
 * @route GET /api/accounting/third-parties
 * @desc Obtener todos los terceros
 * @access Privado
 */
router.get('/', ThirdPartyController.getAll);

/**
 * @route GET /api/accounting/third-parties/:id
 * @desc Obtener un tercero por ID
 * @access Privado
 */
router.get('/:id', ThirdPartyController.getById);

/**
 * @route POST /api/accounting/third-parties
 * @desc Crear un nuevo tercero
 * @access Privado
 */
router.post('/', ThirdPartyController.create);

/**
 * @route PUT /api/accounting/third-parties/:id
 * @desc Actualizar un tercero existente
 * @access Privado
 */
router.put('/:id', ThirdPartyController.update);

/**
 * @route PATCH /api/accounting/third-parties/:id/status
 * @desc Cambiar el estado activo/inactivo de un tercero
 * @access Privado
 */
router.patch('/:id/status', ThirdPartyController.toggleStatus);

/**
 * @route GET /api/accounting/third-parties/search
 * @desc Buscar terceros por término de búsqueda
 * @access Privado
 */
router.get('/search', ThirdPartyController.search);

/**
 * @route GET /api/accounting/third-parties/check-identification
 * @desc Verificar si existe un tercero por número de identificación
 * @access Privado
 */
router.get('/check-identification', ThirdPartyController.checkIdentificationExists);

/**
 * @route GET /api/accounting/third-parties/customers
 * @desc Obtener todos los clientes (terceros con is_customer = true)
 * @access Privado
 */
router.get('/customers', ThirdPartyController.getCustomers);

/**
 * @route GET /api/accounting/third-parties/suppliers
 * @desc Obtener todos los proveedores (terceros con is_supplier = true)
 * @access Privado
 */
router.get('/suppliers', ThirdPartyController.getSuppliers);

/**
 * @route GET /api/accounting/third-parties/creditors
 * @desc Obtener todos los acreedores (terceros con is_creditor = true)
 * @access Privado
 */
router.get('/creditors', ThirdPartyController.getCreditors);

module.exports = router; 