/**
 * Servicio para manejo de archivos
 * @module services/fileService
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Clase para gestionar operaciones con archivos
 */
class FileService {
  /**
   * Validar si un archivo existe
   * @param {string} filePath - Ruta del archivo
   * @returns {Promise<boolean>} True si existe, false si no
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Eliminar archivo de forma segura
   * @param {string} filePath - Ruta del archivo
   * @returns {Promise<boolean>} True si se eliminó, false si no
   */
  static async deleteFile(filePath) {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
        logger.info(`Archivo eliminado: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error al eliminar archivo ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtener información de un archivo
   * @param {string} filePath - Ruta del archivo
   * @returns {Promise<Object|null>} Info del archivo o null si no existe
   */
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        extension: path.extname(filePath),
        name: path.basename(filePath),
        directory: path.dirname(filePath)
      };
    } catch (error) {
      logger.error(`Error al obtener info del archivo ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Validar tipo de archivo
   * @param {string} filename - Nombre del archivo
   * @param {Array} allowedExtensions - Extensiones permitidas
   * @returns {boolean} True si es válido
   */
  static validateFileType(filename, allowedExtensions) {
    const extension = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(extension);
  }

  /**
   * Validar tamaño de archivo
   * @param {number} fileSize - Tamaño en bytes
   * @param {number} maxSize - Tamaño máximo en bytes
   * @returns {boolean} True si es válido
   */
  static validateFileSize(fileSize, maxSize) {
    return fileSize <= maxSize;
  }

  /**
   * Generar nombre único para archivo
   * @param {string} originalName - Nombre original
   * @param {string} prefix - Prefijo opcional
   * @returns {string} Nombre único
   */
  static generateUniqueFileName(originalName, prefix = '') {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    return `${prefix}${timestamp}_${random}${extension}`;
  }

  /**
   * Crear directorio si no existe
   * @param {string} dirPath - Ruta del directorio
   * @returns {Promise<boolean>} True si se creó o ya existía
   */
  static async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      logger.error(`Error al crear directorio ${dirPath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtener extensiones permitidas para imágenes
   * @returns {Array} Array de extensiones
   */
  static getImageExtensions() {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  }

  /**
   * Obtener extensiones permitidas para documentos
   * @returns {Array} Array de extensiones
   */
  static getDocumentExtensions() {
    return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
  }

  /**
   * Obtener tipos MIME permitidos para imágenes
   * @returns {Array} Array de tipos MIME
   */
  static getImageMimeTypes() {
    return [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
  }

  /**
   * Obtener tipos MIME permitidos para documentos
   * @returns {Array} Array de tipos MIME
   */
  static getDocumentMimeTypes() {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
  }

  /**
   * Formatear tamaño de archivo a formato legible
   * @param {number} bytes - Tamaño en bytes
   * @returns {string} Tamaño formateado
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Limpiar archivos temporales antiguos
   * @param {string} tempDir - Directorio temporal
   * @param {number} maxAge - Edad máxima en milisegundos
   * @returns {Promise<number>} Número de archivos eliminados
   */
  static async cleanupTempFiles(tempDir, maxAge = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    try {
      const files = await fs.readdir(tempDir);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Archivos temporales limpiados: ${deletedCount}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error al limpiar archivos temporales: ${error.message}`);
      return 0;
    }
  }

  /**
   * Mover archivo de ubicación temporal a final
   * @param {string} tempPath - Ruta temporal
   * @param {string} finalPath - Ruta final
   * @returns {Promise<boolean>} True si se movió correctamente
   */
  static async moveFile(tempPath, finalPath) {
    try {
      // Asegurar que el directorio destino existe
      await this.ensureDirectory(path.dirname(finalPath));
      
      // Copiar archivo
      await fs.copyFile(tempPath, finalPath);
      
      // Eliminar archivo temporal
      await fs.unlink(tempPath);
      
      logger.info(`Archivo movido de ${tempPath} a ${finalPath}`);
      return true;
    } catch (error) {
      logger.error(`Error al mover archivo: ${error.message}`);
      return false;
    }
  }
}

module.exports = FileService; 