/**
 * Rutas para la gestión de extractos bancarios en el módulo de tesorería
 * @module routes/Contabilidad/Tesoreria/bankStatementRoutes
 */

const express = require('express');
const router = express.Router();
const BankStatementController = require('../../../controllers/Contabilidad/Tesoreria/bankStatementController');
const { verifyToken } = require('../../../middlewares/auth');
const { uploadBankStatement, handleMulterError } = require('../../../middlewares/fileUpload');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * @swagger
 * /api/tesoreria/bank-statements:
 *   get:
 *     summary: Obtener todos los extractos bancarios
 *     tags: [Extractos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bank_account_id
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria para filtrar
 *       - in: query
 *         name: statement_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial de extractos para filtrar
 *       - in: query
 *         name: statement_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final de extractos para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploaded, processing, processed, error, deleted]
 *         description: Filtrar por estado del extracto
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de extractos bancarios obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', BankStatementController.getAll);

/**
 * @swagger
 * /api/tesoreria/bank-statements/{id}:
 *   get:
 *     summary: Obtener un extracto bancario por ID
 *     tags: [Extractos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del extracto bancario
 *     responses:
 *       200:
 *         description: Extracto bancario obtenido exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Extracto bancario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', BankStatementController.getById);

/**
 * @swagger
 * /api/tesoreria/bank-statements/account/{accountId}/import:
 *   post:
 *     summary: Importar un extracto bancario
 *     tags: [Extractos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - statement_date
 *               - statement_file
 *             properties:
 *               statement_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del extracto bancario
 *               statement_file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo del extracto (.pdf, .xlsx, .csv)
 *     responses:
 *       201:
 *         description: Extracto bancario importado exitosamente
 *       400:
 *         description: Errores de validación o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/account/:accountId/import', 
  uploadBankStatement.single('statement_file'),
  handleMulterError,
  BankStatementController.importStatement
);

/**
 * @swagger
 * /api/tesoreria/bank-statements/{id}/analyze:
 *   get:
 *     summary: Analizar diferencias entre extracto y sistema
 *     tags: [Extractos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del extracto bancario
 *       - in: query
 *         name: bank_account_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta bancaria
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del análisis
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del análisis
 *     responses:
 *       200:
 *         description: Análisis de diferencias completado exitosamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/analyze', BankStatementController.analyzeDifferences);

/**
 * @swagger
 * /api/tesoreria/bank-statements/{id}:
 *   delete:
 *     summary: Eliminar un extracto bancario
 *     tags: [Extractos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del extracto bancario
 *     responses:
 *       200:
 *         description: Extracto bancario eliminado exitosamente
 *       400:
 *         description: ID inválido o extracto no puede ser eliminado
 *       404:
 *         description: Extracto bancario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', BankStatementController.deleteStatement);

module.exports = router; 