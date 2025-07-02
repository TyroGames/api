/**
 * Rutas para la gestión de tipos de comprobantes contables
 * @module routes/Contabilidad/General/Comprobantes_Contables/documentTypeRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const DocumentTypeController = require('../../../../controllers/Contabilidad/General/Comprobantes_Contables/documentTypeController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Tipos de Comprobantes Contables
// ============================================================

/**
 * @route GET /api/accounting/document-types
 * @desc Obtener todos los tipos de comprobantes contables
 * @access Privado
 */
router.get('/', DocumentTypeController.getAll);

/**
 * @route GET /api/accounting/document-types/:id
 * @desc Obtener un tipo de comprobante contable por ID
 * @access Privado
 */
router.get('/:id', DocumentTypeController.getById);

/**
 * @route GET /api/accounting/document-types/code/:codigo
 * @desc Obtener un tipo de comprobante contable por código
 * @access Privado
 */
router.get('/code/:codigo', DocumentTypeController.getByCode);

/**
 * @route POST /api/accounting/document-types
 * @desc Crear un nuevo tipo de comprobante contable
 * @access Privado
 */
router.post('/', DocumentTypeController.create);

/**
 * @route PUT /api/accounting/document-types/:id
 * @desc Actualizar un tipo de comprobante contable existente
 * @access Privado
 */
router.put('/:id', DocumentTypeController.update);

/**
 * @route PATCH /api/accounting/document-types/:id/consecutivo
 * @desc Actualizar el consecutivo de un tipo de comprobante
 * @access Privado
 */
router.patch('/:id/consecutivo', DocumentTypeController.updateConsecutivo);

/**
 * @route PATCH /api/accounting/document-types/:id/active
 * @desc Cambiar el estado de activación de un tipo de comprobante
 * @access Privado
 */
router.patch('/:id/active', DocumentTypeController.toggleActive);

/**
 * @route DELETE /api/accounting/document-types/:id
 * @desc Eliminar un tipo de comprobante contable
 * @access Privado
 */
router.delete('/:id', DocumentTypeController.delete);

/**
 * @route GET /api/accounting/document-types/:id/stats
 * @desc Obtener estadísticas de uso de un tipo de comprobante
 * @access Privado
 */
router.get('/:id/stats', DocumentTypeController.getStats);

module.exports = router; 