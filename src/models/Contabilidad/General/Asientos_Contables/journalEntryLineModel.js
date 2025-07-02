const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');

class JournalEntryLine {
    // Obtener todas las líneas de un asiento contable
    static async getAllByJournalEntryId(journalEntryId) {
        try {
            const [rows] = await pool.query(
                `SELECT jel.*, coa.name as account_name, coa.code as account_code,
                       coa.balance_type as account_balance_type,
                       tp.name as third_party_name, tp.code as third_party_code
                FROM journal_entry_lines jel
                LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                LEFT JOIN third_parties tp ON jel.third_party_id = tp.id
                WHERE jel.journal_entry_id = ?
                ORDER BY jel.order_number ASC`,
                [journalEntryId]
            );
            return rows;
        } catch (error) {
            logger.error(`Error al obtener líneas del asiento contable ${journalEntryId}: ${error.message}`);
            throw error;
        }
    }

    // Obtener una línea específica de un asiento contable
    static async getById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT jel.*, coa.name as account_name, coa.code as account_code,
                       tp.name as third_party_name, tp.code as third_party_code
                FROM journal_entry_lines jel
                LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                LEFT JOIN third_parties tp ON jel.third_party_id = tp.id
                WHERE jel.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            logger.error(`Error al obtener línea de asiento contable con ID ${id}: ${error.message}`);
            throw error;
        }
    }

    // Crear una nueva línea de asiento contable
    static async create(lineData) {
        try {
            // Validar que o bien débito o crédito sea mayor que 0, pero no ambos
            if ((parseFloat(lineData.debit_amount || 0) > 0 && parseFloat(lineData.credit_amount || 0) > 0) ||
                (parseFloat(lineData.debit_amount || 0) === 0 && parseFloat(lineData.credit_amount || 0) === 0)) {
                throw new Error('Una línea de asiento debe tener un valor en débito o en crédito, pero no en ambos ni en ninguno');
            }

            const [result] = await pool.query(
                `INSERT INTO journal_entry_lines
                (journal_entry_id, account_id, third_party_id, description, debit_amount, 
                 credit_amount, order_number)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    lineData.journal_entry_id,
                    lineData.account_id,
                    lineData.third_party_id || null,
                    lineData.description || '',
                    lineData.debit_amount || 0,
                    lineData.credit_amount || 0,
                    lineData.order_number
                ]
            );

            // Actualizar totales en la cabecera del asiento
            await this.updateJournalEntryTotals(lineData.journal_entry_id);

            return { id: result.insertId, ...lineData };
        } catch (error) {
            logger.error(`Error al crear línea de asiento contable: ${error.message}`);
            throw error;
        }
    }

    // Actualizar una línea de asiento contable
    static async update(id, lineData) {
        try {
            // Validar que o bien débito o crédito sea mayor que 0, pero no ambos
            if ((parseFloat(lineData.debit_amount || 0) > 0 && parseFloat(lineData.credit_amount || 0) > 0) ||
                (parseFloat(lineData.debit_amount || 0) === 0 && parseFloat(lineData.credit_amount || 0) === 0)) {
                throw new Error('Una línea de asiento debe tener un valor en débito o en crédito, pero no en ambos ni en ninguno');
            }

            // Obtener el journal_entry_id antes de actualizar
            const [currentLine] = await pool.query(
                'SELECT journal_entry_id FROM journal_entry_lines WHERE id = ?',
                [id]
            );

            if (!currentLine.length) {
                throw new Error(`Línea de asiento contable con ID ${id} no encontrada`);
            }

            const journalEntryId = currentLine[0].journal_entry_id;

            await pool.query(
                `UPDATE journal_entry_lines SET
                account_id = ?,
                third_party_id = ?,
                description = ?,
                debit_amount = ?,
                credit_amount = ?,
                order_number = ?
                WHERE id = ?`,
                [
                    lineData.account_id,
                    lineData.third_party_id || null,
                    lineData.description || '',
                    lineData.debit_amount || 0,
                    lineData.credit_amount || 0,
                    lineData.order_number,
                    id
                ]
            );

            // Actualizar totales en la cabecera del asiento
            await this.updateJournalEntryTotals(journalEntryId);

            return { id, ...lineData };
        } catch (error) {
            logger.error(`Error al actualizar línea de asiento contable ${id}: ${error.message}`);
            throw error;
        }
    }

    // Eliminar una línea de asiento contable
    static async delete(id) {
        try {
            // Obtener el journal_entry_id antes de eliminar
            const [currentLine] = await pool.query(
                'SELECT journal_entry_id FROM journal_entry_lines WHERE id = ?',
                [id]
            );

            if (!currentLine.length) {
                throw new Error(`Línea de asiento contable con ID ${id} no encontrada`);
            }

            const journalEntryId = currentLine[0].journal_entry_id;

            await pool.query(
                'DELETE FROM journal_entry_lines WHERE id = ?',
                [id]
            );

            // Actualizar totales en la cabecera del asiento
            await this.updateJournalEntryTotals(journalEntryId);

            return { id, deleted: true };
        } catch (error) {
            logger.error(`Error al eliminar línea de asiento contable ${id}: ${error.message}`);
            throw error;
        }
    }

    // Actualizar los totales en la cabecera del asiento
    static async updateJournalEntryTotals(journalEntryId) {
        try {
            // Calcular totales
            const [totals] = await pool.query(
                `SELECT 
                    SUM(debit_amount) as total_debit, 
                    SUM(credit_amount) as total_credit
                FROM journal_entry_lines
                WHERE journal_entry_id = ?`,
                [journalEntryId]
            );

            const totalDebit = parseFloat(totals[0].total_debit || 0);
            const totalCredit = parseFloat(totals[0].total_credit || 0);

            // Actualizar la cabecera
            await pool.query(
                `UPDATE journal_entries SET
                total_debit = ?,
                total_credit = ?
                WHERE id = ?`,
                [totalDebit, totalCredit, journalEntryId]
            );

            return { total_debit: totalDebit, total_credit: totalCredit };
        } catch (error) {
            logger.error(`Error al actualizar totales del asiento contable ${journalEntryId}: ${error.message}`);
            throw error;
        }
    }

    // Reordenar líneas de un asiento contable
    static async reorderLines(journalEntryId) {
        try {
            // Obtener todas las líneas ordenadas por order_number actual
            const [lines] = await pool.query(
                'SELECT id FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY order_number ASC',
                [journalEntryId]
            );

            // Actualizar order_number secuencialmente
            for (let i = 0; i < lines.length; i++) {
                await pool.query(
                    'UPDATE journal_entry_lines SET order_number = ? WHERE id = ?',
                    [i + 1, lines[i].id]
                );
            }

            return { journal_entry_id: journalEntryId, reordered: true, count: lines.length };
        } catch (error) {
            logger.error(`Error al reordenar líneas del asiento contable ${journalEntryId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = JournalEntryLine; 