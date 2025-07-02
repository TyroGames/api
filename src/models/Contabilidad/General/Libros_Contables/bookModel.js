/**
 * Modelo para gestionar consultas de libros contables
 * @module models/Contabilidad/General/Libros_Contables/bookModel
 */


const { pool } = require('../../../../config/db');
const logger = require('../../../../utils/logger');
const moment = require('moment');

class BookModel {
    /**
     * Obtener datos del Libro Diario con filtros
     * @param {Object} filters - Filtros para la consulta
     * @returns {Promise<Array>} Asientos contables para el libro diario
     */
    static async getLibroDiario(filters = {}) {
        try {
            let query = `
                SELECT 
                    je.id,
                    je.entry_number,
                    DATE_FORMAT(je.date, '%Y-%m-%d') as date,
                    je.reference,
                    je.description,
                    je.status,
                    je.total_debit,
                    je.total_credit,
                    tp.name as third_party_name,
                    tp.identification_number as third_party_id,
                    u.full_name as created_by_name,
                    DATE_FORMAT(je.created_at, '%Y-%m-%d %H:%i:%s') as created_at
                FROM journal_entries je
                LEFT JOIN third_parties tp ON je.third_party_id = tp.id
                LEFT JOIN users u ON je.created_by = u.id
                WHERE 1=1
            `;

            const params = [];

            // Filtro por rango de fechas
            if (filters.fecha_inicio && filters.fecha_fin) {
                query += ` AND je.date BETWEEN ? AND ?`;
                params.push(filters.fecha_inicio, filters.fecha_fin);
            }

            // Filtro por estado
            if (filters.status) {
                query += ` AND je.status = ?`;
                params.push(filters.status);
            }

            // Filtro por tercero
            if (filters.third_party_id) {
                query += ` AND je.third_party_id = ?`;
                params.push(filters.third_party_id);
            }

            // Filtro por período fiscal
            if (filters.fiscal_period_id) {
                query += ` AND je.fiscal_period_id = ?`;
                params.push(filters.fiscal_period_id);
            }

            // Filtro por número de asiento
            if (filters.entry_number) {
                query += ` AND je.entry_number LIKE ?`;
                params.push(`%${filters.entry_number}%`);
            }

            // Ordenamiento
            query += ` ORDER BY je.date ASC, je.entry_number ASC`;

            // Paginación
            if (filters.limit && filters.offset !== undefined) {
                query += ` LIMIT ? OFFSET ?`;
                params.push(parseInt(filters.limit), parseInt(filters.offset));
            }

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            logger.error(`Error al obtener libro diario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener contador de registros del libro diario
     * @param {Object} filters - Filtros para la consulta
     * @returns {Promise<Number>} Cantidad total de registros
     */
    static async getLibroDiarioCount(filters = {}) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM journal_entries je
                LEFT JOIN third_parties tp ON je.third_party_id = tp.id
                WHERE 1=1
            `;

            const params = [];

            // Aplicar los mismos filtros que en getLibroDiario
            if (filters.fecha_inicio && filters.fecha_fin) {
                query += ` AND je.date BETWEEN ? AND ?`;
                params.push(filters.fecha_inicio, filters.fecha_fin);
            }

            if (filters.status) {
                query += ` AND je.status = ?`;
                params.push(filters.status);
            }

            if (filters.third_party_id) {
                query += ` AND je.third_party_id = ?`;
                params.push(filters.third_party_id);
            }

            if (filters.fiscal_period_id) {
                query += ` AND je.fiscal_period_id = ?`;
                params.push(filters.fiscal_period_id);
            }

            if (filters.entry_number) {
                query += ` AND je.entry_number LIKE ?`;
                params.push(`%${filters.entry_number}%`);
            }

            const [rows] = await pool.execute(query, params);
            return rows[0].total;
        } catch (error) {
            logger.error(`Error al contar libro diario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener detalles de asientos para el libro diario
     * @param {Array} journalEntryIds - IDs de los asientos contables
     * @returns {Promise<Array>} Líneas de asientos con detalles
     */
    static async getLibroDiarioDetails(journalEntryIds) {
        try {
            if (!journalEntryIds || journalEntryIds.length === 0) {
                return [];
            }

            const placeholders = journalEntryIds.map(() => '?').join(',');
            
            const query = `
                SELECT 
                    jel.journal_entry_id,
                    jel.order_number,
                    coa.code as account_code,
                    coa.name as account_name,
                    jel.description,
                    jel.debit_amount,
                    jel.credit_amount,
                    tp.name as third_party_name,
                    tp.identification_number as third_party_identification
                FROM journal_entry_lines jel
                INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
                LEFT JOIN third_parties tp ON jel.third_party_id = tp.id
                WHERE jel.journal_entry_id IN (${placeholders})
                ORDER BY jel.journal_entry_id, jel.order_number
            `;

            const [rows] = await pool.execute(query, journalEntryIds);
            return rows;
        } catch (error) {
            logger.error(`Error al obtener detalles del libro diario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener datos del Libro Mayor por cuenta
     * @param {Object} filters - Filtros para la consulta
     * @returns {Promise<Object>} Datos del libro mayor
     */
    static async getLibroMayor(filters = {}) {
        try {
            const { account_id, fecha_inicio, fecha_fin, fiscal_period_id } = filters;

            if (!account_id) {
                throw new Error('Se requiere el ID de la cuenta para el libro mayor');
            }

            // Obtener información de la cuenta
            const accountQuery = `
                SELECT 
                    id,
                    code,
                    name,
                    balance_type,
                    level
                FROM chart_of_accounts 
                WHERE id = ? AND is_active = true
            `;
            const [accountRows] = await pool.execute(accountQuery, [account_id]);
            
            if (accountRows.length === 0) {
                throw new Error('Cuenta contable no encontrada');
            }

            const account = accountRows[0];

            // Obtener saldo inicial
            let saldoInicial = 0;
            if (fecha_inicio) {
                const saldoInicialQuery = `
                    SELECT 
                        COALESCE(SUM(jel.debit_amount), 0) as total_debit,
                        COALESCE(SUM(jel.credit_amount), 0) as total_credit
                    FROM journal_entry_lines jel
                    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
                    WHERE jel.account_id = ? 
                        AND je.status = 'posted'
                        AND je.date < ?
                `;
                const [saldoRows] = await pool.execute(saldoInicialQuery, [account_id, fecha_inicio]);
                
                if (saldoRows.length > 0) {
                    const { total_debit, total_credit } = saldoRows[0];
                    saldoInicial = account.balance_type === 'debit' 
                        ? (total_debit - total_credit)
                        : (total_credit - total_debit);
                }
            }

            // Obtener movimientos
            let movimientosQuery = `
                SELECT 
                    je.id as journal_entry_id,
                    je.entry_number,
                    DATE_FORMAT(je.date, '%Y-%m-%d') as date,
                    je.reference,
                    jel.description,
                    jel.debit_amount,
                    jel.credit_amount,
                    tp.name as third_party_name,
                    tp.identification_number as third_party_identification
                FROM journal_entry_lines jel
                INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
                LEFT JOIN third_parties tp ON jel.third_party_id = tp.id
                WHERE jel.account_id = ? 
                    AND je.status = 'posted'
            `;

            const params = [account_id];

            // Filtros adicionales
            if (fecha_inicio && fecha_fin) {
                movimientosQuery += ` AND je.date BETWEEN ? AND ?`;
                params.push(fecha_inicio, fecha_fin);
            }

            if (fiscal_period_id) {
                movimientosQuery += ` AND je.fiscal_period_id = ?`;
                params.push(fiscal_period_id);
            }

            movimientosQuery += ` ORDER BY je.date ASC, je.entry_number ASC`;

            const [movimientos] = await pool.execute(movimientosQuery, params);

            // Calcular saldos acumulados
            let saldoAcumulado = saldoInicial;
            const movimientosConSaldo = movimientos.map(mov => {
                const movimiento = parseFloat(mov.debit_amount || 0) - parseFloat(mov.credit_amount || 0);
                saldoAcumulado += account.balance_type === 'debit' ? movimiento : -movimiento;
                
                return {
                    ...mov,
                    saldo_acumulado: saldoAcumulado
                };
            });

            // Calcular totales
            const totalDebitos = movimientos.reduce((sum, mov) => sum + parseFloat(mov.debit_amount || 0), 0);
            const totalCreditos = movimientos.reduce((sum, mov) => sum + parseFloat(mov.credit_amount || 0), 0);

            return {
                account: account,
                saldo_inicial: saldoInicial,
                movimientos: movimientosConSaldo,
                total_debitos: totalDebitos,
                total_creditos: totalCreditos,
                saldo_final: saldoAcumulado
            };
        } catch (error) {
            logger.error(`Error al obtener libro mayor: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener balance de comprobación
     * @param {Object} filters - Filtros para la consulta
     * @returns {Promise<Object>} Balance de comprobación
     */
    static async getBalanceComprobacion(filters = {}) {
        try {
            const { fecha_inicio, fecha_fin, fiscal_period_id, include_zero_balances = false } = filters;

            let query = `
                SELECT 
                    coa.id,
                    coa.code,
                    coa.name,
                    coa.balance_type,
                    COALESCE(SUM(jel.debit_amount), 0) as total_debit,
                    COALESCE(SUM(jel.credit_amount), 0) as total_credit
                FROM chart_of_accounts coa
                LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
                LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
                WHERE coa.is_active = true
                    AND coa.allows_entries = true
            `;

            const params = [];

            // Filtros por fecha
            if (fecha_inicio && fecha_fin) {
                query += ` AND je.date BETWEEN ? AND ?`;
                params.push(fecha_inicio, fecha_fin);
            }

            // Filtro por período fiscal
            if (fiscal_period_id) {
                query += ` AND je.fiscal_period_id = ?`;
                params.push(fiscal_period_id);
            }

            // Solo asientos registrados
            query += ` AND (je.status = 'posted' OR je.status IS NULL)`;

            query += ` GROUP BY coa.id, coa.code, coa.name, coa.balance_type`;

            // Filtrar cuentas con saldo cero si no se incluyen explícitamente
            if (!include_zero_balances) {
                query += ` HAVING (COALESCE(SUM(jel.debit_amount), 0) + COALESCE(SUM(jel.credit_amount), 0)) > 0`;
            }

            query += ` ORDER BY coa.code`;

            const [cuentas] = await pool.execute(query, params);

            // Calcular saldos deudores y acreedores
            const cuentasConSaldos = cuentas.map(cuenta => {
                const totalDebit = parseFloat(cuenta.total_debit || 0);
                const totalCredit = parseFloat(cuenta.total_credit || 0);
                const diferencia = totalDebit - totalCredit;

                let saldoDeudor = 0;
                let saldoAcreedor = 0;

                if (cuenta.balance_type === 'debit') {
                    // Cuenta deudora
                    if (diferencia > 0) {
                        saldoDeudor = diferencia;
                    } else if (diferencia < 0) {
                        saldoAcreedor = Math.abs(diferencia);
                    }
                } else {
                    // Cuenta acreedora
                    if (diferencia < 0) {
                        saldoAcreedor = Math.abs(diferencia);
                    } else if (diferencia > 0) {
                        saldoDeudor = diferencia;
                    }
                }

                return {
                    ...cuenta,
                    saldo_deudor: saldoDeudor,
                    saldo_acreedor: saldoAcreedor
                };
            });

            // Calcular totales
            const totales = cuentasConSaldos.reduce((acc, cuenta) => {
                acc.total_debitos += parseFloat(cuenta.total_debit || 0);
                acc.total_creditos += parseFloat(cuenta.total_credit || 0);
                acc.total_saldos_deudores += parseFloat(cuenta.saldo_deudor || 0);
                acc.total_saldos_acreedores += parseFloat(cuenta.saldo_acreedor || 0);
                return acc;
            }, {
                total_debitos: 0,
                total_creditos: 0,
                total_saldos_deudores: 0,
                total_saldos_acreedores: 0
            });

            // Calcular diferencias y estado del balance
            totales.diferencia_debitos_creditos = totales.total_debitos - totales.total_creditos;
            totales.diferencia_saldos = totales.total_saldos_deudores - totales.total_saldos_acreedores;

            const balance = {
                balance_correcto: Math.abs(totales.diferencia_debitos_creditos) < 0.01 && 
                                Math.abs(totales.diferencia_saldos) < 0.01,
                diferencia_debitos_creditos: totales.diferencia_debitos_creditos,
                diferencia_saldos: totales.diferencia_saldos
            };

            return {
                cuentas: cuentasConSaldos,
                totales,
                balance
            };
        } catch (error) {
            logger.error(`Error al obtener balance de comprobación: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener períodos fiscales activos
     * @returns {Promise<Array>} Lista de períodos fiscales
     */
    static async getFiscalPeriods() {
        try {
            const query = `
                SELECT 
                    id,
                    CONCAT(
                        MONTHNAME(start_date), ' ', YEAR(start_date),
                        ' - ',
                        MONTHNAME(end_date), ' ', YEAR(end_date)
                    ) as name,
                    start_date,
                    end_date,
                    is_closed
                FROM fiscal_periods 
                WHERE is_closed = false
                ORDER BY start_date DESC
            `;

            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            logger.error(`Error al obtener períodos fiscales: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener cuentas contables activas
     * @returns {Promise<Array>} Lista de cuentas contables
     */
    static async getActiveAccounts() {
        try {
            const query = `
                SELECT 
                    id,
                    code,
                    name,
                    balance_type,
                    level,
                    allows_entries
                FROM chart_of_accounts 
                WHERE is_active = true
                ORDER BY code
            `;

            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            logger.error(`Error al obtener cuentas activas: ${error.message}`);
            throw error;
        }
    }
}

module.exports = BookModel;