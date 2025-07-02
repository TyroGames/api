/**
 * Servicio para exportar libros contables a PDF y Excel
 * @module services/Contabilidad/exportService
 */

const PDFKit = require('pdfkit');
const ExcelJS = require('exceljs');
const logger = require('../../utils/logger');
const moment = require('moment');

class ExportService {
    /**
     * Generar PDF del Libro Diario
     * @param {Array} asientos - Array de asientos contables
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del PDF
     */
    static async generateLibroDiarioPDF(asientos, filters = {}) {
        try {
            const doc = new PDFKit({ margin: 40, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {});

            // Título del documento
            doc.fontSize(16).font('Helvetica-Bold').text('LIBRO DIARIO', { align: 'center' });
            doc.moveDown(0.5);

            // Información de filtros
            if (filters.fecha_inicio || filters.fecha_fin) {
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                doc.fontSize(10).font('Helvetica').text(`Período: ${fechaInicio} - ${fechaFin}`, { align: 'center' });
            }

            doc.fontSize(8).text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
            doc.moveDown(1);

            // Encabezados de tabla
            const tableTop = doc.y;
            const colWidths = {
                fecha: 70,
                numero: 80,
                referencia: 80,
                descripcion: 200,
                debito: 70,
                credito: 70
            };

            let currentX = 40;
            doc.fontSize(8).font('Helvetica-Bold');
            
            doc.text('FECHA', currentX, tableTop, { width: colWidths.fecha, align: 'center' });
            currentX += colWidths.fecha;
            
            doc.text('NÚMERO', currentX, tableTop, { width: colWidths.numero, align: 'center' });
            currentX += colWidths.numero;
            
            doc.text('REFERENCIA', currentX, tableTop, { width: colWidths.referencia, align: 'center' });
            currentX += colWidths.referencia;
            
            doc.text('DESCRIPCIÓN', currentX, tableTop, { width: colWidths.descripcion, align: 'center' });
            currentX += colWidths.descripcion;
            
            doc.text('DÉBITO', currentX, tableTop, { width: colWidths.debito, align: 'center' });
            currentX += colWidths.debito;
            
            doc.text('CRÉDITO', currentX, tableTop, { width: colWidths.credito, align: 'center' });

            // Línea separadora
            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            let totalDebitos = 0;
            let totalCreditos = 0;

            doc.font('Helvetica').fontSize(7);

            for (const asiento of asientos) {
                // Verificar si necesitamos nueva página
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                currentX = 40;
                
                // Datos del asiento
                doc.text(moment(asiento.date).format('DD/MM/YYYY'), currentX, currentY, { width: colWidths.fecha, align: 'center' });
                currentX += colWidths.fecha;
                
                doc.text(asiento.entry_number || '', currentX, currentY, { width: colWidths.numero, align: 'center' });
                currentX += colWidths.numero;
                
                doc.text(asiento.reference || '', currentX, currentY, { width: colWidths.referencia, align: 'left' });
                currentX += colWidths.referencia;
                
                doc.text(asiento.description || '', currentX, currentY, { width: colWidths.descripcion, align: 'left' });
                currentX += colWidths.descripcion;
                
                doc.text(this.formatCurrency(asiento.total_debit), currentX, currentY, { width: colWidths.debito, align: 'right' });
                currentX += colWidths.debito;
                
                doc.text(this.formatCurrency(asiento.total_credit), currentX, currentY, { width: colWidths.credito, align: 'right' });

                totalDebitos += parseFloat(asiento.total_debit || 0);
                totalCreditos += parseFloat(asiento.total_credit || 0);

                currentY += 12;

                // Mostrar detalles si están incluidos
                if (asiento.detalles && asiento.detalles.length > 0) {
                    for (const detalle of asiento.detalles) {
                        if (currentY > 750) {
                            doc.addPage();
                            currentY = 50;
                        }

                        currentX = 60; // Indentación para detalles
                        
                        doc.text(`${detalle.account_code} - ${detalle.account_name}`, currentX, currentY, { width: 200, align: 'left' });
                        currentX += 280;
                        
                        doc.text(this.formatCurrency(detalle.debit_amount), currentX, currentY, { width: colWidths.debito, align: 'right' });
                        currentX += colWidths.debito;
                        
                        doc.text(this.formatCurrency(detalle.credit_amount), currentX, currentY, { width: colWidths.credito, align: 'right' });

                        currentY += 10;
                    }
                    currentY += 5; // Espacio extra después de los detalles
                }
            }

            // Totales
            currentY += 10;
            doc.moveTo(40, currentY).lineTo(555, currentY).stroke();
            currentY += 10;

            doc.fontSize(8).font('Helvetica-Bold');
            currentX = 40 + colWidths.fecha + colWidths.numero + colWidths.referencia + colWidths.descripcion;
            
            doc.text('TOTALES:', 40, currentY, { width: currentX - 40, align: 'right' });
            doc.text(this.formatCurrency(totalDebitos), currentX, currentY, { width: colWidths.debito, align: 'right' });
            currentX += colWidths.debito;
            doc.text(this.formatCurrency(totalCreditos), currentX, currentY, { width: colWidths.credito, align: 'right' });

            doc.end();

            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
            });
        } catch (error) {
            logger.error(`Error al generar PDF del libro diario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar Excel del Libro Diario
     * @param {Array} asientos - Array de asientos contables
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del Excel
     */
    static async generateLibroDiarioExcel(asientos, filters = {}) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Libro Diario');

            // Configurar columnas
            worksheet.columns = [
                { header: 'Fecha', key: 'fecha', width: 12 },
                { header: 'Número', key: 'numero', width: 15 },
                { header: 'Referencia', key: 'referencia', width: 15 },
                { header: 'Descripción', key: 'descripcion', width: 40 },
                { header: 'Tercero', key: 'tercero', width: 30 },
                { header: 'Débito', key: 'debito', width: 15 },
                { header: 'Crédito', key: 'credito', width: 15 },
                { header: 'Estado', key: 'estado', width: 12 }
            ];

            // Título
            worksheet.mergeCells('A1:H1');
            worksheet.getCell('A1').value = 'LIBRO DIARIO';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            // Información de filtros
            let currentRow = 2;
            if (filters.fecha_inicio || filters.fecha_fin) {
                worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                worksheet.getCell(`A${currentRow}`).value = `Período: ${fechaInicio} - ${fechaFin}`;
                worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
                currentRow++;
            }

            // Fecha de generación
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = `Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`;
            worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
            currentRow += 2;

            // Encabezados de datos
            const headerRow = worksheet.getRow(currentRow);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            currentRow++;

            let totalDebitos = 0;
            let totalCreditos = 0;

            // Datos
            for (const asiento of asientos) {
                const row = worksheet.getRow(currentRow);
                
                row.getCell(1).value = moment(asiento.date).format('DD/MM/YYYY');
                row.getCell(2).value = asiento.entry_number || '';
                row.getCell(3).value = asiento.reference || '';
                row.getCell(4).value = asiento.description || '';
                row.getCell(5).value = asiento.third_party_name || '';
                row.getCell(6).value = parseFloat(asiento.total_debit || 0);
                row.getCell(7).value = parseFloat(asiento.total_credit || 0);
                row.getCell(8).value = this.translateStatus(asiento.status);

                // Formatear números
                row.getCell(6).numFmt = '#,##0.00';
                row.getCell(7).numFmt = '#,##0.00';

                totalDebitos += parseFloat(asiento.total_debit || 0);
                totalCreditos += parseFloat(asiento.total_credit || 0);

                currentRow++;

                // Agregar detalles si están incluidos
                if (asiento.detalles && asiento.detalles.length > 0) {
                    for (const detalle of asiento.detalles) {
                        const detalleRow = worksheet.getRow(currentRow);
                        
                        detalleRow.getCell(4).value = `    ${detalle.account_code} - ${detalle.account_name}`;
                        detalleRow.getCell(5).value = detalle.third_party_name || '';
                        detalleRow.getCell(6).value = parseFloat(detalle.debit_amount || 0);
                        detalleRow.getCell(7).value = parseFloat(detalle.credit_amount || 0);

                        detalleRow.getCell(6).numFmt = '#,##0.00';
                        detalleRow.getCell(7).numFmt = '#,##0.00';

                        currentRow++;
                    }
                }
            }

            // Totales
            currentRow++;
            const totalRow = worksheet.getRow(currentRow);
            totalRow.getCell(5).value = 'TOTALES:';
            totalRow.getCell(6).value = totalDebitos;
            totalRow.getCell(7).value = totalCreditos;

            totalRow.getCell(5).font = { bold: true };
            totalRow.getCell(6).font = { bold: true };
            totalRow.getCell(7).font = { bold: true };
            totalRow.getCell(6).numFmt = '#,##0.00';
            totalRow.getCell(7).numFmt = '#,##0.00';

            // Aplicar bordes
            const range = `A${currentRow - asientos.length}:H${currentRow}`;
            worksheet.getCell(range).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            return await workbook.xlsx.writeBuffer();
        } catch (error) {
            logger.error(`Error al generar Excel del libro diario: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar PDF del Libro Mayor
     * @param {Object} libroMayor - Datos del libro mayor
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del PDF
     */
    static async generateLibroMayorPDF(libroMayor, filters = {}) {
        try {
            const doc = new PDFKit({ margin: 40, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {});

            // Título
            doc.fontSize(16).font('Helvetica-Bold').text('LIBRO MAYOR', { align: 'center' });
            doc.moveDown(0.5);

            // Información de la cuenta
            doc.fontSize(12).text(`Cuenta: ${libroMayor.account.code} - ${libroMayor.account.name}`, { align: 'center' });
            doc.moveDown(0.5);

            // Información de filtros
            if (filters.fecha_inicio || filters.fecha_fin) {
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                doc.fontSize(10).text(`Período: ${fechaInicio} - ${fechaFin}`, { align: 'center' });
            }

            doc.fontSize(8).text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
            doc.moveDown(1);

            // Saldo inicial
            if (libroMayor.saldo_inicial !== 0) {
                doc.fontSize(10).font('Helvetica-Bold').text(`Saldo inicial: ${this.formatCurrency(libroMayor.saldo_inicial)}`, { align: 'left' });
                doc.moveDown(0.5);
            }

            // Encabezados de tabla
            const tableTop = doc.y;
            const colWidths = {
                fecha: 70,
                asiento: 60,
                referencia: 80,
                descripcion: 180,
                debito: 70,
                credito: 70,
                saldo: 70
            };

            let currentX = 40;
            doc.fontSize(8).font('Helvetica-Bold');
            
            doc.text('FECHA', currentX, tableTop, { width: colWidths.fecha, align: 'center' });
            currentX += colWidths.fecha;
            
            doc.text('ASIENTO', currentX, tableTop, { width: colWidths.asiento, align: 'center' });
            currentX += colWidths.asiento;
            
            doc.text('REFERENCIA', currentX, tableTop, { width: colWidths.referencia, align: 'center' });
            currentX += colWidths.referencia;
            
            doc.text('DESCRIPCIÓN', currentX, tableTop, { width: colWidths.descripcion, align: 'center' });
            currentX += colWidths.descripcion;
            
            doc.text('DÉBITO', currentX, tableTop, { width: colWidths.debito, align: 'center' });
            currentX += colWidths.debito;
            
            doc.text('CRÉDITO', currentX, tableTop, { width: colWidths.credito, align: 'center' });
            currentX += colWidths.credito;
            
            doc.text('SALDO', currentX, tableTop, { width: colWidths.saldo, align: 'center' });

            // Línea separadora
            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            doc.font('Helvetica').fontSize(7);

            for (const movimiento of libroMayor.movimientos) {
                // Verificar si necesitamos nueva página
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                currentX = 40;
                
                doc.text(moment(movimiento.date).format('DD/MM/YYYY'), currentX, currentY, { width: colWidths.fecha, align: 'center' });
                currentX += colWidths.fecha;
                
                doc.text(movimiento.entry_number || '', currentX, currentY, { width: colWidths.asiento, align: 'center' });
                currentX += colWidths.asiento;
                
                doc.text(movimiento.reference || '', currentX, currentY, { width: colWidths.referencia, align: 'left' });
                currentX += colWidths.referencia;
                
                doc.text(movimiento.description || '', currentX, currentY, { width: colWidths.descripcion, align: 'left' });
                currentX += colWidths.descripcion;
                
                doc.text(this.formatCurrency(movimiento.debit_amount), currentX, currentY, { width: colWidths.debito, align: 'right' });
                currentX += colWidths.debito;
                
                doc.text(this.formatCurrency(movimiento.credit_amount), currentX, currentY, { width: colWidths.credito, align: 'right' });
                currentX += colWidths.credito;
                
                doc.text(this.formatCurrency(movimiento.saldo_acumulado), currentX, currentY, { width: colWidths.saldo, align: 'right' });

                currentY += 12;
            }

            // Totales y saldo final
            currentY += 10;
            doc.moveTo(40, currentY).lineTo(555, currentY).stroke();
            currentY += 10;

            doc.fontSize(8).font('Helvetica-Bold');
            
            // Resumen
            doc.text(`Total Débitos: ${this.formatCurrency(libroMayor.total_debitos)}`, 40, currentY);
            currentY += 12;
            doc.text(`Total Créditos: ${this.formatCurrency(libroMayor.total_creditos)}`, 40, currentY);
            currentY += 12;
            doc.text(`Saldo Final: ${this.formatCurrency(libroMayor.saldo_final)}`, 40, currentY);

            doc.end();

            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
            });
        } catch (error) {
            logger.error(`Error al generar PDF del libro mayor: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar Excel del Libro Mayor
     * @param {Object} libroMayor - Datos del libro mayor
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del Excel
     */
    static async generateLibroMayorExcel(libroMayor, filters = {}) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Libro Mayor');

            // Configurar columnas
            worksheet.columns = [
                { header: 'Fecha', key: 'fecha', width: 12 },
                { header: 'Asiento', key: 'asiento', width: 15 },
                { header: 'Referencia', key: 'referencia', width: 15 },
                { header: 'Descripción', key: 'descripcion', width: 40 },
                { header: 'Tercero', key: 'tercero', width: 30 },
                { header: 'Débito', key: 'debito', width: 15 },
                { header: 'Crédito', key: 'credito', width: 15 },
                { header: 'Saldo', key: 'saldo', width: 15 }
            ];

            // Título
            worksheet.mergeCells('A1:H1');
            worksheet.getCell('A1').value = 'LIBRO MAYOR';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            // Información de la cuenta
            worksheet.mergeCells('A2:H2');
            worksheet.getCell('A2').value = `Cuenta: ${libroMayor.account.code} - ${libroMayor.account.name}`;
            worksheet.getCell('A2').font = { bold: true, size: 12 };
            worksheet.getCell('A2').alignment = { horizontal: 'center' };

            let currentRow = 3;

            // Información de filtros
            if (filters.fecha_inicio || filters.fecha_fin) {
                worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                worksheet.getCell(`A${currentRow}`).value = `Período: ${fechaInicio} - ${fechaFin}`;
                worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
                currentRow++;
            }

            // Saldo inicial
            if (libroMayor.saldo_inicial !== 0) {
                worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
                worksheet.getCell(`A${currentRow}`).value = `Saldo inicial: ${this.formatCurrency(libroMayor.saldo_inicial)}`;
                worksheet.getCell(`A${currentRow}`).font = { bold: true };
                currentRow++;
            }

            currentRow += 1;

            // Encabezados de datos
            const headerRow = worksheet.getRow(currentRow);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            currentRow++;

            // Datos
            for (const movimiento of libroMayor.movimientos) {
                const row = worksheet.getRow(currentRow);
                
                row.getCell(1).value = moment(movimiento.date).format('DD/MM/YYYY');
                row.getCell(2).value = movimiento.entry_number || '';
                row.getCell(3).value = movimiento.reference || '';
                row.getCell(4).value = movimiento.description || '';
                row.getCell(5).value = movimiento.third_party_name || '';
                row.getCell(6).value = parseFloat(movimiento.debit_amount || 0);
                row.getCell(7).value = parseFloat(movimiento.credit_amount || 0);
                row.getCell(8).value = parseFloat(movimiento.saldo_acumulado || 0);

                // Formatear números
                row.getCell(6).numFmt = '#,##0.00';
                row.getCell(7).numFmt = '#,##0.00';
                row.getCell(8).numFmt = '#,##0.00';

                currentRow++;
            }

            // Resumen
            currentRow += 1;
            worksheet.getRow(currentRow).getCell(1).value = 'RESUMEN:';
            worksheet.getRow(currentRow).getCell(1).font = { bold: true };
            currentRow++;

            worksheet.getRow(currentRow).getCell(1).value = 'Total Débitos:';
            worksheet.getRow(currentRow).getCell(2).value = libroMayor.total_debitos;
            worksheet.getRow(currentRow).getCell(2).numFmt = '#,##0.00';
            currentRow++;

            worksheet.getRow(currentRow).getCell(1).value = 'Total Créditos:';
            worksheet.getRow(currentRow).getCell(2).value = libroMayor.total_creditos;
            worksheet.getRow(currentRow).getCell(2).numFmt = '#,##0.00';
            currentRow++;

            worksheet.getRow(currentRow).getCell(1).value = 'Saldo Final:';
            worksheet.getRow(currentRow).getCell(2).value = libroMayor.saldo_final;
            worksheet.getRow(currentRow).getCell(2).numFmt = '#,##0.00';
            worksheet.getRow(currentRow).getCell(2).font = { bold: true };

            return await workbook.xlsx.writeBuffer();
        } catch (error) {
            logger.error(`Error al generar Excel del libro mayor: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar PDF del Balance de Comprobación
     * @param {Object} balance - Datos del balance de comprobación
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del PDF
     */
    static async generateBalanceComprobacionPDF(balance, filters = {}) {
        try {
            const doc = new PDFKit({ margin: 40, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {});

            // Título
            doc.fontSize(16).font('Helvetica-Bold').text('BALANCE DE COMPROBACIÓN', { align: 'center' });
            doc.moveDown(0.5);

            // Información de filtros
            if (filters.fecha_inicio || filters.fecha_fin) {
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                doc.fontSize(10).text(`Período: ${fechaInicio} - ${fechaFin}`, { align: 'center' });
            }

            doc.fontSize(8).text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
            doc.moveDown(1);

            // Encabezados de tabla
            const tableTop = doc.y;
            const colWidths = {
                codigo: 60,
                cuenta: 200,
                debito: 70,
                credito: 70,
                saldoDeudor: 70,
                saldoAcreedor: 70
            };

            let currentX = 40;
            doc.fontSize(8).font('Helvetica-Bold');
            
            doc.text('CÓDIGO', currentX, tableTop, { width: colWidths.codigo, align: 'center' });
            currentX += colWidths.codigo;
            
            doc.text('CUENTA', currentX, tableTop, { width: colWidths.cuenta, align: 'center' });
            currentX += colWidths.cuenta;
            
            doc.text('DÉBITO', currentX, tableTop, { width: colWidths.debito, align: 'center' });
            currentX += colWidths.debito;
            
            doc.text('CRÉDITO', currentX, tableTop, { width: colWidths.credito, align: 'center' });
            currentX += colWidths.credito;
            
            doc.text('SALDO DEUDOR', currentX, tableTop, { width: colWidths.saldoDeudor, align: 'center' });
            currentX += colWidths.saldoDeudor;
            
            doc.text('SALDO ACREEDOR', currentX, tableTop, { width: colWidths.saldoAcreedor, align: 'center' });

            // Línea separadora
            doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            doc.font('Helvetica').fontSize(7);

            for (const cuenta of balance.cuentas) {
                // Verificar si necesitamos nueva página
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                currentX = 40;
                
                doc.text(cuenta.code, currentX, currentY, { width: colWidths.codigo, align: 'left' });
                currentX += colWidths.codigo;
                
                doc.text(cuenta.name, currentX, currentY, { width: colWidths.cuenta, align: 'left' });
                currentX += colWidths.cuenta;
                
                doc.text(this.formatCurrency(cuenta.total_debit), currentX, currentY, { width: colWidths.debito, align: 'right' });
                currentX += colWidths.debito;
                
                doc.text(this.formatCurrency(cuenta.total_credit), currentX, currentY, { width: colWidths.credito, align: 'right' });
                currentX += colWidths.credito;
                
                doc.text(this.formatCurrency(cuenta.saldo_deudor), currentX, currentY, { width: colWidths.saldoDeudor, align: 'right' });
                currentX += colWidths.saldoDeudor;
                
                doc.text(this.formatCurrency(cuenta.saldo_acreedor), currentX, currentY, { width: colWidths.saldoAcreedor, align: 'right' });

                currentY += 12;
            }

            // Totales
            currentY += 10;
            doc.moveTo(40, currentY).lineTo(555, currentY).stroke();
            currentY += 10;

            doc.fontSize(8).font('Helvetica-Bold');
            currentX = 40 + colWidths.codigo + colWidths.cuenta;
            
            doc.text('TOTALES:', 40, currentY, { width: currentX - 40, align: 'right' });
            doc.text(this.formatCurrency(balance.totales.total_debitos), currentX, currentY, { width: colWidths.debito, align: 'right' });
            currentX += colWidths.debito;
            doc.text(this.formatCurrency(balance.totales.total_creditos), currentX, currentY, { width: colWidths.credito, align: 'right' });
            currentX += colWidths.credito;
            doc.text(this.formatCurrency(balance.totales.total_saldos_deudores), currentX, currentY, { width: colWidths.saldoDeudor, align: 'right' });
            currentX += colWidths.saldoDeudor;
            doc.text(this.formatCurrency(balance.totales.total_saldos_acreedores), currentX, currentY, { width: colWidths.saldoAcreedor, align: 'right' });

            // Estado del balance
            currentY += 20;
            doc.fontSize(10).font('Helvetica-Bold');
            
            if (balance.balance.balance_correcto) {
                doc.fillColor('green').text('✓ BALANCE CORRECTO', 40, currentY);
            } else {
                doc.fillColor('red').text('✗ BALANCE DESCUADRADO', 40, currentY);
                currentY += 15;
                doc.fontSize(8).fillColor('black');
                doc.text(`Diferencia en débitos/créditos: ${this.formatCurrency(balance.totales.diferencia_debitos_creditos)}`, 40, currentY);
                currentY += 10;
                doc.text(`Diferencia en saldos: ${this.formatCurrency(balance.totales.diferencia_saldos)}`, 40, currentY);
            }

            doc.end();

            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
            });
        } catch (error) {
            logger.error(`Error al generar PDF del balance de comprobación: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generar Excel del Balance de Comprobación
     * @param {Object} balance - Datos del balance de comprobación
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Buffer>} Buffer del Excel
     */
    static async generateBalanceComprobacionExcel(balance, filters = {}) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Balance de Comprobación');

            // Configurar columnas
            worksheet.columns = [
                { header: 'Código', key: 'codigo', width: 12 },
                { header: 'Cuenta', key: 'cuenta', width: 40 },
                { header: 'Débito', key: 'debito', width: 15 },
                { header: 'Crédito', key: 'credito', width: 15 },
                { header: 'Saldo Deudor', key: 'saldo_deudor', width: 15 },
                { header: 'Saldo Acreedor', key: 'saldo_acreedor', width: 15 }
            ];

            // Título
            worksheet.mergeCells('A1:F1');
            worksheet.getCell('A1').value = 'BALANCE DE COMPROBACIÓN';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            let currentRow = 2;

            // Información de filtros
            if (filters.fecha_inicio || filters.fecha_fin) {
                worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
                const fechaInicio = filters.fecha_inicio ? moment(filters.fecha_inicio).format('DD/MM/YYYY') : 'N/A';
                const fechaFin = filters.fecha_fin ? moment(filters.fecha_fin).format('DD/MM/YYYY') : 'N/A';
                worksheet.getCell(`A${currentRow}`).value = `Período: ${fechaInicio} - ${fechaFin}`;
                worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
                currentRow++;
            }

            // Fecha de generación
            worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = `Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`;
            worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
            currentRow += 2;

            // Encabezados de datos
            const headerRow = worksheet.getRow(currentRow);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            currentRow++;

            // Datos
            for (const cuenta of balance.cuentas) {
                const row = worksheet.getRow(currentRow);
                
                row.getCell(1).value = cuenta.code;
                row.getCell(2).value = cuenta.name;
                row.getCell(3).value = parseFloat(cuenta.total_debit || 0);
                row.getCell(4).value = parseFloat(cuenta.total_credit || 0);
                row.getCell(5).value = parseFloat(cuenta.saldo_deudor || 0);
                row.getCell(6).value = parseFloat(cuenta.saldo_acreedor || 0);

                // Formatear números
                for (let col = 3; col <= 6; col++) {
                    row.getCell(col).numFmt = '#,##0.00';
                }

                currentRow++;
            }

            // Totales
            const totalRow = worksheet.getRow(currentRow);
            totalRow.getCell(2).value = 'TOTALES:';
            totalRow.getCell(3).value = balance.totales.total_debitos;
            totalRow.getCell(4).value = balance.totales.total_creditos;
            totalRow.getCell(5).value = balance.totales.total_saldos_deudores;
            totalRow.getCell(6).value = balance.totales.total_saldos_acreedores;

            totalRow.font = { bold: true };
            for (let col = 3; col <= 6; col++) {
                totalRow.getCell(col).numFmt = '#,##0.00';
            }

            // Estado del balance
            currentRow += 2;
            const statusRow = worksheet.getRow(currentRow);
            if (balance.balance.balance_correcto) {
                statusRow.getCell(1).value = '✓ BALANCE CORRECTO';
                statusRow.getCell(1).font = { bold: true, color: { argb: 'FF008000' } };
            } else {
                statusRow.getCell(1).value = '✗ BALANCE DESCUADRADO';
                statusRow.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };
                
                currentRow++;
                worksheet.getRow(currentRow).getCell(1).value = `Diferencia en débitos/créditos: ${this.formatCurrency(balance.totales.diferencia_debitos_creditos)}`;
                currentRow++;
                worksheet.getRow(currentRow).getCell(1).value = `Diferencia en saldos: ${this.formatCurrency(balance.totales.diferencia_saldos)}`;
            }

            return await workbook.xlsx.writeBuffer();
        } catch (error) {
            logger.error(`Error al generar Excel del balance de comprobación: ${error.message}`);
            throw error;
        }
    }

    /**
     * Formatear número como moneda
     * @param {Number} amount - Cantidad a formatear
     * @returns {String} Cantidad formateada
     */
    static formatCurrency(amount) {
        const num = parseFloat(amount || 0);
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    /**
     * Traducir estado del asiento
     * @param {String} status - Estado en inglés
     * @returns {String} Estado en español
     */
    static translateStatus(status) {
        const statusMap = {
            'draft': 'Borrador',
            'posted': 'Registrado',
            'reversed': 'Reversado'
        };
        return statusMap[status] || status;
    }
}

module.exports = ExportService;