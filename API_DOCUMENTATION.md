# Sistema Contable - Documentación Completa de APIs

## Índice
1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Módulo de Configuración](#módulo-de-configuración)
4. [Módulo de Contabilidad](#módulo-de-contabilidad)
5. [Módulo de Tesorería](#módulo-de-tesorería)
6. [Módulo de Créditos Hipotecarios](#módulo-de-créditos-hipotecarios)
7. [Servicios de Archivos y PDFs](#servicios-de-archivos-y-pdfs)
8. [WebSockets](#websockets)
9. [Utilidades y Middlewares](#utilidades-y-middlewares)
10. [Códigos de Respuesta](#códigos-de-respuesta)

---

## Información General

### Servidor Base
- **URL Base**: `http://localhost:3004`
- **Tecnología**: Node.js + Express.js
- **Base de Datos**: MySQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación de Versión**: v1.0

### Formato de Respuesta Estándar
Todas las APIs siguen el siguiente formato de respuesta:

```json
{
  "success": true|false,
  "message": "Descripción del resultado",
  "data": {...} | null,
  "errors": {...} | null
}
```

### Headers Requeridos
```
Content-Type: application/json
Authorization: Bearer <jwt_token> (para rutas protegidas)
```

---

## Autenticación

### POST /api/auth/login
Iniciar sesión en el sistema.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@empresa.com",
      "full_name": "Administrador del Sistema",
      "role_id": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Códigos de Estado:**
- `200`: Login exitoso
- `401`: Credenciales inválidas
- `400`: Datos incompletos

### POST /api/auth/register
Registrar un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "full_name": "string",
  "role_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 2,
    "username": "nuevo_usuario",
    "email": "usuario@empresa.com",
    "full_name": "Nuevo Usuario"
  }
}
```

### GET /api/auth/verify
Verificar la validez del token actual.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@empresa.com",
      "full_name": "Administrador del Sistema",
      "role_id": 1
    }
  }
}
```

---

## Módulo de Configuración

### Gestión de Usuarios

#### GET /api/users
Obtener todos los usuarios del sistema.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Usuarios obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@empresa.com",
      "full_name": "Administrador",
      "role_id": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/users/:id
Obtener un usuario específico por ID.

#### POST /api/users
Crear un nuevo usuario.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "full_name": "string",
  "role_id": 2
}
```

#### PUT /api/users/:id
Actualizar datos de un usuario existente.

#### PATCH /api/users/:id/status
Cambiar el estado activo/inactivo de un usuario.

#### PUT /api/users/:id/password
Cambiar la contraseña de un usuario.

#### GET /api/users/:id/sessions
Obtener sesiones activas de un usuario.

#### DELETE /api/users/:id/sessions
Invalidar todas las sesiones de un usuario.

### Gestión de Roles

#### GET /api/roles
Obtener todos los roles del sistema.

#### POST /api/roles
Crear un nuevo rol.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "permissions": ["permission1", "permission2"]
}
```

### Gestión de Empresas

#### GET /api/companies
Obtener todas las empresas.

#### GET /api/companies/:id
Obtener una empresa específica.

#### POST /api/companies
Crear una nueva empresa.

**Request Body:**
```json
{
  "name": "string",
  "legal_name": "string",
  "identification_type": "NIT|CC|CE",
  "identification_number": "string",
  "verification_digit": "string",
  "tax_id": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "website": "string",
  "fiscal_year_start": "2024-01-01",
  "default_currency_id": 1
}
```

#### PUT /api/companies/:id
Actualizar datos de una empresa.

#### DELETE /api/companies/:id
Eliminar una empresa.

### Gestión de Monedas

#### GET /api/configuration/currencies
Obtener todas las monedas disponibles.

#### POST /api/configuration/currencies
Crear una nueva moneda.

**Request Body:**
```json
{
  "code": "USD",
  "name": "Dólar Estadounidense",
  "symbol": "$",
  "is_active": true
}
```

---

## Módulo de Contabilidad

### Plan de Cuentas

#### GET /api/accounting/chart-of-accounts
Obtener todas las cuentas contables.

**Query Parameters:**
- `page`: Número de página
- `limit`: Límite de resultados
- `search`: Búsqueda por nombre o código

**Response:**
```json
{
  "success": true,
  "message": "Cuentas contables obtenidas correctamente",
  "data": {
    "accounts": [
      {
        "id": 1,
        "code": "1105",
        "name": "Caja",
        "account_type_id": 1,
        "parent_account_id": null,
        "level": 1,
        "is_active": true,
        "allows_movement": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 50,
      "per_page": 10
    }
  }
}
```

#### GET /api/accounting/chart-of-accounts/hierarchical
Obtener el plan de cuentas en estructura jerárquica.

#### GET /api/accounting/chart-of-accounts/:id
Obtener una cuenta específica.

#### GET /api/accounting/chart-of-accounts/code/:code
Obtener una cuenta por su código.

#### POST /api/accounting/chart-of-accounts
Crear una nueva cuenta contable.

**Request Body:**
```json
{
  "code": "1105001",
  "name": "Caja General",
  "account_type_id": 1,
  "parent_account_id": 1,
  "allows_movement": true,
  "description": "Cuenta para movimientos de caja general"
}
```

#### PUT /api/accounting/chart-of-accounts/:id
Actualizar una cuenta contable.

#### GET /api/accounting/chart-of-accounts/:accountId/balance/:fiscalPeriodId
Obtener el saldo de una cuenta en un período específico.

### Asientos Contables

#### GET /api/accounting/journal-entries
Obtener todos los asientos contables.

**Query Parameters:**
- `date_from`: Fecha inicio (YYYY-MM-DD)
- `date_to`: Fecha fin (YYYY-MM-DD)
- `account_id`: Filtrar por cuenta
- `status`: Filtrar por estado (draft|posted|reversed)

#### GET /api/accounting/journal-entries/:id
Obtener un asiento contable específico.

#### POST /api/accounting/journal-entries
Crear un nuevo asiento contable.

**Request Body:**
```json
{
  "entry_number": "AST-001",
  "entry_date": "2024-01-15",
  "description": "Asiento de apertura",
  "reference": "REF-001",
  "details": [
    {
      "account_id": 1,
      "description": "Saldo inicial caja",
      "debit": 1000000,
      "credit": 0
    },
    {
      "account_id": 25,
      "description": "Capital inicial",
      "debit": 0,
      "credit": 1000000
    }
  ]
}
```

#### PUT /api/accounting/journal-entries/:id
Actualizar un asiento contable (solo si está en borrador).

#### POST /api/accounting/journal-entries/:id/post
Contabilizar un asiento (cambiar estado a "posted").

#### POST /api/accounting/journal-entries/:id/reverse
Revertir un asiento contabilizado.

### Comprobantes Contables

#### GET /api/accounting/vouchers
Obtener todos los comprobantes contables.

#### POST /api/accounting/vouchers
Crear un nuevo comprobante.

### Terceros

#### GET /api/accounting/third-parties
Obtener todos los terceros (clientes, proveedores, etc.).

#### POST /api/accounting/third-parties
Crear un nuevo tercero.

**Request Body:**
```json
{
  "identification_type": "CC|NIT|CE|PAS",
  "identification_number": "string",
  "name": "string",
  "contact_person": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "type": "customer|supplier|both"
}
```

### Períodos Fiscales

#### GET /api/accounting/fiscal-years
Obtener todos los años fiscales.

#### GET /api/accounting/fiscal-periods
Obtener todos los períodos fiscales.

#### POST /api/accounting/fiscal-years
Crear un nuevo año fiscal.

---

## Módulo de Tesorería

### Gestión Bancaria

#### GET /api/tesoreria/banks
Obtener todos los bancos configurados.

#### GET /api/tesoreria/bank-accounts
Obtener todas las cuentas bancarias.

#### POST /api/tesoreria/bank-accounts
Crear una nueva cuenta bancaria.

**Request Body:**
```json
{
  "bank_id": 1,
  "account_number": "1234567890",
  "account_type": "savings|checking",
  "currency_id": 1,
  "initial_balance": 0,
  "is_active": true
}
```

### Movimientos Bancarios

#### GET /api/tesoreria/movements
Obtener movimientos bancarios.

#### POST /api/tesoreria/movements
Registrar un nuevo movimiento bancario.

---

## Módulo de Créditos Hipotecarios

### Estado del Módulo

#### GET /api/credits/status
Obtener el estado general del módulo de créditos.

**Response:**
```json
{
  "success": true,
  "data": {
    "module": "Créditos Hipotecarios",
    "version": "1.0.0",
    "status": "En desarrollo",
    "modules_implemented": [
      "Types (Tipos de Crédito)",
      "Quota Configurations (Configuración de Cuotas)",
      "Notaries (Notarías)",
      "Properties (Propiedades Hipotecarias)",
      "Property Owners (Propietarios de Propiedades)",
      "Document Categories (Categorías de Documentos)",
      "Document Types (Tipos de Documentos)",
      "Mortgage Documents (Documentos de Créditos)",
      "Mortgages (Créditos Hipotecarios Principales)",
      "Mortgage Debtors (Deudores de Créditos)"
    ],
    "current_phase": "FASE 4: CRÉDITOS PRINCIPALES - EN DESARROLLO 🔄"
  }
}
```

### Tipos de Crédito

#### GET /api/credits/types
Obtener todos los tipos de créditos hipotecarios.

#### POST /api/credits/types
Crear un nuevo tipo de crédito.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "interest_rate": 12.5,
  "max_term_months": 240,
  "min_amount": 50000000,
  "max_amount": 500000000,
  "is_active": true
}
```

### Propiedades

#### GET /api/credits/properties
Obtener todas las propiedades hipotecarias.

#### POST /api/credits/properties
Registrar una nueva propiedad.

**Request Body:**
```json
{
  "registration_number": "string",
  "address": "string",
  "city": "string",
  "department": "string",
  "property_type": "house|apartment|lot|commercial",
  "area": 120.5,
  "commercial_value": 250000000,
  "cadastral_value": 180000000
}
```

### Créditos Hipotecarios

#### GET /api/credits/mortgages
Obtener todos los créditos hipotecarios.

#### POST /api/credits/mortgages
Crear un nuevo crédito hipotecario.

**Request Body:**
```json
{
  "credit_type_id": 1,
  "property_id": 1,
  "debtor_id": 1,
  "amount": 150000000,
  "interest_rate": 12.5,
  "term_months": 120,
  "start_date": "2024-01-01",
  "first_payment_date": "2024-02-01"
}
```

### Notarías

#### GET /api/credits/notaries
Obtener todas las notarías registradas.

#### POST /api/credits/notaries
Registrar una nueva notaría.

### Documentos

#### GET /api/credits/document-categories
Obtener categorías de documentos.

#### GET /api/credits/document-types
Obtener tipos de documentos.

#### GET /api/credits/mortgage-documents
Obtener documentos de créditos hipotecarios.

---

## Servicios de Archivos y PDFs

### Servicio de Archivos

#### Métodos Disponibles (FileService)

##### `fileExists(filePath)`
Verificar si un archivo existe.

```javascript
const exists = await FileService.fileExists('/path/to/file.pdf');
```

##### `deleteFile(filePath)`
Eliminar un archivo de forma segura.

```javascript
const deleted = await FileService.deleteFile('/path/to/file.pdf');
```

##### `getFileInfo(filePath)`
Obtener información detallada de un archivo.

```javascript
const info = await FileService.getFileInfo('/path/to/file.pdf');
// Retorna: { size, created, modified, isFile, isDirectory, extension, name, directory }
```

##### `validateFileType(filename, allowedExtensions)`
Validar el tipo de archivo.

```javascript
const isValid = FileService.validateFileType('document.pdf', ['.pdf', '.doc']);
```

##### `generateUniqueFileName(originalName, prefix)`
Generar nombre único para archivo.

```javascript
const uniqueName = FileService.generateUniqueFileName('document.pdf', 'company_');
```

##### `getImageExtensions()` / `getDocumentExtensions()`
Obtener extensiones permitidas.

```javascript
const imageExts = FileService.getImageExtensions(); // ['.jpg', '.jpeg', '.png', ...]
const docExts = FileService.getDocumentExtensions(); // ['.pdf', '.doc', '.docx', ...]
```

### Servicio de PDFs

#### Métodos Disponibles (PDFService)

##### `generateCompanyProfilePDF(companyData, options)`
Generar PDF del perfil de una empresa.

```javascript
const pdfBuffer = await PDFService.generateCompanyProfilePDF({
  id: 1,
  name: "Mi Empresa S.A.S",
  legal_name: "Mi Empresa Sociedad por Acciones Simplificada",
  identification_type: "NIT",
  identification_number: "900123456",
  verification_digit: "3",
  tax_id: "900123456-3",
  address: "Calle 123 #45-67",
  phone: "+57 1 234 5678",
  email: "info@miempresa.com",
  website: "https://www.miempresa.com",
  fiscal_year_start: "2024-01-01",
  currency_name: "Peso Colombiano",
  currency_symbol: "COP",
  logo_path: "/uploads/logos/logo.png"
});
```

##### `generateCompanyListPDF(companies)`
Generar PDF con listado de empresas.

```javascript
const companiesArray = [
  { name: "Empresa 1", tax_id: "123456789", email: "info@empresa1.com" },
  { name: "Empresa 2", tax_id: "987654321", email: "info@empresa2.com" }
];
const pdfBuffer = await PDFService.generateCompanyListPDF(companiesArray);
```

### Upload de Archivos

#### POST /uploads/companies/:companyId/documents
Subir documentos para una empresa.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Archivo a subir
- `category`: Categoría del documento
- `description`: Descripción opcional

---

## WebSockets

### Configuración Socket.io

El servidor implementa Socket.io para comunicación en tiempo real en el puerto del servidor principal.

#### Conexión
```javascript
const socket = io('http://localhost:3004');
```

#### Eventos Disponibles

##### `join-room`
Unirse a una sala específica para notificaciones.

```javascript
socket.emit('join-room', 'accounting-updates');
```

##### `connection`
Evento de conexión exitosa.

```javascript
socket.on('connect', () => {
  console.log('Conectado al servidor:', socket.id);
});
```

##### `disconnect`
Evento de desconexión.

```javascript
socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});
```

---

## Utilidades y Middlewares

### ApiResponse
Clase para estandarizar respuestas de la API.

#### Métodos Disponibles

##### `success(res, message, data, statusCode)`
```javascript
ApiResponse.success(res, "Operación exitosa", { id: 1 }, 200);
```

##### `error(res, message, statusCode, errors)`
```javascript
ApiResponse.error(res, "Error en la operación", 400, { field: "required" });
```

##### `created(res, message, data)`
```javascript
ApiResponse.created(res, "Recurso creado", { id: 1 });
```

##### `notFound(res, message)`
```javascript
ApiResponse.notFound(res, "Recurso no encontrado");
```

##### `unauthorized(res, message)`
```javascript
ApiResponse.unauthorized(res, "No autorizado");
```

##### `badRequest(res, message, errors)`
```javascript
ApiResponse.badRequest(res, "Datos inválidos", validationErrors);
```

##### `serverError(res, message, errors)`
```javascript
ApiResponse.serverError(res, "Error interno del servidor");
```

### Validator
Utilidad para validaciones.

#### Métodos Disponibles

##### `validateRequired(data, requiredFields)`
```javascript
const validation = Validator.validateRequired(req.body, ['username', 'password']);
if (!validation.isValid) {
  return ApiResponse.badRequest(res, 'Datos incompletos', validation.errors);
}
```

##### `isValidEmail(email)`
```javascript
const isValid = Validator.isValidEmail('user@example.com');
```

### Middleware de Autenticación

#### `verifyToken`
Middleware para verificar tokens JWT.

```javascript
const { verifyToken } = require('../middlewares/auth');
router.use(verifyToken); // Proteger todas las rutas
```

---

## Códigos de Respuesta

### Códigos HTTP Utilizados

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado correctamente |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - No autorizado / Token inválido |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error interno del servidor |

### Ejemplos de Respuestas de Error

#### Error de Validación (400)
```json
{
  "success": false,
  "message": "Datos inválidos",
  "errors": {
    "username": "El campo username es requerido",
    "email": "El formato del email es inválido"
  }
}
```

#### Error de Autenticación (401)
```json
{
  "success": false,
  "message": "Token inválido o expirado",
  "errors": null
}
```

#### Error No Encontrado (404)
```json
{
  "success": false,
  "message": "El usuario solicitado no existe",
  "errors": null
}
```

#### Error del Servidor (500)
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "errors": null
}
```

---

## Ejemplos de Uso Completos

### Ejemplo 1: Flujo de Autenticación Completo

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3004/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// 2. Usar token para acceder a recursos protegidos
const usersResponse = await fetch('http://localhost:3004/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const users = await usersResponse.json();
```

### Ejemplo 2: Crear Asiento Contable

```javascript
const journalEntry = {
  entry_number: "AST-001",
  entry_date: "2024-01-15",
  description: "Asiento de apertura",
  reference: "REF-001",
  details: [
    {
      account_id: 1,
      description: "Saldo inicial caja",
      debit: 1000000,
      credit: 0
    },
    {
      account_id: 25,
      description: "Capital inicial",
      debit: 0,
      credit: 1000000
    }
  ]
};

const response = await fetch('http://localhost:3004/api/accounting/journal-entries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(journalEntry)
});
```

### Ejemplo 3: Generar PDF de Empresa

```javascript
// Obtener datos de empresa
const companyResponse = await fetch('http://localhost:3004/api/companies/1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const company = await companyResponse.json();

// Generar PDF (en el backend)
const PDFService = require('./src/services/pdfService');
const pdfBuffer = await PDFService.generateCompanyProfilePDF(company.data);

// Guardar o enviar PDF
require('fs').writeFileSync('company-profile.pdf', pdfBuffer);
```

---

## Notas Adicionales

### Configuración del Entorno
Asegúrese de tener las siguientes variables de entorno configuradas:

```bash
PORT=3004
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=accounting_system
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start

# Inicializar directorios
npm run init
```

### Limitaciones y Consideraciones
- Las rutas protegidas requieren un token JWT válido
- Los archivos subidos tienen límites de tamaño (50MB por defecto)
- Las sesiones de Socket.io se manejan automáticamente
- La base de datos debe estar correctamente configurada antes del primer uso

### Soporte
Para más información o soporte técnico, consulte la documentación específica en la carpeta `/docs/` o contacte al equipo de desarrollo.