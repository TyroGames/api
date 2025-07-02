# Scripts de Datos para el Sistema Contable

Este directorio contiene scripts SQL para poblar la base de datos del sistema contable con datos iniciales y ejemplos.

## Archivos Incluidos

1. **catalogo_cuentas_basico.sql** - Tipos de cuentas y catálogo contable básico (PUC)
2. **tipos_comprobantes.sql** - Naturalezas de comprobantes y tipos de comprobantes contables
3. **tipos_documentos_legales.sql** - Tipos de documentos legales soportados
4. **fiscal_years.sql** - Años fiscales (2023, 2024, 2025)
5. **periodos_fiscales.sql** - Períodos fiscales mensuales para 2023 y 2024
6. **datos_ejemplo.sql** - Datos básicos como monedas, usuarios, terceros, centros de costo, etc.
7. **comprobantes_ejemplo.sql** - Ejemplos de comprobantes contables
8. **documentos_legales_ejemplo.sql** - Ejemplos de documentos legales
9. **script_principal.sql** - Script principal que carga todos los anteriores en orden

## Requisitos Previos

Antes de ejecutar estos scripts, asegúrate de:

1. Tener creada la base de datos con su estructura completa (tablas, índices, restricciones)
2. Tener permisos suficientes en la base de datos para insertar registros
3. Verificar que la estructura de las tablas coincida con la esperada por los scripts

## Orden de Ejecución

Es crucial ejecutar los scripts en el orden correcto debido a las dependencias entre tablas:

1. Primero, catálogo de cuentas
2. Luego, tipos de comprobantes y documentos
3. Después, años fiscales y períodos fiscales
4. Seguido por datos básicos
5. Finalmente, ejemplos de comprobantes y documentos

El archivo `script_principal.sql` ya tiene configurado este orden.

## Cómo Ejecutar los Scripts

### Usando MySQL Client

```bash
# Navegar al directorio donde están los scripts
cd /ruta/a/Sistema/Backend/docs/sql

# Conectarse a MySQL
mysql -u usuario -p nombre_base_datos

# Dentro de MySQL, ejecutar
source script_principal.sql
```

### Usando la línea de comandos

```bash
# Navegar al directorio donde están los scripts
cd /ruta/a/Sistema/Backend/docs/sql

# Ejecutar el script principal
mysql -u usuario -p nombre_base_datos < script_principal.sql
```

### Usando alguna herramienta gráfica (MySQL Workbench, HeidiSQL, etc.)

1. Abrir el archivo `script_principal.sql`
2. Verificar que las rutas relativas funcionen correctamente
3. Ejecutar el script completo

## Personalización

Estos scripts contienen datos de ejemplo que pueden no ser adecuados para tu entorno específico. Considera lo siguiente:

- Adapta el catálogo de cuentas al plan contable específico de tu país/empresa
- Modifica los tipos de comprobantes según tus necesidades contables
- Ajusta los períodos fiscales al año de operación y calendario fiscal aplicable
- Reemplaza los datos de terceros por información real de clientes y proveedores

## Notas Importantes

- Los scripts usan IDs específicos para relacionar tablas. Si modificas uno, asegúrate de actualizar todas las referencias.
- Las contraseñas de usuarios están hasheadas con bcrypt. Para entornos reales, genera nuevos hashes.
- Los montos y fechas son solo ejemplos y no deben usarse para análisis financiero real.
- Algunos registros pueden depender de la existencia previa de roles y otras entidades básicas.

## Solución de Problemas

Si encuentras errores al ejecutar los scripts:

1. Verifica que todas las tablas referenciadas existan en la base de datos
2. Asegúrate que los IDs referenciados existan en las tablas correspondientes
3. Comprueba que las restricciones de clave foránea permitan las inserciones
4. Ejecuta los scripts individualmente para identificar dónde ocurre el error

---

Para más información sobre la estructura de la base de datos, consulta la documentación general del sistema. 