/**
 * Servicio para generar PDFs de comprobantes contables
 * @module services/reports/voucherPdfService
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Company = require('../../models/Configuracion/Empresa/companyModel');
const Voucher = require('../../models/Contabilidad/General/Comprobantes_Contables/voucherModel');
const logger = require('../../utils/logger');

/**
 * Clase para generar PDFs de comprobantes contables
 */
class VoucherPdfService {
  /**
   * Generar PDF de un comprobante contable
   * @param {number} voucherId - ID del comprobante
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  static async generateVoucherPDF(voucherId) {
    try {
      // Obtener datos del comprobante
      const voucher = await Voucher.getById(voucherId);
      if (!voucher) {
        throw new Error(`Comprobante con ID ${voucherId} no encontrado`);
      }

      // Obtener datos de la empresa
      const company = await Company.getById(voucher.company_id);
      if (!company) {
        throw new Error(`Empresa con ID ${voucher.company_id} no encontrada`);
      }

      // Obtener líneas del comprobante
      const voucherLines = await Voucher.getVoucherLines(voucherId);

      // Crear documento PDF más compacto
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margin: 30, // Márgenes más pequeños
        info: {
          Title: `Comprobante ${voucher.voucher_number}`,
          Author: company.name,
          Subject: 'Comprobante Contable',
          Keywords: 'contabilidad, comprobante, contable'
        }
      });

      // Configurar fuentes
      doc.font('Helvetica');

      // Header - Logo y datos de la empresa
      await this._addHeader(doc, company);

      // Título del documento
      this._addTitle(doc, 'COMPROBANTE CONTABLE');

      // Información del comprobante
      this._addVoucherInfo(doc, voucher);

      // Líneas del comprobante
      if (voucherLines && voucherLines.length > 0) {
        this._addVoucherLines(doc, voucherLines, voucher);
      }

      // Footer
      this._addFooter(doc, voucher);

      // Finalizar el documento
      doc.end();

      // Convertir a buffer y finalizar
      return new Promise((resolve, reject) => {
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

    } catch (error) {
      logger.error(`Error al generar PDF del comprobante ${voucherId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agregar header con logo y datos de la empresa
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} company - Datos de la empresa
   */
  static async _addHeader(doc, company) {
    const startY = 30;
    let currentY = startY;
    
    // Logo de la empresa más ancho
    if (company.logo_path && fs.existsSync(company.logo_path)) {
      try {
        doc.image(company.logo_path, 30, startY, { width: 120, height: 50 });
      } catch (error) {
        logger.warn(`No se pudo cargar el logo: ${error.message}`);
      }
    }

    // Información de la empresa más compacta
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(company.name || '', 160, startY, { width: 410 });
    
    currentY = startY + 12;
    doc.fontSize(8)
       .font('Helvetica')
       .text(company.legal_name || '', 160, currentY, { width: 410 });
    
    if (company.tax_id) {
      currentY += 10;
      doc.text(`NIT: ${company.tax_id}${company.verification_digit ? '-' + company.verification_digit : ''}`, 160, currentY);
    }
    
    if (company.address) {
      currentY += 10;
      doc.text(`Dirección: ${company.address}`, 160, currentY, { width: 410 });
    }
    
    if (company.phone) {
      currentY += 10;
      doc.text(`Teléfono: ${company.phone}`, 160, currentY);
    }

    // Línea separadora (asegurar que esté debajo del logo)
    currentY = Math.max(currentY + 12, startY + 60); // Al menos debajo del logo de 50px + margen
    doc.moveTo(30, currentY)
       .lineTo(570, currentY)
       .stroke();

    // Mover cursor hacia abajo
    doc.y = currentY + 8;
  }

  /**
   * Agregar título del documento
   * @param {PDFDocument} doc - Documento PDF
   * @param {string} title - Título del documento
   */
  static _addTitle(doc, title) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(title, 30, doc.y, { align: 'center', width: 540 });
    
    doc.y += 15;
  }

  /**
   * Agregar información del comprobante
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} voucher - Datos del comprobante
   */
  static _addVoucherInfo(doc, voucher) {
    const startY = doc.y;
    const leftColumn = 30;
    const rightColumn = 320;
    let currentY = startY;

    // Columna izquierda
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL COMPROBANTE', leftColumn, currentY);

    currentY += 12;
    doc.fontSize(7)
       .font('Helvetica');
       
    doc.text(`Tipo: ${voucher.type_name || '-'}`, leftColumn, currentY);
    currentY += 10;
    doc.text(`Número: ${voucher.voucher_number || '-'}`, leftColumn, currentY);
    currentY += 10;
    doc.text(`Fecha: ${voucher.date ? new Date(voucher.date).toLocaleDateString('es-CO') : '-'}`, leftColumn, currentY);
    currentY += 10;
    doc.text(`Estado: ${voucher.status || '-'}`, leftColumn, currentY);
    currentY += 10;
    doc.text(`Oficina: ${voucher.office_name || '-'}`, leftColumn, currentY);

    // Columna derecha
    let rightY = startY;
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .text('DETALLES ADICIONALES', rightColumn, rightY);

    rightY += 12;
    doc.fontSize(7)
       .font('Helvetica');
       
    doc.text(`Tercero: ${voucher.third_party_name || '-'}`, rightColumn, rightY, { width: 250 });
    rightY += 10;
    doc.text(`Referencia: ${voucher.reference || '-'}`, rightColumn, rightY, { width: 250 });
    rightY += 10;
    doc.text(`Total: $${this._formatCurrency(voucher.total_amount)}`, rightColumn, rightY);
    rightY += 10;
    doc.text(`Creado por: ${voucher.created_by_name || '-'}`, rightColumn, rightY, { width: 250 });
    rightY += 10;
    doc.text(`Fecha creación: ${voucher.created_at ? new Date(voucher.created_at).toLocaleDateString('es-CO') : '-'}`, rightColumn, rightY, { width: 250 });

    // Actualizar posición Y al máximo de las dos columnas
    currentY = Math.max(currentY, rightY) + 15;

    doc.y = currentY;
  }

  /**
   * Agregar líneas del comprobante
   * @param {PDFDocument} doc - Documento PDF
   * @param {Array} lines - Líneas del comprobante
   * @param {Object} voucher - Datos del comprobante
   */
  static _addVoucherLines(doc, lines, voucher) {
    // Verificar si hay espacio para el título + al menos una línea
    if (doc.y + 40 > doc.page.height - 100) {
      doc.addPage();
      doc.y = 30;
    }
    
    doc.y += 10;
    
    // Descripción antes del detalle contable
    if (voucher && voucher.description) {
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('DESCRIPCIÓN:', 30, doc.y);
      
      doc.y += 10;
      doc.fontSize(7)
         .font('Helvetica')
         .text(voucher.description, 30, doc.y, { width: 540 });
      
      // Calcular altura del texto de descripción
      const descHeight = doc.heightOfString(voucher.description, { width: 540 });
      doc.y += Math.max(descHeight + 8, 15);
    }
    
    // Título de la tabla más pequeño
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('DETALLE CONTABLE', 30, doc.y);
    
    doc.y += 12;

    // Headers de la tabla más compactos (sin columna descripción)
    const tableTop = doc.y;
    const headers = [
      { text: 'Línea', x: 30, width: 35 },
      { text: 'Cuenta', x: 65, width: 200 },
      { text: 'Tercero', x: 265, width: 180 },
      { text: 'Débito', x: 445, width: 60 },
      { text: 'Crédito', x: 505, width: 60 }
    ];

    // Dibujar headers
    doc.fontSize(7)
       .font('Helvetica-Bold');
    
    headers.forEach(header => {
      doc.text(header.text, header.x, tableTop, { width: header.width, align: 'center' });
    });

    // Línea bajo headers
    doc.moveTo(30, tableTop + 10)
       .lineTo(565, tableTop + 10)
       .stroke();

    // Datos de las líneas
    doc.font('Helvetica');
    let currentY = tableTop + 15;
    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach((line, index) => {
      // Verificar si necesitamos nueva página (más compacto)
      const requiredSpace = 12 + 30 + 60; // línea actual + totales + footer
      if (currentY + requiredSpace > doc.page.height - 30) {
        doc.addPage();
        currentY = 30;
        
        // Repetir headers en nueva página
        doc.fontSize(7)
           .font('Helvetica-Bold');
        
        headers.forEach(header => {
          doc.text(header.text, header.x, currentY, { width: header.width, align: 'center' });
        });

        // Línea bajo headers
        doc.moveTo(30, currentY + 10)
           .lineTo(565, currentY + 10)
           .stroke();
           
        currentY += 15;
        doc.font('Helvetica');
      }

      const debitAmount = parseFloat(line.debit_amount || 0);
      const creditAmount = parseFloat(line.credit_amount || 0);
      
      totalDebit += debitAmount;
      totalCredit += creditAmount;

      // Datos de la línea más compactos (sin descripción)
      const lineStartY = currentY;
      
      doc.fontSize(6)
         .font('Helvetica');
      
      doc.text(line.line_number || (index + 1), 30, lineStartY, { width: 35, align: 'center' });
      doc.text(`${line.account_code || ''} - ${line.account_name || ''}`, 65, lineStartY, { width: 200 });
      
      // Tercero con más espacio
      const thirdPartyText = line.third_party_name || '-';
      doc.text(thirdPartyText, 265, lineStartY, { width: 180 });
      
      doc.text(debitAmount > 0 ? this._formatCurrency(debitAmount) : '', 445, lineStartY, { width: 60, align: 'right' });
      doc.text(creditAmount > 0 ? this._formatCurrency(creditAmount) : '', 505, lineStartY, { width: 60, align: 'right' });

      currentY += 12;
    });

    // Línea antes de totales
    doc.moveTo(445, currentY)
       .lineTo(565, currentY)
       .stroke();

    currentY += 8;

    // Totales más compactos
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .text('TOTALES:', 265, currentY, { width: 180, align: 'right' })
       .text(this._formatCurrency(totalDebit), 445, currentY, { width: 60, align: 'right' })
       .text(this._formatCurrency(totalCredit), 505, currentY, { width: 60, align: 'right' });

    doc.y = currentY + 15;
  }

  /**
   * Agregar footer
   * @param {PDFDocument} doc - Documento PDF
   * @param {Object} voucher - Datos del comprobante
   */
  static _addFooter(doc, voucher) {
    const pageHeight = doc.page.height;
    const requiredFooterSpace = 80; // Espacio reducido para footer
    const currentY = doc.y;
    
    // Solo agregar nueva página si realmente no hay espacio suficiente
    if (currentY + requiredFooterSpace > pageHeight - 30) {
      doc.addPage();
      doc.y = 30;
    }

    // Línea separadora
    doc.moveTo(30, doc.y)
       .lineTo(570, doc.y)
       .stroke();

    doc.y += 15;

    // Firma única centrada más compacta
    const signatureY = doc.y;
    const centerX = 10; // Centro de la página
    
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .text('ELABORADO POR:', centerX, signatureY, { width: 200, align: 'center' });

    // Nombre del usuario
    doc.fontSize(7)
       .font('Helvetica')
       .text(voucher.created_by_name || '', centerX, signatureY + 12, { width: 200, align: 'center' });

    // Línea de firma más pequeña
    doc.fontSize(7)
       .text('____________________', centerX, signatureY + 25, { width: 200, align: 'center' });
    
    // Texto "Nombre y Firma"
    doc.fontSize(6)
       .text('Nombre y Firma', centerX, signatureY + 35, { width: 200, align: 'center' });

    // Información de página en la parte inferior más compacta
    const bottomY = pageHeight - 20;
    doc.fontSize(6);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}`, 30, bottomY);
    
    // Número de página
    doc.text(`Página 1`, 520, bottomY, { width: 50, align: 'right' });
  }

  /**
   * Formatear moneda
   * @param {number} amount - Cantidad a formatear
   * @returns {string} Cantidad formateada
   */
  static _formatCurrency(amount) {
    if (!amount) return '0';
    return parseFloat(amount).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

module.exports = VoucherPdfService; 