const JournalEntryLine = require('../../../../models/Contabilidad/General/Asientos_Contables/journalEntryLineModel');
const JournalEntry = require('../../../../models/Contabilidad/General/Asientos_Contables/journalEntryModel');
const logger = require('../../../../utils/logger');

class JournalEntryLineController {
    /**
     * Obtener todas las líneas de un asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getAllByJournalEntryId(req, res) {
        try {
            const { journal_entry_id } = req.params;
            
            // Verificar que el asiento contable exista
            const journalEntry = await JournalEntry.getById(journal_entry_id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${journal_entry_id}`
                });
            }
            
            const lines = await JournalEntryLine.getAllByJournalEntryId(journal_entry_id);
            
            res.status(200).json({
                success: true,
                data: lines
            });
        } catch (error) {
            logger.error(`Error al obtener líneas de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener líneas de asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Obtener una línea específica de un asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            
            const line = await JournalEntryLine.getById(id);
            
            if (!line) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró la línea de asiento contable con ID ${id}`
                });
            }
            
            res.status(200).json({
                success: true,
                data: line
            });
        } catch (error) {
            logger.error(`Error al obtener línea de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener línea de asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Crear una nueva línea de asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async create(req, res) {
        try {
            const lineData = req.body;
            
            // Verificar que se proporcionen los datos necesarios
            if (!lineData.journal_entry_id || !lineData.account_id || 
                ((!lineData.debit_amount || parseFloat(lineData.debit_amount) === 0) && 
                 (!lineData.credit_amount || parseFloat(lineData.credit_amount) === 0)) ||
                (lineData.debit_amount && lineData.credit_amount && 
                 parseFloat(lineData.debit_amount) > 0 && parseFloat(lineData.credit_amount) > 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos. Se requiere asiento contable, cuenta y un valor en débito o crédito, pero no en ambos'
                });
            }
            
            // Verificar que el asiento contable exista
            const journalEntry = await JournalEntry.getById(lineData.journal_entry_id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${lineData.journal_entry_id}`
                });
            }
            
            // Verificar que el asiento esté en estado borrador
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden agregar líneas a asientos contables en estado borrador'
                });
            }
            
            // Si el tercero está presente, verificar que exista
            if (lineData.third_party_id) {
                // Aquí podrías añadir una verificación de que el tercero existe en la base de datos
                // Por simplicidad, se omite esa validación en este ejemplo
            }
            
            // Determinar el número de orden
            const existingLines = await JournalEntryLine.getAllByJournalEntryId(lineData.journal_entry_id);
            lineData.order_number = existingLines.length + 1;
            
            // Crear la línea
            const createdLine = await JournalEntryLine.create(lineData);
            
            res.status(201).json({
                success: true,
                message: 'Línea de asiento contable creada correctamente',
                data: createdLine
            });
        } catch (error) {
            logger.error(`Error al crear línea de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al crear línea de asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Actualizar una línea de asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const lineData = req.body;
            
            // Verificar que se proporcionen los datos necesarios
            if (!lineData.account_id || 
                ((!lineData.debit_amount || parseFloat(lineData.debit_amount) === 0) && 
                 (!lineData.credit_amount || parseFloat(lineData.credit_amount) === 0)) ||
                (lineData.debit_amount && lineData.credit_amount && 
                 parseFloat(lineData.debit_amount) > 0 && parseFloat(lineData.credit_amount) > 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos. Se requiere cuenta y un valor en débito o crédito, pero no en ambos'
                });
            }
            
            // Verificar que la línea exista
            const existingLine = await JournalEntryLine.getById(id);
            
            if (!existingLine) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró la línea de asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento contable esté en estado borrador
            const journalEntry = await JournalEntry.getById(existingLine.journal_entry_id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable asociado`
                });
            }
            
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden modificar líneas de asientos contables en estado borrador'
                });
            }
            
            // Si el tercero está presente, verificar que exista
            if (lineData.third_party_id) {
                // Aquí podrías añadir una verificación de que el tercero existe en la base de datos
                // Por simplicidad, se omite esa validación en este ejemplo
            }
            
            // Actualizar la línea
            lineData.order_number = existingLine.order_number; // Mantener el mismo orden
            const updatedLine = await JournalEntryLine.update(id, lineData);
            
            res.status(200).json({
                success: true,
                message: 'Línea de asiento contable actualizada correctamente',
                data: updatedLine
            });
        } catch (error) {
            logger.error(`Error al actualizar línea de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar línea de asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Eliminar una línea de asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar que la línea exista
            const existingLine = await JournalEntryLine.getById(id);
            
            if (!existingLine) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró la línea de asiento contable con ID ${id}`
                });
            }
            
            // Verificar que el asiento contable esté en estado borrador
            const journalEntry = await JournalEntry.getById(existingLine.journal_entry_id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable asociado`
                });
            }
            
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden eliminar líneas de asientos contables en estado borrador'
                });
            }
            
            // Eliminar la línea
            await JournalEntryLine.delete(id);
            
            // Reordenar las líneas restantes
            await JournalEntryLine.reorderLines(existingLine.journal_entry_id);
            
            res.status(200).json({
                success: true,
                message: 'Línea de asiento contable eliminada correctamente'
            });
        } catch (error) {
            logger.error(`Error al eliminar línea de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar línea de asiento contable',
                error: error.message
            });
        }
    }

    /**
     * Reordenar las líneas de un asiento contable
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<void>}
     */
    static async reorderLines(req, res) {
        try {
            const { journal_entry_id } = req.params;
            
            // Verificar que el asiento contable exista
            const journalEntry = await JournalEntry.getById(journal_entry_id);
            
            if (!journalEntry) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró el asiento contable con ID ${journal_entry_id}`
                });
            }
            
            // Verificar que el asiento esté en estado borrador
            if (journalEntry.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden reordenar líneas de asientos contables en estado borrador'
                });
            }
            
            // Reordenar las líneas
            const result = await JournalEntryLine.reorderLines(journal_entry_id);
            
            res.status(200).json({
                success: true,
                message: `Se reordenaron ${result.count} líneas correctamente`,
                data: result
            });
        } catch (error) {
            logger.error(`Error al reordenar líneas de asiento contable: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al reordenar líneas de asiento contable',
                error: error.message
            });
        }
    }
}

module.exports = JournalEntryLineController; 