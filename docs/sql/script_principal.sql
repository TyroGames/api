-- Script principal para cargar todos los datos iniciales del sistema contable
-- Este script carga los datos en el orden correcto para respetar las dependencias entre tablas

-- Nota: Asegúrate de que la base de datos y las tablas ya estén creadas antes de ejecutar este script

-- 1. Cargar tipos de cuentas y catálogo de cuentas básico
SOURCE catalogo_cuentas_basico.sql

-- 2. Cargar tipos de naturaleza y tipos de comprobantes contables
SOURCE tipos_comprobantes.sql

-- 3. Cargar tipos de documentos legales
SOURCE tipos_documentos_legales.sql

-- 4. Cargar años fiscales
SOURCE fiscal_years.sql

-- 5. Cargar períodos fiscales
SOURCE periodos_fiscales.sql

-- 6. Cargar datos básicos (monedas, usuarios, terceros, impuestos, etc.)
SOURCE datos_ejemplo.sql

-- 7. Cargar ejemplos de comprobantes contables
SOURCE comprobantes_ejemplo.sql

-- 8. Cargar ejemplos de documentos legales
SOURCE documentos_legales_ejemplo.sql

-- Instrucciones de uso:
-- 1. Este script debe ejecutarse desde el directorio donde se encuentran todos los scripts SQL
-- 2. Ejecutar desde MySQL Client: source script_principal.sql
-- 3. Si ejecutas el script desde otro directorio, deberás ajustar las rutas relativas
-- 4. Verifica que existan todos los archivos SQL referenciados
-- 5. Este script asume que la estructura de la base de datos ya está creada
-- 6. Si ocurre un error, verifica las claves foráneas y dependencias

-- Ejemplo de uso desde línea de comandos:
-- mysql -u usuario -p nombre_base_datos < script_principal.sql

-- Ejemplo de uso desde MySQL Client:
-- cd /ruta/a/directorio/sql
-- mysql -u usuario -p nombre_base_datos
-- mysql> source script_principal.sql 