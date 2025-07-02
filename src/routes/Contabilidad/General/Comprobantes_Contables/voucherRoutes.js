/**
 * Rutas para la gestión de comprobantes contables
 * @module routes/Contabilidad/General/Comprobantes_Contables/voucherRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const VoucherController = require('../../../../controllers/Contabilidad/General/Comprobantes_Contables/voucherController');
const DocumentTypeController = require('../../../../controllers/Contabilidad/General/Comprobantes_Contables/documentTypeController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Tipos de Comprobantes (DEBEN IR ANTES que las rutas con :id)
// ============================================================

/**
 * @route GET /api/accounting/vouchers/types
 * @desc Obtener todos los tipos de comprobantes contables
 * @access Privado
 */
router.get('/types', VoucherController.getAllVoucherTypes);

/**
 * @route GET /api/accounting/vouchers/types/all
 * @desc Obtener todos los tipos de comprobantes contables (legacy)
 * @access Privado
 */
router.get('/types/all', VoucherController.getAllTypes);

/**
 * @route GET /api/accounting/vouchers/types/natures/all
 * @desc Obtener todas las naturalezas de comprobantes
 * @access Privado
 */
router.get('/types/natures/all', VoucherController.getVoucherNatures);

/**
 * @route GET /api/accounting/vouchers/natures
 * @desc Obtener todas las naturalezas de comprobantes con paginación
 * @access Privado
 */
router.get('/natures', VoucherController.getAllVoucherNatures);

/**
 * @route GET /api/accounting/vouchers/natures/:id
 * @desc Obtener una naturaleza de comprobante por ID
 * @access Privado
 */
router.get('/natures/:id', VoucherController.getVoucherNatureById);

/**
 * @route POST /api/accounting/vouchers/natures
 * @desc Crear una nueva naturaleza de comprobante
 * @access Privado
 */
router.post('/natures', VoucherController.createVoucherNature);

/**
 * @route PUT /api/accounting/vouchers/natures/:id
 * @desc Actualizar una naturaleza de comprobante existente
 * @access Privado
 */
router.put('/natures/:id', VoucherController.updateVoucherNature);

/**
 * @route DELETE /api/accounting/vouchers/natures/:id
 * @desc Eliminar una naturaleza de comprobante
 * @access Privado
 */
router.delete('/natures/:id', VoucherController.deleteVoucherNature);

// ============================================================
// Rutas para Plantillas de Comprobantes
// ============================================================

/**
 * @route GET /api/accounting/vouchers/templates
 * @desc Obtener todas las plantillas de comprobantes
 * @access Privado
 */
router.get('/templates', VoucherController.getAllTemplates);

/**
 * @route GET /api/accounting/vouchers/templates/:id
 * @desc Obtener una plantilla de comprobante por ID
 * @access Privado
 */
router.get('/templates/:id', VoucherController.getTemplateById);

/**
 * @route POST /api/accounting/vouchers/templates
 * @desc Crear una nueva plantilla de comprobante
 * @access Privado
 */
router.post('/templates', VoucherController.createTemplate);

/**
 * @route PUT /api/accounting/vouchers/templates/:id
 * @desc Actualizar una plantilla de comprobante existente
 * @access Privado
 */
router.put('/templates/:id', VoucherController.updateTemplate);

/**
 * @route DELETE /api/accounting/vouchers/templates/:id
 * @desc Eliminar una plantilla de comprobante
 * @access Privado
 */
router.delete('/templates/:id', VoucherController.deleteTemplate);

/**
 * @route POST /api/accounting/vouchers/templates/:id/generate
 * @desc Generar comprobante a partir de una plantilla
 * @access Privado
 */
router.post('/templates/:id/generate', VoucherController.generateFromTemplate);

/**
 * @route GET /api/accounting/vouchers/types/:id
 * @desc Obtener un tipo de comprobante por ID
 * @access Privado
 */
router.get('/types/:id', VoucherController.getVoucherTypeById);

/**
 * @route POST /api/accounting/vouchers/types
 * @desc Crear un nuevo tipo de comprobante
 * @access Privado
 */
router.post('/types', VoucherController.createVoucherType);

/**
 * @route PUT /api/accounting/vouchers/types/:id
 * @desc Actualizar un tipo de comprobante existente
 * @access Privado
 */
router.put('/types/:id', VoucherController.updateVoucherType);

/**
 * @route DELETE /api/accounting/vouchers/types/:id
 * @desc Eliminar un tipo de comprobante
 * @access Privado
 */
router.delete('/types/:id', VoucherController.deleteVoucherType);

/**
 * @route PATCH /api/accounting/vouchers/types/:id/toggle-active
 * @desc Alternar estado activo/inactivo de un tipo de comprobante
 * @access Privado
 */
router.patch('/types/:id/toggle-active', VoucherController.toggleVoucherTypeActive);

// ============================================================
// Rutas específicas para Comprobantes (ANTES que las rutas con :id general)
// ============================================================

/**
 * @route GET /api/accounting/vouchers/tipo/:tipo/consecutivo/:consecutivo
 * @desc Obtener un comprobante contable por tipo y consecutivo
 * @access Privado
 */
router.get('/tipo/:type/consecutivo/:consecutive', VoucherController.getByTypeAndConsecutive);

/**
 * @route GET /api/accounting/vouchers/generate-consecutivo/:voucher_type_id
 * @desc Generar un nuevo consecutivo para un tipo de comprobante
 * @access Privado
 */
router.get('/generate-consecutivo/:voucher_type_id', VoucherController.generateConsecutive);

/**
 * @route POST /api/accounting/vouchers/bulk-approve
 * @desc Aprobar múltiples comprobantes en una sola operación
 * @access Privado
 */
router.post('/bulk-approve', VoucherController.bulkApprove);

/**
 * @route POST /api/accounting/vouchers/documents/bulk-generate
 * @desc Generar comprobantes a partir de múltiples documentos (contabilización masiva)
 * @access Privado
 */
router.post('/documents/bulk-generate', VoucherController.bulkGenerateFromDocuments);

// ============================================================
// Rutas para Comprobantes Contables (con :id al final)
// ============================================================

/**
 * @route GET /api/accounting/vouchers
 * @desc Obtener todos los comprobantes contables
 * @access Privado
 */
router.get('/', VoucherController.getAll);

/**
 * @route POST /api/accounting/vouchers
 * @desc Crear un nuevo comprobante contable
 * @access Privado
 */
router.post('/', VoucherController.create);

/**
 * @route GET /api/accounting/vouchers/:id
 * @desc Obtener un comprobante contable por ID
 * @access Privado
 */
router.get('/:id', VoucherController.getById);

/**
 * @route PUT /api/accounting/vouchers/:id
 * @desc Actualizar un comprobante contable existente
 * @access Privado
 */
router.put('/:id', VoucherController.update);

/**
 * @route PATCH /api/accounting/vouchers/:id/status
 * @desc Cambiar el estado de un comprobante contable
 * @access Privado
 */
router.patch('/:id/status', VoucherController.changeStatus);

/**
 * @route DELETE /api/accounting/vouchers/:id
 * @desc Eliminar un comprobante contable
 * @access Privado
 */
router.delete('/:id', VoucherController.delete);

/**
 * @route GET /api/accounting/vouchers/:id/history
 * @desc Obtener el historial de estados de un comprobante contable
 * @access Privado
 */
router.get('/:id/history', VoucherController.getStatusHistory);

/**
 * @route GET /api/accounting/vouchers/:id/journal-entries
 * @desc Obtener asientos contables asociados a un comprobante
 * @access Privado
 */
router.get('/:id/journal-entries', VoucherController.getRelatedJournalEntries);

/**
 * @route GET /api/accounting/vouchers/:id/documents
 * @desc Obtener documentos asociados a un comprobante
 * @access Privado
 */
router.get('/:id/documents', VoucherController.getRelatedDocuments);

/**
 * @route POST /api/accounting/vouchers/:id/journal-entries
 * @desc Asociar un asiento contable a un comprobante
 * @access Privado
 */
router.post('/:id/journal-entries', VoucherController.associateJournalEntry);

/**
 * @route POST /api/accounting/vouchers/:id/documents
 * @desc Asociar un documento legal a un comprobante
 * @access Privado
 */
router.post('/:id/documents', VoucherController.associateDocument);

/**
 * @route POST /api/accounting/vouchers/:id/generate-reversal
 * @desc Generar comprobante de reversión
 * @access Privado
 */
router.post('/:id/generate-reversal', VoucherController.generateReversal);

/**
 * @route GET /api/accounting/vouchers/:id/lines
 * @desc Obtener líneas de un comprobante contable
 * @access Privado
 */
router.get('/:id/lines', VoucherController.getVoucherLines);

/**
 * @route GET /api/accounting/vouchers/:id/pdf
 * @desc Generar y descargar PDF de un comprobante contable
 * @access Privado
 */
router.get('/:id/pdf', VoucherController.generatePDF);

module.exports = router;