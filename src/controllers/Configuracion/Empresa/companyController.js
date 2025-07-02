/**
 * Controlador para gestionar las empresas
 * @module controllers/Configuracion/Empresa/companyController
 */

const Company = require('../../../models/Configuracion/Empresa/companyModel');
const PDFService = require('../../../services/pdfService');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Clase de controlador para gestionar empresas
 */
class CompanyController {
  /**
   * Obtener todas las empresas con filtros opcionales
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const filters = req.query;
      const companies = await Company.getAll(filters);
      
      res.status(200).json({
        success: true,
        data: companies,
        count: companies.length,
        message: 'Empresas obtenidas correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener empresas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener empresas',
        error: error.message
      });
    }
  }

  /**
   * Obtener una empresa por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const company = await Company.getById(id);
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }
      
      res.status(200).json({
        success: true,
        data: company,
        message: 'Empresa obtenida correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener empresa ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener empresa',
        error: error.message
      });
    }
  }

  /**
   * Crear una nueva empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const companyData = req.body;
      
      // Validar datos requeridos
      if (!companyData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la empresa es requerido'
        });
      }
      
      if (!companyData.legal_name) {
        return res.status(400).json({
          success: false,
          message: 'La razón social de la empresa es requerida'
        });
      }
      
      if (!companyData.tax_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID fiscal de la empresa es requerido'
        });
      }
      
      if (!companyData.identification_type) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de identificación es requerido'
        });
      }
      
      if (!companyData.identification_number) {
        return res.status(400).json({
          success: false,
          message: 'El número de identificación es requerido'
        });
      }
      
      if (!companyData.verification_digit) {
        return res.status(400).json({
          success: false,
          message: 'El dígito de verificación es requerido'
        });
      }
      
      if (!companyData.fiscal_year_start) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio del año fiscal es requerida'
        });
      }
      
      if (!companyData.currency_id) {
        return res.status(400).json({
          success: false,
          message: 'La moneda predeterminada es requerida'
        });
      }

      // Procesar archivo de logo si se subió
      if (req.file) {
        const relativePath = path.join('uploads', 'companies', 'logos', req.file.filename).replace(/\\/g, '/');
        companyData.logo_path = relativePath;
      }
      
      const newCompany = await Company.create(companyData);
      
      res.status(201).json({
        success: true,
        data: newCompany,
        message: 'Empresa creada correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear empresa: ${error.message}`);
      
      // Si hay error y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error(`Error al eliminar archivo tras fallo: ${unlinkError.message}`);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear empresa',
        error: error.message
      });
    }
  }

  /**
   * Actualizar una empresa existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const companyData = req.body;
      
      // Validar que la empresa exista
      const existingCompany = await Company.getById(id);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }
      
      // Verificar datos requeridos
      if (!companyData.name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la empresa es requerido'
        });
      }
      
      if (!companyData.legal_name) {
        return res.status(400).json({
          success: false,
          message: 'La razón social de la empresa es requerida'
        });
      }
      
      if (!companyData.tax_id) {
        return res.status(400).json({
          success: false,
          message: 'El ID fiscal de la empresa es requerido'
        });
      }

      // Procesar archivo de logo si se subió
      if (req.file) {
        // Eliminar logo anterior si existe
        if (existingCompany.logo_path) {
          const oldLogoPath = path.join(process.cwd(), existingCompany.logo_path);
          try {
            await fs.unlink(oldLogoPath);
          } catch (unlinkError) {
            logger.warn(`No se pudo eliminar el logo anterior: ${unlinkError.message}`);
          }
        }
        
        const relativePath = path.join('uploads', 'companies', 'logos', req.file.filename).replace(/\\/g, '/');
        companyData.logo_path = relativePath;
      }
      
      // Actualizar la empresa
      const updatedCompany = await Company.update(id, companyData);
      
      res.status(200).json({
        success: true,
        data: updatedCompany,
        message: 'Empresa actualizada correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar empresa ${req.params.id}: ${error.message}`);
      
      // Si hay error y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error(`Error al eliminar archivo tras fallo: ${unlinkError.message}`);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar empresa',
        error: error.message
      });
    }
  }

  /**
   * Subir/actualizar logo de una empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async uploadLogo(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que la empresa exista
      const existingCompany = await Company.getById(id);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }

      // Validar que se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún archivo de logo'
        });
      }

      // Eliminar logo anterior si existe
      if (existingCompany.logo_path) {
        const oldLogoPath = path.join(process.cwd(), existingCompany.logo_path);
        try {
          await fs.unlink(oldLogoPath);
        } catch (unlinkError) {
          logger.warn(`No se pudo eliminar el logo anterior: ${unlinkError.message}`);
        }
      }

      // Actualizar el path del logo
      const relativePath = path.join('uploads', 'companies', 'logos', req.file.filename).replace(/\\/g, '/');
      const updatedCompany = await Company.update(id, { logo_path: relativePath });
      
      res.status(200).json({
        success: true,
        data: {
          id: id,
          logo_path: relativePath,
          logo_url: `/uploads/companies/logos/${req.file.filename}`
        },
        message: 'Logo subido correctamente'
      });
    } catch (error) {
      logger.error(`Error al subir logo para empresa ${req.params.id}: ${error.message}`);
      
      // Si hay error y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error(`Error al eliminar archivo tras fallo: ${unlinkError.message}`);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al subir logo',
        error: error.message
      });
    }
  }

  /**
   * Eliminar logo de una empresa
   * @param {Request} req - Objeto de solicitud Express  
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async deleteLogo(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que la empresa exista
      const existingCompany = await Company.getById(id);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }

      // Validar que tenga logo
      if (!existingCompany.logo_path) {
        return res.status(400).json({
          success: false,
          message: 'La empresa no tiene logo para eliminar'
        });
      }

      // Eliminar archivo físico
      const logoPath = path.join(process.cwd(), existingCompany.logo_path);
      try {
        await fs.unlink(logoPath);
      } catch (unlinkError) {
        logger.warn(`No se pudo eliminar el archivo de logo: ${unlinkError.message}`);
      }

      // Actualizar la empresa removiendo el logo_path
      await Company.update(id, { logo_path: null });
      
      res.status(200).json({
        success: true,
        message: 'Logo eliminado correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar logo de empresa ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar logo',
        error: error.message
      });
    }
  }

  /**
   * Obtener logo de una empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getLogo(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que la empresa exista
      const existingCompany = await Company.getById(id);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }

      // Validar que tenga logo
      if (!existingCompany.logo_path) {
        return res.status(404).json({
          success: false,
          message: 'La empresa no tiene logo'
        });
      }

      // Verificar que el archivo existe
      const logoPath = path.join(process.cwd(), existingCompany.logo_path);
      try {
        await fs.access(logoPath);
      } catch (accessError) {
        return res.status(404).json({
          success: false,
          message: 'El archivo de logo no existe'
        });
      }

      // Servir el archivo
      res.sendFile(logoPath);
    } catch (error) {
      logger.error(`Error al obtener logo de empresa ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logo',
        error: error.message
      });
    }
  }

  /**
   * Eliminar una empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que la empresa exista
      const existingCompany = await Company.getById(id);
      if (!existingCompany) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }

      // Eliminar logo si existe
      if (existingCompany.logo_path) {
        const logoPath = path.join(process.cwd(), existingCompany.logo_path);
        try {
          await fs.unlink(logoPath);
        } catch (unlinkError) {
          logger.warn(`No se pudo eliminar el logo al eliminar empresa: ${unlinkError.message}`);
        }
      }
      
      // Eliminar la empresa
      const result = await Company.delete(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Empresa eliminada correctamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar empresa ${req.params.id}: ${error.message}`);
      
      // Si hay registros relacionados, enviar error 400
      if (error.message.includes('tiene registros relacionados')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar empresa',
        error: error.message
      });
    }
  }

  /**
   * Generar PDF con información de una empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generatePDF(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener datos de la empresa
      const company = await Company.getById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }
      
      // Generar PDF
      const pdfBuffer = await PDFService.generateCompanyProfilePDF(company);
      
      // Configurar headers para descarga
      const filename = `empresa_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar PDF
      res.send(pdfBuffer);
      
      logger.info(`PDF generado exitosamente para empresa ${id}: ${company.name}`);
    } catch (error) {
      logger.error(`Error al generar PDF de empresa ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar PDF',
        error: error.message
      });
    }
  }

  /**
   * Generar PDF con vista previa (para mostrar en navegador)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async previewPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener datos de la empresa
      const company = await Company.getById(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Empresa con ID ${id} no encontrada`
        });
      }
      
      // Generar PDF
      const pdfBuffer = await PDFService.generateCompanyProfilePDF(company);
      
      // Configurar headers para vista en navegador
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar PDF
      res.send(pdfBuffer);
      
      logger.info(`PDF preview generado exitosamente para empresa ${id}: ${company.name}`);
    } catch (error) {
      logger.error(`Error al generar preview PDF de empresa ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar preview PDF',
        error: error.message
      });
    }
  }

  /**
   * Generar PDF con listado de todas las empresas
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async generateListPDF(req, res) {
    try {
      // Obtener filtros de query parameters
      const filters = req.query;
      
      // Obtener empresas
      const companies = await Company.getAll(filters);
      
      if (!companies || companies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron empresas para generar el PDF'
        });
      }
      
      // Generar PDF
      const pdfBuffer = await PDFService.generateCompanyListPDF(companies);
      
      // Configurar headers para descarga
      const filename = `listado_empresas_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Enviar PDF
      res.send(pdfBuffer);
      
      logger.info(`PDF de listado de empresas generado exitosamente: ${companies.length} empresas`);
    } catch (error) {
      logger.error(`Error al generar PDF de listado de empresas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al generar PDF de listado',
        error: error.message
      });
    }
  }
}

module.exports = CompanyController; 