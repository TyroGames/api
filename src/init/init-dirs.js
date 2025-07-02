/**
 * Script para inicializar directorios necesarios del sistema
 * @module init/init-dirs
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Directorios necesarios para el sistema
 */
const directories = [
  'uploads',
  'uploads/companies',
  'uploads/companies/logos',
  'uploads/documents',
  'uploads/legal-documents',
  'uploads/vouchers',
  'uploads/reports',
  'uploads/temp',
  'logs'
];

/**
 * Crear directorios si no existen
 */
async function createDirectories() {
  console.log('🔧 Inicializando directorios del sistema...');
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    
    try {
      await fs.access(dirPath);
      console.log(`✅ Directorio ya existe: ${dir}`);
    } catch (error) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      } catch (createError) {
        console.error(`❌ Error al crear directorio ${dir}:`, createError.message);
      }
    }
  }
  
  console.log('✨ Inicialización de directorios completada\n');
}

/**
 * Verificar permisos de escritura
 */
async function checkWritePermissions() {
  console.log('🔍 Verificando permisos de escritura...');
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    const testFile = path.join(dirPath, '.write-test');
    
    try {
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log(`✅ Permisos OK: ${dir}`);
    } catch (error) {
      console.error(`❌ Error de permisos en ${dir}:`, error.message);
    }
  }
  
  console.log('✨ Verificación de permisos completada\n');
}

/**
 * Función principal
 */
async function init() {
  try {
    await createDirectories();
    await checkWritePermissions();
    
    console.log('🎉 Sistema de directorios inicializado correctamente');
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  init();
}

module.exports = { init, createDirectories, checkWritePermissions };