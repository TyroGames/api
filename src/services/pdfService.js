/**
 * Servicio para generación de documentos PDF
 * @module services/pdfService
 */

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Clase para gestionar la generación de PDFs
 */
class PDFService {
  /**
   * Generar PDF de información empresarial
   * @param {Object} companyData - Datos de la empresa
   * @param {Object} options - Opciones adicionales para el PDF
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  static async generateCompanyProfilePDF(companyData, options = {}) {
    try {
      // Crear nuevo documento PDF en formato carta (Letter)
      const doc = new PDFDocument({
        size: 'LETTER', // 8.5" x 11"
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `Perfil Empresarial - ${companyData.name}`,
          Author: 'Sistema Contable',
          Subject: 'Información Empresarial',
          Keywords: 'empresa, perfil, información',
          CreationDate: new Date(),
          ModDate: new Date()
        }
      });

      // Buffer para almacenar el PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Promesa para cuando termine la generación
      const pdfPromise = new Promise((resolve) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      });

      // Configurar colores corporativos
      const colors = {
        primary: '#1890ff',
        secondary: '#f0f2f5',
        accent: '#52c41a',
        text: '#262626',
        lightText: '#8c8c8c',
        border: '#d9d9d9'
      };

      // === ENCABEZADO PRINCIPAL ===
      await this.addHeader(doc, companyData, colors);

      // === INFORMACIÓN PRINCIPAL ===
      await this.addMainInfo(doc, companyData, colors);

      // === INFORMACIÓN DE CONTACTO ===
      await this.addContactInfo(doc, companyData, colors);

      // === INFORMACIÓN FISCAL ===
      await this.addFiscalInfo(doc, companyData, colors);

      // === PIE DE PÁGINA ===
      await this.addFooter(doc, colors);

      // Finalizar documento
      doc.end();

      return await pdfPromise;
    } catch (error) {
      logger.error(`Error al generar PDF de empresa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agregar encabezado del documento
   */
  static async addHeader(doc, companyData, colors) {
    const pageWidth = doc.page.width;
    
    // Banda superior decorativa
    doc.rect(0, 0, pageWidth, 40)
       .fill(colors.primary);

    // Logo y nombre de empresa
    let currentY = 60;
    
    // Intentar cargar logo si existe
    if (companyData.logo_path) {
      try {
        const logoPath = path.join(process.cwd(), companyData.logo_path);
        await fs.access(logoPath);
        
        // Agregar logo
        doc.image(logoPath, 50, currentY, {
          width: 80,
          height: 80,
          align: 'left'
        });
        
        // Nombre empresa al lado del logo
        doc.fontSize(24)
           .fillColor(colors.text)
           .font('Helvetica-Bold')
           .text(companyData.name, 150, currentY + 15, {
             width: 350,
             align: 'left'
           });
           
        // Razón social
        doc.fontSize(14)
           .fillColor(colors.lightText)
           .font('Helvetica')
           .text(companyData.legal_name || '', 150, currentY + 45, {
             width: 350,
             align: 'left'
           });
           
        currentY += 100;
      } catch (logoError) {
        // Si no hay logo, usar diseño alternativo
        currentY = this.addHeaderWithoutLogo(doc, companyData, colors, currentY);
      }
    } else {
      currentY = this.addHeaderWithoutLogo(doc, companyData, colors, currentY);
    }

    // Línea separadora
    doc.moveTo(50, currentY)
       .lineTo(pageWidth - 50, currentY)
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    return currentY + 20;
  }

  /**
   * Encabezado sin logo
   */
  static addHeaderWithoutLogo(doc, companyData, colors, startY) {
    // Ícono empresarial decorativo
    doc.circle(100, startY + 40, 30)
       .fill(colors.secondary);
    
    doc.fontSize(20)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('🏢', 85, startY + 30);

    // Nombre empresa
    doc.fontSize(28)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(companyData.name, 150, startY + 15, {
         width: 400,
         align: 'left'
       });

    // Razón social
    doc.fontSize(16)
       .fillColor(colors.lightText)
       .font('Helvetica')
       .text(companyData.legal_name || '', 150, startY + 50, {
         width: 400,
         align: 'left'
       });

    return startY + 90;
  }

  /**
   * Agregar información principal
   */
  static async addMainInfo(doc, companyData, colors) {
    let currentY = 200;

    // Título de sección
    doc.fontSize(18)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN GENERAL', 50, currentY);

    currentY += 35;

    // Crear tabla de información
    const infoItems = [
      { label: 'ID de Empresa:', value: companyData.id?.toString() || 'N/A' },
      { label: 'Tipo de Identificación:', value: companyData.identification_type || 'N/A' },
      { label: 'Número de Identificación:', value: companyData.identification_number || 'N/A' },
      { label: 'Dígito de Verificación:', value: companyData.verification_digit || 'N/A' },
      { label: 'NIT/ID Fiscal:', value: companyData.tax_id || 'N/A' },
      { label: 'Inicio Año Fiscal:', value: companyData.fiscal_year_start ? 
        new Date(companyData.fiscal_year_start).toLocaleDateString('es-ES') : 'N/A' }
    ];

    // Renderizar información en dos columnas
    const leftColumn = infoItems.slice(0, 3);
    const rightColumn = infoItems.slice(3);

    // Columna izquierda
    let tempY = currentY;
    leftColumn.forEach((item, index) => {
      doc.fontSize(11)
         .fillColor(colors.lightText)
         .font('Helvetica-Bold')
         .text(item.label, 50, tempY);
      
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(item.value, 50, tempY + 15);
      
      tempY += 40;
    });

    // Columna derecha
    tempY = currentY;
    rightColumn.forEach((item, index) => {
      doc.fontSize(11)
         .fillColor(colors.lightText)
         .font('Helvetica-Bold')
         .text(item.label, 300, tempY);
      
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(item.value, 300, tempY + 15);
      
      tempY += 40;
    });

    return Math.max(currentY + (leftColumn.length * 40), currentY + (rightColumn.length * 40)) + 20;
  }

  /**
   * Agregar información de contacto
   */
  static async addContactInfo(doc, companyData, colors) {
    let currentY = 380;

    // Título de sección
    doc.fontSize(18)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE CONTACTO', 50, currentY);

    currentY += 35;

    // Fondo decorativo para la sección
    doc.rect(50, currentY - 10, doc.page.width - 100, 120)
       .fill(colors.secondary);

    currentY += 10;

    // Información de contacto
    const contactItems = [
      { icon: '📍', label: 'Dirección:', value: companyData.address || 'No especificada' },
      { icon: '📞', label: 'Teléfono:', value: companyData.phone || 'No especificado' },
      { icon: '✉️', label: 'Email:', value: companyData.email || 'No especificado' },
      { icon: '🌐', label: 'Sitio Web:', value: companyData.website || 'No especificado' }
    ];

    contactItems.forEach((item, index) => {
      const itemY = currentY + (index * 25);
      
      // Ícono
      doc.fontSize(12)
         .fillColor(colors.primary)
         .text(item.icon, 60, itemY);
      
      // Label
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(item.label, 80, itemY);
      
      // Valor
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(item.value, 180, itemY, {
           width: 350,
           align: 'left'
         });
    });

    return currentY + 120;
  }

  /**
   * Agregar información fiscal y financiera
   */
  static async addFiscalInfo(doc, companyData, colors) {
    let currentY = 540;

    // Título de sección
    doc.fontSize(18)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN FISCAL Y FINANCIERA', 50, currentY);

    currentY += 35;

    // Crear caja decorativa
    doc.rect(50, currentY - 5, doc.page.width - 100, 80)
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    // Información fiscal
    const fiscalItems = [
      { 
        label: 'Moneda Predeterminada:', 
        value: companyData.currency_name ? 
          `${companyData.currency_name} (${companyData.currency_symbol || ''})` : 'No especificada'
      },
      {
        label: 'Fecha de Registro:',
        value: companyData.created_at ? 
          new Date(companyData.created_at).toLocaleDateString('es-ES') : 'No disponible'
      },
      {
        label: 'Última Actualización:',
        value: companyData.updated_at ? 
          new Date(companyData.updated_at).toLocaleDateString('es-ES') : 'No disponible'
      }
    ];

    fiscalItems.forEach((item, index) => {
      const itemY = currentY + 10 + (index * 20);
      
      doc.fontSize(11)
         .fillColor(colors.lightText)
         .font('Helvetica-Bold')
         .text(item.label, 60, itemY);
      
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(item.value, 250, itemY);
    });

    return currentY + 90;
  }

  /**
   * Agregar pie de página
   */
  static async addFooter(doc, colors) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    // Línea separadora
    doc.moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    // Información del sistema
    doc.fontSize(10)
       .fillColor(colors.lightText)
       .font('Helvetica')
       .text('Documento generado por Sistema Contable', 50, footerY + 15);

    // Fecha de generación
    const now = new Date();
    doc.fontSize(10)
       .fillColor(colors.lightText)
       .font('Helvetica')
       .text(`Generado el: ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`, 
             doc.page.width - 250, footerY + 15);

    // Número de página
    doc.fontSize(10)
       .fillColor(colors.lightText)
       .font('Helvetica')
       .text('Página 1 de 1', doc.page.width / 2 - 30, footerY + 35);
  }

  /**
   * Generar PDF con lista de empresas
   * @param {Array} companies - Array de empresas
   * @returns {Promise<Buffer>} Buffer del PDF generado
   */
  static async generateCompanyListPDF(companies) {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      const pdfPromise = new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
      });

      // Título
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('LISTADO DE EMPRESAS', 50, 50, { align: 'center' });

      let currentY = 100;

      companies.forEach((company, index) => {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }

        // Información básica de cada empresa
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${company.name}`, 50, currentY);

        currentY += 20;

        doc.fontSize(10)
           .font('Helvetica')
           .text(`NIT: ${company.tax_id || 'N/A'}`, 70, currentY)
           .text(`Email: ${company.email || 'N/A'}`, 300, currentY);

        currentY += 30;
      });

      doc.end();
      return await pdfPromise;
    } catch (error) {
      logger.error(`Error al generar PDF de lista de empresas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PDFService; 