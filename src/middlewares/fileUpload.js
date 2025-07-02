/**
 * Middleware para manejo de archivos con Multer
 * @module middlewares/fileUpload
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Configuración de almacenamiento para logos de empresas
 */
const companyLogoStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'companies', 'logos');
    
    try {
      // Crear directorio si no existe
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generar nombre único: company_logo_{timestamp}_{random}.ext
    const fileExtension = path.extname(file.originalname);
    const fileName = `company_logo_${Date.now()}_${Math.round(Math.random() * 1E9)}${fileExtension}`;
    cb(null, fileName);
  }
});

/**
 * Filtro para validar tipos de archivo de imágenes
 */
const imageFileFilter = (req, file, cb) => {
  // Tipos MIME permitidos para imágenes
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  // Extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Solo se permiten imágenes: ${allowedExtensions.join(', ')}`), false);
  }
};

/**
 * Configuración de multer para logos de empresas
 */
const uploadCompanyLogo = multer({
  storage: companyLogoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB
    files: 1 // Solo un archivo por request
  }
});

/**
 * Configuración de almacenamiento para documentos generales
 */
const documentsStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'documents');
    
    try {
      // Crear directorio si no existe
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generar nombre único: doc_{timestamp}_{random}.ext
    const fileExtension = path.extname(file.originalname);
    const fileName = `doc_${Date.now()}_${Math.round(Math.random() * 1E9)}${fileExtension}`;
    cb(null, fileName);
  }
});

/**
 * Filtro para validar tipos de archivo de documentos
 */
const documentFileFilter = (req, file, cb) => {
  // Tipos MIME permitidos para documentos
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];
  
  // Extensiones permitidas
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`), false);
  }
};

/**
 * Configuración de multer para documentos generales
 */
const uploadDocuments = multer({
  storage: documentsStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Máximo 10MB
    files: 5 // Máximo 5 archivos por request
  }
});

/**
 * Middleware para manejar errores de multer
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande',
          error: 'El tamaño máximo permitido es 5MB para imágenes y 10MB para documentos'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos',
          error: 'Solo se permite un archivo para logos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado',
          error: 'Revise el nombre del campo de archivo'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error al subir archivo',
          error: error.message
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación de archivo',
      error: error.message
    });
  }
  next();
};

/**
 * Configuración de almacenamiento para extractos bancarios
 */
const bankStatementStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'bank-statements');
    
    try {
      // Crear directorio si no existe
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generar nombre único: bank_statement_{accountId}_{date}_{timestamp}.ext
    const fileExtension = path.extname(file.originalname);
    const accountId = req.params.accountId || 'unknown';
    const fileName = `bank_statement_${accountId}_${Date.now()}${fileExtension}`;
    cb(null, fileName);
  }
});

/**
 * Filtro para validar tipos de archivo de extractos bancarios
 */
const bankStatementFileFilter = (req, file, cb) => {
  // Tipos MIME permitidos para extractos bancarios
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ];
  
  // Extensiones permitidas
  const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.csv', '.txt'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de extracto no válido. Formatos permitidos: ${allowedExtensions.join(', ')}`), false);
  }
};

/**
 * Configuración de multer para extractos bancarios
 */
const uploadBankStatement = multer({
  storage: bankStatementStorage,
  fileFilter: bankStatementFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // Máximo 15MB para extractos
    files: 1 // Solo un archivo por request
  }
});

module.exports = {
  uploadCompanyLogo,
  uploadDocuments,
  uploadBankStatement,
  handleMulterError
}; 