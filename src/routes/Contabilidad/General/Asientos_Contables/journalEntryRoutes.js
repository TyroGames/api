/**
 * Rutas para gestionar asientos contables
 * @module routes/Contabilidad/General/Asientos_Contables/journalEntryRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const JournalEntryController = require('../../../../controllers/Contabilidad/General/Asientos_Contables/journalEntryController');
const JournalEntryLineController = require('../../../../controllers/Contabilidad/General/Asientos_Contables/journalEntryLineController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/accounting/journal-entries
 * @desc Obtener todos los asientos contables
 * @access Privado
 */
router.get('/', JournalEntryController.getAll);

/**
 * @route GET /api/accounting/journal-entries/:id
 * @desc Obtener un asiento contable por su ID
 * @access Privado
 */
router.get('/:id', JournalEntryController.getById);

/**
 * @route GET /api/accounting/journal-entries/number/:entryNumber
 * @desc Obtener un asiento contable por su número
 * @access Privado
 */
router.get('/number/:entryNumber', JournalEntryController.getByEntryNumber);

/**
 * @route POST /api/accounting/journal-entries
 * @desc Crear un nuevo asiento contable
 * @access Privado
 */
router.post('/', JournalEntryController.create);

/**
 * @route PUT /api/accounting/journal-entries/:id
 * @desc Actualizar un asiento contable existente
 * @access Privado
 */
router.put('/:id', JournalEntryController.update);

/**
 * @route DELETE /api/accounting/journal-entries/:id
 * @desc Eliminar un asiento contable
 * @access Privado
 */
router.delete('/:id', JournalEntryController.delete);

/**
 * @route POST /api/accounting/journal-entries/:id/post
 * @desc Aprobar un asiento contable
 * @access Privado
 */
router.post('/:id/post', JournalEntryController.post);

/**
 * @route POST /api/accounting/journal-entries/:id/reverse
 * @desc Anular un asiento contable
 * @access Privado
 */
router.post('/:id/reverse', JournalEntryController.reverse);

/**
 * @route GET /api/accounting/journal-entries/generate-number
 * @desc Generar número de asiento contable
 * @access Privado
 */
router.get('/utils/generate-number', JournalEntryController.generateEntryNumber);

/**
 * @route GET /api/accounting/journal-entries/:journalEntryId/lines
 * @desc Obtener todas las líneas de un asiento contable
 * @access Privado
 */
router.get('/:journalEntryId/lines', JournalEntryLineController.getAllByJournalEntryId);

/**
 * @route GET /api/accounting/journal-entries/lines/:id
 * @desc Obtener una línea de asiento contable por su ID
 * @access Privado
 */
router.get('/lines/:id', JournalEntryLineController.getById);

/**
 * @route POST /api/accounting/journal-entries/lines
 * @desc Crear una nueva línea de asiento contable
 * @access Privado
 */
router.post('/lines', JournalEntryLineController.create);

/**
 * @route PUT /api/accounting/journal-entries/lines/:id
 * @desc Actualizar una línea de asiento contable existente
 * @access Privado
 */
router.put('/lines/:id', JournalEntryLineController.update);

/**
 * @route DELETE /api/accounting/journal-entries/lines/:id
 * @desc Eliminar una línea de asiento contable
 * @access Privado
 */
router.delete('/lines/:id', JournalEntryLineController.delete);

/**
 * @route POST /api/accounting/journal-entries/:journalEntryId/reorder-lines
 * @desc Reordenar las líneas de un asiento contable
 * @access Privado
 */
router.post('/:journalEntryId/reorder-lines', JournalEntryLineController.reorderLines);

module.exports = router; 