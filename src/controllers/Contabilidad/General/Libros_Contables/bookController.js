/**
 * Controlador para gestionar libros contables
 * @module controllers/Contabilidad/General/Libros_Contables/bookController
 */

const BookModel = require('../../../../models/Contabilidad/General/Libros_Contables/bookModel');
const ExportService = require('../../../../services/Contabilidad/exportService');
const logger = require('../../../../utils/logger');
const Joi = require('joi');

class BookController {
    /**
     * Obtener libro diario con filtros y paginación
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getLibroDiario(req, res) {
        try {
            // Validar parámetros de entrada
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                status: Joi.string().valid('draft', 'posted', 'reversed').optional(),
                third_party_id: Joi.number().integer().positive().optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                entry_number: Joi.string().max(20).optional(),
                page: Joi.number().integer().min(1).default(1),
                limit: Joi.number().integer().min(1).max(500).default(50),
                include_details: Joi.boolean().default(false)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            const filters = {
                ...value,
                offset: (value.page - 1) * value.limit
            };

            // Obtener datos del libro diario
            const [asientos, total] = await Promise.all([
                BookModel.getLibroDiario(filters),
                BookModel.getLibroDiarioCount(filters)
            ]);

            let result = {
                success: true,
                data: {
                    asientos,
                    pagination: {
                        current_page: value.page,
                        total_pages: Math.ceil(total / value.limit),
                        total_records: total,
                        records_per_page: value.limit
                    }
                }
            };

            // Incluir detalles si se solicita
            if (value.include_details && asientos.length > 0) {
                const journalEntryIds = asientos.map(asiento => asiento.id);
                const detalles = await BookModel.getLibroDiarioDetails(journalEntryIds);
                
                // Agrupar detalles por asiento
                const detallesPorAsiento = detalles.reduce((acc, detalle) => {
                    if (!acc[detalle.journal_entry_id]) {
                        acc[detalle.journal_entry_id] = [];
                    }
                    acc[detalle.journal_entry_id].push(detalle);
                    return acc;
                }, {});

                // Agregar detalles a cada asiento
                result.data.asientos = asientos.map(asiento => ({
                    ...asiento,
                    detalles: detallesPorAsiento[asiento.id] || []
                }));
            }

            res.status(200).json(result);
        } catch (error) {
            logger.error(`Error al obtener libro diario: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener libro diario',
                error: error.message
            });
        }
    }

    /**
     * Obtener libro mayor por cuenta
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getLibroMayor(req, res) {
        try {
            // Validar parámetros de entrada
            const schema = Joi.object({
                account_id: Joi.number().integer().positive().required(),
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional()
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener datos del libro mayor
            const libroMayor = await BookModel.getLibroMayor(value);

            res.status(200).json({
                success: true,
                data: libroMayor
            });
        } catch (error) {
            logger.error(`Error al obtener libro mayor: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener libro mayor',
                error: error.message
            });
        }
    }

    /**
     * Obtener balance de comprobación
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getBalanceComprobacion(req, res) {
        try {
            // Validar parámetros de entrada
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                include_zero_balances: Joi.boolean().default(false)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener balance de comprobación
            const balance = await BookModel.getBalanceComprobacion(value);

            res.status(200).json({
                success: true,
                data: balance
            });
        } catch (error) {
            logger.error(`Error al obtener balance de comprobación: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener balance de comprobación',
                error: error.message
            });
        }
    }

    /**
     * Exportar libro diario a PDF
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportLibroDiarioPDF(req, res) {
        try {
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                status: Joi.string().valid('draft', 'posted', 'reversed').optional(),
                third_party_id: Joi.number().integer().positive().optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                entry_number: Joi.string().max(20).optional(),
                include_details: Joi.boolean().default(true)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener datos para exportar
            const asientos = await BookModel.getLibroDiario({
                ...value,
                limit: 10000 // Límite alto para exportación
            });

            let datosParaExportar = asientos;

            if (value.include_details && asientos.length > 0) {
                const journalEntryIds = asientos.map(asiento => asiento.id);
                const detalles = await BookModel.getLibroDiarioDetails(journalEntryIds);
                
                const detallesPorAsiento = detalles.reduce((acc, detalle) => {
                    if (!acc[detalle.journal_entry_id]) {
                        acc[detalle.journal_entry_id] = [];
                    }
                    acc[detalle.journal_entry_id].push(detalle);
                    return acc;
                }, {});

                datosParaExportar = asientos.map(asiento => ({
                    ...asiento,
                    detalles: detallesPorAsiento[asiento.id] || []
                }));
            }

            // Generar PDF
            const pdfBuffer = await ExportService.generateLibroDiarioPDF(datosParaExportar, value);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="libro_diario_${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            logger.error(`Error al exportar libro diario a PDF: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar libro diario a PDF',
                error: error.message
            });
        }
    }

    /**
     * Exportar libro diario a Excel
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportLibroDiarioExcel(req, res) {
        try {
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                status: Joi.string().valid('draft', 'posted', 'reversed').optional(),
                third_party_id: Joi.number().integer().positive().optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                entry_number: Joi.string().max(20).optional(),
                include_details: Joi.boolean().default(true)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener datos para exportar
            const asientos = await BookModel.getLibroDiario({
                ...value,
                limit: 10000
            });

            let datosParaExportar = asientos;

            if (value.include_details && asientos.length > 0) {
                const journalEntryIds = asientos.map(asiento => asiento.id);
                const detalles = await BookModel.getLibroDiarioDetails(journalEntryIds);
                
                const detallesPorAsiento = detalles.reduce((acc, detalle) => {
                    if (!acc[detalle.journal_entry_id]) {
                        acc[detalle.journal_entry_id] = [];
                    }
                    acc[detalle.journal_entry_id].push(detalle);
                    return acc;
                }, {});

                datosParaExportar = asientos.map(asiento => ({
                    ...asiento,
                    detalles: detallesPorAsiento[asiento.id] || []
                }));
            }

            // Generar Excel
            const excelBuffer = await ExportService.generateLibroDiarioExcel(datosParaExportar, value);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="libro_diario_${new Date().toISOString().split('T')[0]}.xlsx"`);
            res.send(excelBuffer);

        } catch (error) {
            logger.error(`Error al exportar libro diario a Excel: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar libro diario a Excel',
                error: error.message
            });
        }
    }

    /**
     * Exportar libro mayor a PDF
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportLibroMayorPDF(req, res) {
        try {
            const schema = Joi.object({
                account_id: Joi.number().integer().positive().required(),
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional()
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener datos del libro mayor
            const libroMayor = await BookModel.getLibroMayor(value);

            // Generar PDF
            const pdfBuffer = await ExportService.generateLibroMayorPDF(libroMayor, value);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="libro_mayor_${libroMayor.account.code}_${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            logger.error(`Error al exportar libro mayor a PDF: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar libro mayor a PDF',
                error: error.message
            });
        }
    }

    /**
     * Exportar libro mayor a Excel
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportLibroMayorExcel(req, res) {
        try {
            const schema = Joi.object({
                account_id: Joi.number().integer().positive().required(),
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional()
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener datos del libro mayor
            const libroMayor = await BookModel.getLibroMayor(value);

            // Generar Excel
            const excelBuffer = await ExportService.generateLibroMayorExcel(libroMayor, value);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="libro_mayor_${libroMayor.account.code}_${new Date().toISOString().split('T')[0]}.xlsx"`);
            res.send(excelBuffer);

        } catch (error) {
            logger.error(`Error al exportar libro mayor a Excel: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar libro mayor a Excel',
                error: error.message
            });
        }
    }

    /**
     * Exportar balance de comprobación a PDF
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportBalanceComprobacionPDF(req, res) {
        try {
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                include_zero_balances: Joi.boolean().default(false)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener balance de comprobación
            const balance = await BookModel.getBalanceComprobacion(value);

            // Generar PDF
            const pdfBuffer = await ExportService.generateBalanceComprobacionPDF(balance, value);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="balance_comprobacion_${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            logger.error(`Error al exportar balance de comprobación a PDF: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar balance de comprobación a PDF',
                error: error.message
            });
        }
    }

    /**
     * Exportar balance de comprobación a Excel
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async exportBalanceComprobacionExcel(req, res) {
        try {
            const schema = Joi.object({
                fecha_inicio: Joi.date().iso().optional(),
                fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),
                fiscal_period_id: Joi.number().integer().positive().optional(),
                include_zero_balances: Joi.boolean().default(false)
            });

            const { error, value } = schema.validate(req.query);
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }

            // Obtener balance de comprobación
            const balance = await BookModel.getBalanceComprobacion(value);

            // Generar Excel
            const excelBuffer = await ExportService.generateBalanceComprobacionExcel(balance, value);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="balance_comprobacion_${new Date().toISOString().split('T')[0]}.xlsx"`);
            res.send(excelBuffer);

        } catch (error) {
            logger.error(`Error al exportar balance de comprobación a Excel: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al exportar balance de comprobación a Excel',
                error: error.message
            });
        }
    }

    /**
     * Obtener datos para filtros (períodos fiscales, cuentas, etc.)
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getFilterData(req, res) {
        try {
            const [fiscalPeriods, accounts] = await Promise.all([
                BookModel.getFiscalPeriods(),
                BookModel.getActiveAccounts()
            ]);

            res.status(200).json({
                success: true,
                data: {
                    fiscal_periods: fiscalPeriods,
                    accounts: accounts
                }
            });
        } catch (error) {
            logger.error(`Error al obtener datos para filtros: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos para filtros',
                error: error.message
            });
        }
    }
}

module.exports = BookController;