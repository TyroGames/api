const JournalEntry = require('../../../../models/Contabilidad/General/Asientos_Contables/journalEntryModel');
const JournalEntryLine = require('../../../../models/Contabilidad/General/Asientos_Contables/journalEntryLineModel');
const logger = require('../../../../utils/logger');

class JournalEntryController {
    /**
     * Obtener todos los asientos contables
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getAll(req, res) {
        try {
            const filters = req.query;
            const journalEntries = await JournalEntry.getAll(filters);
            
            res.status(200).json({
                success: true,
                data: journalEntries
            });
        } catch (error) {
            logger.error(`Error al obtener asientos contables: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener asientos contables',
                error: error.message
            });
        }
    }

    /**
     * Obtener un asiento contable por su ID
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener el asiento contable
            const journalEntry = await JournalEntry.getById(id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${id}`
                });
            }
            
            // Obtener las líneas del asiento
            const lines = await JournalEntryLine.getAllByJournalEntryId(id);
            
            // Combinar ambos resultados
            journalEntry.lines = lines;
            
            res.status(200).json({
                success: true,
                data: journalEntry
            });
        } catch (error) {
            logger.error(`Error al obtener asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Obtener un asiento contable por su número
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getByEntryNumber(req, res) {
        try {
            const { entryNumber } = req.params;
            
            // Obtener el asiento contable por número
            const journalEntry = await JournalEntry.getByEntryNumber(entryNumber);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con número ${entryNumber}`
                });
            }
            
            // Obtener las líneas del asiento
            const lines = await JournalEntryLine.getAllByJournalEntryId(journalEntry.id);
            
            // Combinar ambos resultados
            journalEntry.lines = lines;
            
            res.status(200).json({
                success: true,
                data: journalEntry
            });
        } catch (error) {
            logger.error(`Error al obtener asiento contable por número: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener asiento contable por número',
                error: error.message
            });
        }
    }

    /**
     * Crear un nuevo asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async create(req, res) {
        try {
            const { journalEntry, lines } = req.body;
            
            // Verificar que se proporcionen los datos necesarios
            if (!journalEntry || !Array.isArray(lines) || lines.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos. Se requiere el asiento contable y sus líneas'
                });
            }
            
            // Verificar que las líneas tengan la estructura correcta
            for (const line of lines) {
                if (!line.account_id || 
                    ((!line.debit_amount || parseFloat(line.debit_amount) === 0) && 
                     (!line.credit_amount || parseFloat(line.credit_amount) === 0)) ||
                    (line.debit_amount && line.credit_amount && 
                     parseFloat(line.debit_amount) > 0 && parseFloat(line.credit_amount) > 0)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Datos inválidos en líneas. Cada línea debe tener una cuenta y un valor en débito o crédito, pero no en ambos'
                    });
                }
            }
            
            // Verificar si el asiento está balanceado
            let totalDebit = 0;
            let totalCredit = 0;
            
            lines.forEach(line => {
                totalDebit += parseFloat(line.debit_amount || 0);
                totalCredit += parseFloat(line.credit_amount || 0);
            });
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'El asiento contable no está balanceado. La suma de débitos debe ser igual a la suma de créditos.',
                    details: {
                        totalDebit,
                        totalCredit,
                        difference: totalDebit - totalCredit
                    }
                });
            }
            
            // Si el tercero está presente, verificar que exista
            if (journalEntry.third_party_id) {
                // Aquí podrías añadir una verificación de que el tercero existe en la base de datos
                // Por simplicidad, se omite esa validación en este ejemplo
            }
            
            // Generar número de asiento si no se proporciona
            if (!journalEntry.entry_number) {
                journalEntry.entry_number = await JournalEntry.generateEntryNumber();
            }
            
            // Agregar usuario creador
            journalEntry.created_by = req.user.id;
            
            // Crear el asiento contable
            const createdJournalEntry = await JournalEntry.create(journalEntry, lines);
            
            res.status(201).json({
                success: true,
                message: 'Asiento contable creado correctamente',
                data: createdJournalEntry
            });
        } catch (error) {
            logger.error(`Error al crear asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al crear asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Actualizar un asiento contable existente
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { journalEntry, lines } = req.body;
            
            // Verificar que se proporcionen los datos necesarios
            if (!journalEntry || !Array.isArray(lines)) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos. Se requiere el asiento contable y sus líneas'
                });
            }
            
            // Verificar que el asiento exista
            const existingEntry = await JournalEntry.getById(id);
            
            if (!existingEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento esté en estado borrador
            if (existingEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden modificar asientos contables en estado borrador'
                });
            }
            
            // Verificar que las líneas tengan la estructura correcta
            for (const line of lines) {
                if (!line.account_id || 
                    ((!line.debit_amount || parseFloat(line.debit_amount) === 0) && 
                     (!line.credit_amount || parseFloat(line.credit_amount) === 0)) ||
                    (line.debit_amount && line.credit_amount && 
                     parseFloat(line.debit_amount) > 0 && parseFloat(line.credit_amount) > 0)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Datos inválidos en líneas. Cada línea debe tener una cuenta y un valor en débito o crédito, pero no en ambos'
                    });
                }
            }
            
            // Verificar si el asiento está balanceado
            let totalDebit = 0;
            let totalCredit = 0;
            
            lines.forEach(line => {
                totalDebit += parseFloat(line.debit_amount || 0);
                totalCredit += parseFloat(line.credit_amount || 0);
            });
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'El asiento contable no está balanceado. La suma de débitos debe ser igual a la suma de créditos.',
                    details: {
                        totalDebit,
                        totalCredit,
                        difference: totalDebit - totalCredit
                    }
                });
            }
            
            // Si el tercero está presente, verificar que exista
            if (journalEntry.third_party_id) {
                // Aquí podrías añadir una verificación de que el tercero existe en la base de datos
                // Por simplicidad, se omite esa validación en este ejemplo
            }
            
            // Actualizar el asiento contable
            const updatedJournalEntry = await JournalEntry.update(id, journalEntry, lines);
            
            res.status(200).json({
                success: true,
                message: 'Asiento contable actualizado correctamente',
                data: updatedJournalEntry
            });
        } catch (error) {
            logger.error(`Error al actualizar asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Aprobar un asiento contable (cambiar de borrador a aprobado)
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async post(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar que el asiento exista
            const journalEntry = await JournalEntry.getById(id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento esté en estado borrador
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden aprobar asientos contables en estado borrador'
                });
            }
            
            // Aprobar el asiento contable
            const result = await JournalEntry.post(id, req.user.id);
            
            res.status(200).json({
                success: true,
                message: 'Asiento contable aprobado correctamente',
                data: result
            });
        } catch (error) {
            logger.error(`Error al aprobar asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al aprobar asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Anular un asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async reverse(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            
            // Verificar que se proporcione el motivo
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar el motivo de la anulación'
                });
            }
            
            // Verificar que el asiento exista
            const journalEntry = await JournalEntry.getById(id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento esté aprobado
            if (journalEntry.status !== 'posted') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden anular asientos contables en estado aprobado'
                });
            }
            
            // Anular el asiento contable
            const result = await JournalEntry.reverse(id, req.user.id, reason);
            
            res.status(200).json({
                success: true,
                message: 'Asiento contable anulado correctamente',
                data: result
            });
        } catch (error) {
            logger.error(`Error al anular asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al anular asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Eliminar un asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar que el asiento exista
            const journalEntry = await JournalEntry.getById(id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento esté en estado borrador
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden eliminar asientos contables en estado borrador'
                });
            }
            
            // Eliminar el asiento contable
            await JournalEntry.delete(id);
            
            res.status(200).json({
                success: true,
                message: 'Asiento contable eliminado correctamente'
            });
        } catch (error) {
            logger.error(`Error al eliminar asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Generar número de asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async generateEntryNumber(req, res) {
        try {
            const { type } = req.query;
            const entryNumber = await JournalEntry.generateEntryNumber(type || 'JE');
            
            res.status(200).json({
                success: true,
                data: {
                    entry_number: entryNumber
                }
            });
        } catch (error) {
            logger.error(`Error al generar número de asiento: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al generar número de asiento',
                error: error.message
            });
        }
    }
}

module.exports = JournalEntryController; 