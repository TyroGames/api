# Sistema Contable - Backend

Este repositorio contiene el backend del Sistema Contable, una aplicación completa para la gestión financiera y contable de empresas. Desarrollado con Node.js, Express y MySQL.

## Requisitos

- Node.js 16.x o superior
- MySQL 8.0 o superior
- npm 7.x o superior

## Configuración

1. Clonar el repositorio:
```
git clone <url_del_repositorio>
cd Sistema/Backend
```

2. Instalar dependencias:
```
npm install
```

3. Crear archivo de variables de entorno:
```
cp .env.example .env
```

4. Configurar las variables de entorno en el archivo `.env`:
```
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_financiero_v1

# Configuración JWT
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRATION=8h
```

5. Crear la base de datos:
```
mysql -u root -p < src/database/schema.sql
```

6. Inicializar datos de prueba:
```
mysql -u root -p sistema_financiero_v1 < src/database/seed_accounting.sql
```

## Ejecutar la aplicación

### Modo desarrollo
```
npm run dev
```

### Modo producción
```
npm start
```

## Módulos implementados

### Autenticación

- Registro de usuarios
- Inicio de sesión
- Verificación de token JWT
- Gestión de roles y permisos

### Contabilidad General

- Catálogo de cuentas
  - Creación y gestión de tipos de cuenta
  - Estructura jerárquica de cuentas (padres-hijos)
  - Validación de niveles contables
  - Control de naturaleza de las cuentas (deudora/acreedora)

- Asientos contables
  - Creación y edición de asientos
  - Validación de cuadre contable (débito = crédito)
  - Contabilización automática
  - Reversión de asientos
  - Numeración automática

- Libros contables
  - Libro diario
  - Libro mayor
  - Balance de comprobación

### API REST

La API sigue principios RESTful y utiliza autenticación mediante tokens JWT.

#### Endpoints principales

**Autenticación**
- `POST /api/auth/login`: Iniciar sesión
- `POST /api/auth/register`: Registrar usuario
- `GET /api/auth/verify`: Verificar token

**Tipos de Cuenta**
- `GET /api/accounting/account-types`: Listar tipos de cuenta
- `GET /api/accounting/account-types/:id`: Obtener un tipo de cuenta
- `POST /api/accounting/account-types`: Crear tipo de cuenta
- `PUT /api/accounting/account-types/:id`: Actualizar tipo de cuenta
- `DELETE /api/accounting/account-types/:id`: Eliminar tipo de cuenta

**Plan de Cuentas**
- `GET /api/accounting/chart-of-accounts`: Listar cuentas contables
- `GET /api/accounting/chart-of-accounts/hierarchical`: Obtener estructura jerárquica
- `GET /api/accounting/chart-of-accounts/:id`: Obtener una cuenta
- `GET /api/accounting/chart-of-accounts/code/:code`: Buscar por código
- `POST /api/accounting/chart-of-accounts`: Crear cuenta
- `PUT /api/accounting/chart-of-accounts/:id`: Actualizar cuenta
- `DELETE /api/accounting/chart-of-accounts/:id`: Eliminar cuenta

**Asientos Contables**
- `GET /api/accounting/journal-entries`: Listar asientos
- `GET /api/accounting/journal-entries/:id`: Obtener un asiento
- `POST /api/accounting/journal-entries`: Crear asiento
- `PUT /api/accounting/journal-entries/:id`: Actualizar asiento
- `POST /api/accounting/journal-entries/:id/post`: Contabilizar asiento
- `POST /api/accounting/journal-entries/:id/reverse`: Revertir asiento

## Estructura del proyecto

```
Sistema/Backend/
├── index.js                   # Punto de entrada de la aplicación
├── .env.example               # Ejemplo de variables de entorno
├── package.json               # Dependencias y scripts
├── logs/                      # Archivos de registro
├── uploads/                   # Almacenamiento de archivos
└── src/
    ├── config/                # Configuración de la aplicación
    ├── controllers/           # Controladores para las rutas
    ├── database/              # Scripts SQL
    ├── middlewares/           # Middleware personalizado
    ├── models/                # Modelos de datos
    ├── routes/                # Definición de rutas
    └── utils/                 # Utilidades y helpers
```

## Tecnologías utilizadas

- **Node.js**: Entorno de ejecución
- **Express**: Framework web
- **MySQL**: Base de datos relacional
- **jsonwebtoken**: Autenticación mediante tokens
- **bcrypt**: Cifrado de contraseñas
- **winston**: Sistema de logs
- **socket.io**: Comunicación en tiempo real

## Características de seguridad

- Autenticación basada en JWT
- Contraseñas hasheadas con bcrypt
- Validación de entrada en todas las rutas
- Control de acceso basado en roles
- Protección contra inyección SQL
- Registro detallado de actividades

## Licencia

Este proyecto está licenciado bajo los términos de la licencia MIT. Vea el archivo LICENSE para más detalles. 