/**
 * Controlador para gestión de extractos bancarios
 * @module controllers/Contabilidad/Tesoreria/bankStatementController
 */

const BankStatement = require('../../../models/Contabilidad/Tesoreria/bankStatementModel');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Clase controladora para gestionar los extractos bancarios
 */
class BankStatementController {
  /**
   * Obtener todos los extractos bancarios con filtros
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAll(req, res) {
    try {
      const filters = {
        bank_account_id: req.query.bank_account_id ? parseInt(req.query.bank_account_id) : undefined,
        statement_date_from: req.query.statement_date_from,
        statement_date_to: req.query.statement_date_to,
        status: req.query.status,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const statements = await BankStatement.getAll(filters);

      logger.info(`Extractos bancarios obtenidos: ${statements.length} registros`);

      res.json({
        success: true,
        data: statements,
        message: 'Extractos bancarios obtenidos exitosamente',
        total: statements.length
      });
    } catch (error) {
      logger.error(`Error al obtener extractos bancarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener extractos bancarios',
        error: error.message
      });
    }
  }

  /**
   * Obtener un extracto bancario por ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto bancario inválido'
        });
      }

      const statement = await BankStatement.getById(parseInt(id));

      if (!statement) {
        return res.status(404).json({
          success: false,
          message: 'Extracto bancario no encontrado'
        });
      }

      logger.info(`Extracto bancario ${id} obtenido con ${statement.movements.length} movimientos`);

      res.json({
        success: true,
        data: statement,
        message: 'Extracto bancario obtenido exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener extracto bancario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener extracto bancario',
        error: error.message
      });
    }
  }

  /**
   * Importar un nuevo extracto bancario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async importStatement(req, res) {
    try {
      const { accountId } = req.params;
      const { statement_date } = req.body;

      // Validaciones de entrada
      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }

      if (!statement_date) {
        return res.status(400).json({
          success: false,
          message: 'Fecha del extracto es requerida'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Archivo de extracto es requerido'
        });
      }

      // Validar formato de fecha
      const statementDate = new Date(statement_date);
      if (isNaN(statementDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido'
        });
      }

      // Validar que la fecha no sea futura
      if (statementDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La fecha del extracto no puede ser futura'
        });
      }

      // Crear registro de importación
      const statementData = {
        bank_account_id: parseInt(accountId),
        statement_date: statement_date,
        file_path: req.file.path,
        file_type: path.extname(req.file.originalname),
        file_size: req.file.size,
        original_filename: req.file.originalname,
        imported_by: req.user.id
      };

      const importedStatement = await BankStatement.createImport(statementData);

      logger.info(`Extracto bancario importado: ID ${importedStatement.id} para cuenta ${accountId}`);

      res.status(201).json({
        success: true,
        data: importedStatement,
        message: 'Extracto bancario importado exitosamente. Procesando archivo...'
      });

      // Procesar archivo en segundo plano
      try {
        await BankStatement.processStatement(importedStatement.id);
        logger.info(`Extracto ${importedStatement.id} procesado exitosamente`);
      } catch (processError) {
        logger.error(`Error al procesar extracto ${importedStatement.id}: ${processError.message}`);
      }

    } catch (error) {
      logger.error(`Error al importar extracto bancario: ${error.message}`);
      
      // Eliminar archivo si se subió pero falló la importación
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.warn(`No se pudo eliminar archivo tras error: ${unlinkError.message}`);
        }
      }

      if (error.message.includes('cuenta bancaria especificada no existe') || 
          error.message.includes('cuentas inactivas')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al importar extracto bancario',
          error: error.message
        });
      }
    }
  }

  /**
   * Procesar extracto bancario manualmente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async processStatement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto inválido'
        });
      }

      const result = await BankStatement.processStatement(parseInt(id));

      logger.info(`Extracto ${id} procesado manualmente: ${result.total_movements} movimientos`);

      res.json({
        success: true,
        data: result,
        message: 'Extracto bancario procesado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al procesar extracto: ${error.message}`);
      
      if (error.message.includes('no encontrada') || 
          error.message.includes('ya ha sido procesado')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al procesar extracto',
          error: error.message
        });
      }
    }
  }

  /**
   * Analizar diferencias entre extracto y sistema
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async analyzeDifferences(req, res) {
    try {
      const { id } = req.params;
      const { bank_account_id, date_from, date_to } = req.query;

      // Validaciones
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto inválido'
        });
      }

      if (!bank_account_id || isNaN(parseInt(bank_account_id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria es requerido'
        });
      }

      if (!date_from || !date_to) {
        return res.status(400).json({
          success: false,
          message: 'Fechas de análisis son requeridas'
        });
      }

      const analysis = await BankStatement.analyzeDifferences(
        parseInt(id),
        parseInt(bank_account_id),
        date_from,
        date_to
      );

      logger.info(`Análisis de diferencias completado para extracto ${id}: ${analysis.matched_movements} emparejados`);

      res.json({
        success: true,
        data: analysis,
        message: 'Análisis de diferencias completado exitosamente',
        period: {
          from: date_from,
          to: date_to
        }
      });
    } catch (error) {
      logger.error(`Error al analizar diferencias: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al analizar diferencias',
        error: error.message
      });
    }
  }

  /**
   * Obtener movimientos de un extracto bancario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getStatementMovements(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, filter_type, filter_matched } = req.query;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto inválido'
        });
      }

      // Verificar que el extracto existe
      const statement = await BankStatement.getById(parseInt(id));
      if (!statement) {
        return res.status(404).json({
          success: false,
          message: 'Extracto bancario no encontrado'
        });
      }

      // Aplicar filtros a los movimientos
      let movements = statement.movements;

      if (filter_type) {
        movements = movements.filter(m => m.movement_type === filter_type);
      }

      if (filter_matched !== undefined) {
        const isMatched = filter_matched === 'true';
        movements = movements.filter(m => m.is_matched === isMatched);
      }

      // Paginación
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      const paginatedMovements = movements.slice(offset, offset + limitNum);

      logger.info(`Movimientos de extracto ${id} obtenidos: ${paginatedMovements.length} de ${movements.length}`);

      res.json({
        success: true,
        data: paginatedMovements,
        message: 'Movimientos de extracto obtenidos exitosamente',
        pagination: {
          current_page: pageNum,
          per_page: limitNum,
          total: movements.length,
          total_pages: Math.ceil(movements.length / limitNum)
        },
        statement_info: {
          id: statement.id,
          statement_date: statement.statement_date,
          account_name: statement.account_name,
          status: statement.status
        }
      });
    } catch (error) {
      logger.error(`Error al obtener movimientos de extracto: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener movimientos de extracto',
        error: error.message
      });
    }
  }

  /**
   * Eliminar extracto bancario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deleteStatement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto inválido'
        });
      }

      const result = await BankStatement.delete(parseInt(id));

      logger.info(`Extracto bancario ${id} eliminado por usuario ${req.user.id}`);

      res.json({
        success: true,
        data: { deleted: result },
        message: 'Extracto bancario eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar extracto bancario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar extracto bancario',
        error: error.message
      });
    }
  }

  /**
   * Descargar archivo de extracto original
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async downloadStatement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID de extracto inválido'
        });
      }

      const statement = await BankStatement.getById(parseInt(id));
      if (!statement) {
        return res.status(404).json({
          success: false,
          message: 'Extracto bancario no encontrado'
        });
      }

      // Verificar que el archivo existe
      try {
        await fs.access(statement.file_path);
      } catch (accessError) {
        return res.status(404).json({
          success: false,
          message: 'Archivo de extracto no encontrado en el servidor'
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Disposition', `attachment; filename="${statement.original_filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Enviar archivo
      res.sendFile(path.resolve(statement.file_path));

      logger.info(`Archivo de extracto ${id} descargado por usuario ${req.user.id}`);

    } catch (error) {
      logger.error(`Error al descargar extracto: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al descargar extracto',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de extractos por cuenta
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getStatsByAccount(req, res) {
    try {
      const { accountId } = req.params;
      const { date_from, date_to } = req.query;

      if (!accountId || isNaN(parseInt(accountId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de cuenta bancaria inválido'
        });
      }

      const filters = {
        bank_account_id: parseInt(accountId)
      };

      if (date_from) filters.statement_date_from = date_from;
      if (date_to) filters.statement_date_to = date_to;

      const statements = await BankStatement.getAll(filters);

      // Calcular estadísticas
      const stats = {
        total_statements: statements.length,
        processed_statements: statements.filter(s => s.status === 'processed').length,
        pending_statements: statements.filter(s => s.status === 'uploaded').length,
        error_statements: statements.filter(s => s.status === 'error').length,
        total_movements: statements.reduce((sum, s) => sum + (s.total_movements || 0), 0),
        total_credits: statements.reduce((sum, s) => sum + (parseFloat(s.total_credits) || 0), 0),
        total_debits: statements.reduce((sum, s) => sum + (parseFloat(s.total_debits) || 0), 0),
        date_range: {
          from: date_from || null,
          to: date_to || null
        }
      };

      stats.processing_rate = stats.total_statements > 0 
        ? ((stats.processed_statements / stats.total_statements) * 100).toFixed(2)
        : 0;

      logger.info(`Estadísticas de extractos obtenidas para cuenta ${accountId}`);

      res.json({
        success: true,
        data: stats,
        message: 'Estadísticas de extractos obtenidas exitosamente'
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas de extractos: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = BankStatementController; 