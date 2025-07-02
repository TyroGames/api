/**
 * Rutas para gestionar documentos legales
 * @module routes/Contabilidad/General/Documentos/legalDocumentRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const LegalDocumentController = require('../../../../controllers/Contabilidad/General/Documentos/legalDocumentController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/accounting/legal-documents
 * @desc Obtener todos los documentos legales
 * @access Privado
 */
router.get('/', LegalDocumentController.getAll);

/**
 * @route GET /api/accounting/legal-documents/:id
 * @desc Obtener un documento legal por su ID
 * @access Privado
 */
router.get('/:id', LegalDocumentController.getById);

/**
 * @route GET /api/accounting/legal-documents/number/:documentNumber
 * @desc Obtener un documento legal por su número
 * @access Privado
 */
router.get('/number/:documentNumber', LegalDocumentController.getByNumber);

/**
 * @route POST /api/accounting/legal-documents
 * @desc Crear un nuevo documento legal
 * @access Privado
 */
router.post('/', LegalDocumentController.create);

/**
 * @route PUT /api/accounting/legal-documents/:id
 * @desc Actualizar un documento legal existente
 * @access Privado
 */
router.put('/:id', LegalDocumentController.update);

/**
 * @route POST /api/accounting/legal-documents/:id/approve
 * @desc Aprobar un documento legal
 * @access Privado
 */
router.post('/:id/approve', LegalDocumentController.approve);

/**
 * @route POST /api/accounting/legal-documents/:id/cancel
 * @desc Anular un documento legal
 * @access Privado
 */
router.post('/:id/cancel', LegalDocumentController.cancel);

/**
 * @route POST /api/accounting/legal-documents/:id/generate-voucher
 * @desc Generar comprobante contable a partir de un documento legal
 * @access Privado
 */
router.post('/:id/generate-voucher', LegalDocumentController.generateVoucher);

module.exports = router; 