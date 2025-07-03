# Sistema Contable - Documentación de Componentes y Funciones

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Controladores](#controladores)
3. [Modelos](#modelos)
4. [Servicios](#servicios)
5. [Middlewares](#middlewares)
6. [Utilidades](#utilidades)
7. [Configuración](#configuración)
8. [Estructura de Base de Datos](#estructura-de-base-de-datos)
9. [Patrones de Diseño](#patrones-de-diseño)

---

## Arquitectura del Sistema

### Estructura MVC
El sistema sigue el patrón Model-View-Controller (MVC) adaptado para APIs REST:

```
src/
├── controllers/          # Lógica de control de rutas
├── models/              # Modelos de datos y ORM
├── services/            # Lógica de negocio
├── routes/              # Definición de rutas
├── middlewares/         # Middlewares personalizados
├── utils/               # Utilidades generales
├── config/              # Configuración del sistema
└── database/            # Scripts de base de datos
```

### Flujo de Datos
```
Cliente → Routes → Middleware → Controller → Service → Model → Database
```

---

## Controladores

### AuthController
Maneja la autenticación y autorización de usuarios.

#### Métodos

##### `login(req, res)`
Autentica un usuario y genera un token JWT.

```javascript
static async login(req, res) {
  try {
    const { username, password } = req.body;
    
    // Validar campos requeridos
    const validation = Validator.validateRequired(req.body, ['username', 'password']);
    if (!validation.isValid) {
      return ApiResponse.badRequest(res, 'Datos incompletos', validation.errors);
    }

    // Verificar credenciales
    const user = await UserModel.verifyCredentials(username, password);
    
    if (!user) {
      return ApiResponse.unauthorized(res, 'Credenciales inválidas');
    }

    // Generar token JWT
    const token = generateToken(user);

    return ApiResponse.success(res, 'Inicio de sesión exitoso', {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    return ApiResponse.serverError(res, 'Error al iniciar sesión');
  }
}
```

**Parámetros:**
- `req.body.username`: Nombre de usuario
- `req.body.password`: Contraseña

**Retorna:**
- Usuario autenticado y token JWT

##### `register(req, res)`
Registra un nuevo usuario en el sistema.

**Validaciones:**
- Campos requeridos: username, password, email, full_name
- Formato de email válido
- Username único
- Email único

##### `verifyToken(req, res)`
Verifica la validez del token JWT actual.

### UserController
Gestiona las operaciones CRUD de usuarios.

#### Métodos Principales

##### `getAll(req, res)`
Obtiene todos los usuarios con paginación.

```javascript
static async getAll(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const users = await UserModel.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    
    return ApiResponse.success(res, 'Usuarios obtenidos correctamente', users);
  } catch (error) {
    return ApiResponse.serverError(res, 'Error al obtener usuarios');
  }
}
```

##### `create(req, res)`
Crea un nuevo usuario.

##### `update(req, res)`
Actualiza un usuario existente.

##### `changeStatus(req, res)`
Cambia el estado activo/inactivo de un usuario.

##### `changePassword(req, res)`
Cambia la contraseña de un usuario.

### AccountingController
Maneja operaciones del plan de cuentas.

#### Métodos

##### `getHierarchical(req, res)`
Obtiene el plan de cuentas en estructura jerárquica.

```javascript
static async getHierarchical(req, res) {
  try {
    const hierarchicalAccounts = await ChartOfAccountsModel.getHierarchical();
    
    return ApiResponse.success(res, 'Plan de cuentas jerárquico obtenido', {
      accounts: hierarchicalAccounts
    });
  } catch (error) {
    return ApiResponse.serverError(res, 'Error al obtener plan de cuentas');
  }
}
```

##### `getBalance(req, res)`
Obtiene el saldo de una cuenta en un período específico.

### JournalEntryController
Gestiona asientos contables.

#### Métodos

##### `create(req, res)`
Crea un nuevo asiento contable.

```javascript
static async create(req, res) {
  try {
    const journalEntryData = req.body;
    
    // Validar estructura del asiento
    const validation = await this.validateJournalEntry(journalEntryData);
    if (!validation.isValid) {
      return ApiResponse.badRequest(res, 'Datos del asiento inválidos', validation.errors);
    }
    
    // Crear asiento
    const journalEntry = await JournalEntryModel.create(journalEntryData);
    
    return ApiResponse.created(res, 'Asiento contable creado', journalEntry);
  } catch (error) {
    return ApiResponse.serverError(res, 'Error al crear asiento contable');
  }
}
```

##### `post(req, res)`
Contabiliza un asiento (cambia estado a "posted").

##### `reverse(req, res)`
Revierte un asiento contabilizado.

---

## Modelos

### UserModel
Modelo para gestión de usuarios.

#### Métodos

##### `verifyCredentials(username, password)`
Verifica las credenciales de un usuario.

```javascript
static async verifyCredentials(username, password) {
  try {
    const query = `
      SELECT id, username, email, full_name, role_id, password_hash, is_active
      FROM users 
      WHERE username = ? AND is_active = 1
    `;
    
    const [rows] = await db.execute(query, [username]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const user = rows[0];
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Remover password_hash del objeto retornado
    delete user.password_hash;
    
    return user;
  } catch (error) {
    logger.error(`Error en verifyCredentials: ${error.message}`);
    throw error;
  }
}
```

##### `findById(id)`
Busca un usuario por ID.

##### `findByUsername(username)`
Busca un usuario por nombre de usuario.

##### `findByEmail(email)`
Busca un usuario por email.

##### `create(userData)`
Crea un nuevo usuario.

```javascript
static async create(userData) {
  try {
    const { username, password, email, full_name, role_id = 2 } = userData;
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, full_name, password_hash, role_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, NOW())
    `;
    
    const [result] = await db.execute(query, [
      username, email, full_name, passwordHash, role_id
    ]);
    
    return await this.findById(result.insertId);
  } catch (error) {
    logger.error(`Error al crear usuario: ${error.message}`);
    throw error;
  }
}
```

### ChartOfAccountsModel
Modelo para el plan de cuentas.

#### Métodos

##### `getHierarchical()`
Obtiene las cuentas en estructura jerárquica.

```javascript
static async getHierarchical() {
  try {
    const query = `
      WITH RECURSIVE account_hierarchy AS (
        -- Nodos raíz (sin padre)
        SELECT id, code, name, parent_account_id, account_type_id, level, 0 as depth
        FROM chart_of_accounts 
        WHERE parent_account_id IS NULL AND is_active = 1
        
        UNION ALL
        
        -- Nodos hijos
        SELECT c.id, c.code, c.name, c.parent_account_id, c.account_type_id, c.level, ah.depth + 1
        FROM chart_of_accounts c
        INNER JOIN account_hierarchy ah ON c.parent_account_id = ah.id
        WHERE c.is_active = 1
      )
      SELECT * FROM account_hierarchy 
      ORDER BY code
    `;
    
    const [rows] = await db.execute(query);
    
    // Construir estructura jerárquica
    return this.buildHierarchy(rows);
  } catch (error) {
    logger.error(`Error al obtener estructura jerárquica: ${error.message}`);
    throw error;
  }
}
```

##### `getBalance(accountId, fiscalPeriodId)`
Obtiene el saldo de una cuenta.

##### `create(accountData)`
Crea una nueva cuenta contable.

### JournalEntryModel
Modelo para asientos contables.

#### Métodos

##### `create(entryData)`
Crea un asiento contable con sus detalles.

```javascript
static async create(entryData) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Crear cabecera del asiento
    const headerQuery = `
      INSERT INTO journal_entries (entry_number, entry_date, description, reference, status, created_by, created_at)
      VALUES (?, ?, ?, ?, 'draft', ?, NOW())
    `;
    
    const [headerResult] = await connection.execute(headerQuery, [
      entryData.entry_number,
      entryData.entry_date,
      entryData.description,
      entryData.reference,
      entryData.created_by
    ]);
    
    const entryId = headerResult.insertId;
    
    // Crear detalles del asiento
    for (const detail of entryData.details) {
      const detailQuery = `
        INSERT INTO journal_entry_details (journal_entry_id, account_id, description, debit, credit, sequence)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(detailQuery, [
        entryId,
        detail.account_id,
        detail.description,
        detail.debit || 0,
        detail.credit || 0,
        detail.sequence || 0
      ]);
    }
    
    await connection.commit();
    
    return await this.findById(entryId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

##### `post(entryId)`
Contabiliza un asiento.

##### `reverse(entryId, reversalReason)`
Revierte un asiento contabilizado.

---

## Servicios

### PDFService
Servicio para generación de documentos PDF.

#### Métodos

##### `generateCompanyProfilePDF(companyData, options)`
Genera un PDF con el perfil de una empresa.

```javascript
static async generateCompanyProfilePDF(companyData, options = {}) {
  try {
    // Crear nuevo documento PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Perfil Empresarial - ${companyData.name}`,
        Author: 'Sistema Contable',
        Subject: 'Información Empresarial'
      }
    });

    // Buffer para almacenar el PDF
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // Generar contenido del PDF
    await this.addHeader(doc, companyData, this.getColors());
    await this.addMainInfo(doc, companyData, this.getColors());
    await this.addContactInfo(doc, companyData, this.getColors());
    await this.addFiscalInfo(doc, companyData, this.getColors());
    await this.addFooter(doc, this.getColors());

    doc.end();
    
    return await pdfPromise;
  } catch (error) {
    logger.error(`Error al generar PDF de empresa: ${error.message}`);
    throw error;
  }
}
```

**Funciones Auxiliares:**
- `addHeader()`: Agrega encabezado con logo
- `addMainInfo()`: Agrega información principal
- `addContactInfo()`: Agrega datos de contacto
- `addFiscalInfo()`: Agrega información fiscal
- `addFooter()`: Agrega pie de página

##### `generateCompanyListPDF(companies)`
Genera PDF con listado de empresas.

### FileService
Servicio para manejo de archivos.

#### Métodos

##### `fileExists(filePath)`
Verifica si un archivo existe.

```javascript
static async fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
```

##### `getFileInfo(filePath)`
Obtiene información detallada de un archivo.

```javascript
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
    logger.error(`Error al obtener info del archivo: ${error.message}`);
    return null;
  }
}
```

##### `validateFileType(filename, allowedExtensions)`
Valida el tipo de archivo.

##### `generateUniqueFileName(originalName, prefix)`
Genera nombre único para archivo.

##### `cleanupTempFiles(tempDir, maxAge)`
Limpia archivos temporales antiguos.

---

## Middlewares

### auth.js
Middleware de autenticación JWT.

#### Funciones

##### `generateToken(user)`
Genera un token JWT para un usuario.

```javascript
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role_id: user.role_id
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'accounting-system'
  });
}
```

##### `verifyToken(req, res, next)`
Verifica la validez del token JWT.

```javascript
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Token no proporcionado');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Token inválido');
    } else {
      return ApiResponse.serverError(res, 'Error al verificar token');
    }
  }
}
```

### fileUpload.js
Middleware para manejo de archivos.

#### Configuración Multer

```javascript
const multer = require('multer');
const path = require('path');
const FileService = require('../services/fileService');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    FileService.ensureDirectory(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = FileService.generateUniqueFileName(file.originalname);
    cb(null, uniqueName);
  }
});

// Filtros de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ...FileService.getImageMimeTypes(),
    ...FileService.getDocumentMimeTypes()
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});
```

---

## Utilidades

### ApiResponse
Clase para estandarizar respuestas de la API.

#### Métodos Estáticos

##### `success(res, message, data, statusCode)`
Crea una respuesta exitosa.

```javascript
static success(res, message = "Operación exitosa", data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}
```

##### `error(res, message, statusCode, errors)`
Crea una respuesta de error.

##### `created(res, message, data)`
Respuesta para recursos creados (201).

##### `notFound(res, message)`
Respuesta para recursos no encontrados (404).

##### `unauthorized(res, message)`
Respuesta para errores de autorización (401).

##### `badRequest(res, message, errors)`
Respuesta para errores de validación (400).

##### `serverError(res, message, errors)`
Respuesta para errores del servidor (500).

### Validator
Utilidad para validaciones de datos.

#### Métodos

##### `validateRequired(data, requiredFields)`
Valida campos requeridos.

```javascript
static validateRequired(data, requiredFields) {
  const errors = {};
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors[field] = `El campo ${field} es requerido`;
      isValid = false;
    }
  });
  
  return { isValid, errors };
}
```

##### `isValidEmail(email)`
Valida formato de email.

```javascript
static isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

##### `validateAccountCode(code)`
Valida formato de código contable.

##### `validateAmount(amount)`
Valida formato de cantidad monetaria.

### Logger
Sistema de logging con Winston.

#### Configuración

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'accounting-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Métodos de Logging

- `logger.error(message, metadata)`: Errores críticos
- `logger.warn(message, metadata)`: Advertencias
- `logger.info(message, metadata)`: Información general
- `logger.debug(message, metadata)`: Información de debug

---

## Configuración

### Database (db.js)
Configuración de conexión a MySQL.

```javascript
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'accounting_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Función de prueba de conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('Conexión a la base de datos establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    logger.error(`Error al conectar a la base de datos: ${error.message}`);
    return false;
  }
}

module.exports = { pool, testConnection };
```

### Environment Variables
Variables de entorno requeridas:

```bash
# Servidor
PORT=3004
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_USER=accounting_user
DB_PASSWORD=secure_password
DB_NAME=accounting_system

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Logging
LOG_LEVEL=info

# Archivos
UPLOAD_MAX_SIZE=52428800  # 50MB
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
```

---

## Estructura de Base de Datos

### Tablas Principales

#### users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

#### chart_of_accounts
```sql
CREATE TABLE chart_of_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  account_type_id INT NOT NULL,
  parent_account_id INT NULL,
  level INT NOT NULL,
  allows_movement BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_type_id) REFERENCES account_types(id),
  FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id)
);
```

#### journal_entries
```sql
CREATE TABLE journal_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_number VARCHAR(20) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(100),
  status ENUM('draft', 'posted', 'reversed') DEFAULT 'draft',
  posted_at TIMESTAMP NULL,
  reversed_at TIMESTAMP NULL,
  reversal_reason TEXT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### journal_entry_details
```sql
CREATE TABLE journal_entry_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  journal_entry_id INT NOT NULL,
  account_id INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0.00,
  credit DECIMAL(15,2) DEFAULT 0.00,
  sequence INT DEFAULT 0,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);
```

### Relaciones

- **users** ↔ **roles**: Many-to-One
- **chart_of_accounts** ↔ **account_types**: Many-to-One
- **chart_of_accounts** ↔ **chart_of_accounts**: Self-referencing (jerarquía)
- **journal_entries** ↔ **journal_entry_details**: One-to-Many
- **journal_entries** ↔ **users**: Many-to-One (created_by)

---

## Patrones de Diseño

### Repository Pattern
Los modelos actúan como repositorios para el acceso a datos.

```javascript
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }
  
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }
  
  async findAll(options = {}) {
    const { page = 1, limit = 10, where = '', orderBy = 'id' } = options;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM ${this.tableName}`;
    if (where) query += ` WHERE ${where}`;
    query += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
    
    const [rows] = await db.execute(query);
    return rows;
  }
}
```

### Service Layer Pattern
Los servicios contienen la lógica de negocio.

```javascript
class AccountingService {
  static async createJournalEntry(entryData) {
    // Validaciones de negocio
    await this.validateJournalEntry(entryData);
    
    // Generar número de asiento
    entryData.entry_number = await this.generateEntryNumber();
    
    // Crear asiento
    return await JournalEntryModel.create(entryData);
  }
  
  static async validateJournalEntry(entryData) {
    // Validar que débitos = créditos
    const totalDebits = entryData.details.reduce((sum, detail) => sum + (detail.debit || 0), 0);
    const totalCredits = entryData.details.reduce((sum, detail) => sum + (detail.credit || 0), 0);
    
    if (totalDebits !== totalCredits) {
      throw new Error('Los débitos deben ser iguales a los créditos');
    }
  }
}
```

### Factory Pattern
Para la creación de respuestas API.

```javascript
class ResponseFactory {
  static create(type, message, data = null, errors = null) {
    const responses = {
      success: () => ({ success: true, message, data }),
      error: () => ({ success: false, message, errors }),
      validation: () => ({ success: false, message: 'Errores de validación', errors })
    };
    
    return responses[type]();
  }
}
```

### Middleware Pattern
Para el procesamiento de requests.

```javascript
// Pipeline de middlewares
app.use(cors());
app.use(compression());
app.use(morgan(':method :url :status'));
app.use(express.json({ limit: '50mb' }));
app.use('/api/*', verifyToken);  // Autenticación
app.use('/api/*', validateRequest);  // Validación
app.use('/api/*', auditLog);  // Auditoría
```

### Observer Pattern
Para eventos en tiempo real con Socket.io.

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Uso en asientos contables
const accountingEvents = new EventEmitter();

accountingEvents.on('journal-entry-posted', (entry) => {
  // Notificar via Socket.io
  io.emit('accounting-update', {
    type: 'journal-entry-posted',
    data: entry
  });
});
```

---

## Ejemplo de Implementación Completa

### Crear un Nuevo Módulo: Inventarios

#### 1. Modelo (src/models/inventoryModel.js)
```javascript
const { pool } = require('../config/db');
const logger = require('../utils/logger');

class InventoryModel {
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '' } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT i.*, p.name as product_name, w.name as warehouse_name
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.is_active = 1
      `;
      
      const params = [];
      
      if (search) {
        query += ` AND (p.name LIKE ? OR w.name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN warehouses w ON i.warehouse_id = w.id
        WHERE i.is_active = 1
        ${search ? 'AND (p.name LIKE ? OR w.name LIKE ?)' : ''}
      `;
      
      const countParams = search ? [`%${search}%`, `%${search}%`] : [];
      const [countRows] = await pool.execute(countQuery, countParams);
      
      return {
        items: rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(countRows[0].total / limit),
          total_records: countRows[0].total,
          per_page: limit
        }
      };
    } catch (error) {
      logger.error(`Error en findAll de inventario: ${error.message}`);
      throw error;
    }
  }
  
  static async updateStock(productId, warehouseId, quantity, type, reason) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Actualizar stock
      const updateQuery = `
        UPDATE inventory 
        SET quantity = quantity ${type === 'in' ? '+' : '-'} ?,
            last_movement_date = NOW()
        WHERE product_id = ? AND warehouse_id = ?
      `;
      
      await connection.execute(updateQuery, [quantity, productId, warehouseId]);
      
      // Registrar movimiento
      const movementQuery = `
        INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reason, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      await connection.execute(movementQuery, [productId, warehouseId, quantity, type, reason]);
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = InventoryModel;
```

#### 2. Controlador (src/controllers/inventoryController.js)
```javascript
const InventoryModel = require('../models/inventoryModel');
const ApiResponse = require('../utils/apiResponse');
const Validator = require('../utils/validator');

class InventoryController {
  static async getAll(req, res) {
    try {
      const { page, limit, search } = req.query;
      
      const inventory = await InventoryModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search
      });
      
      return ApiResponse.success(res, 'Inventario obtenido correctamente', inventory);
    } catch (error) {
      logger.error(`Error en getAll de inventario: ${error.message}`);
      return ApiResponse.serverError(res, 'Error al obtener inventario');
    }
  }
  
  static async updateStock(req, res) {
    try {
      const { productId, warehouseId, quantity, type, reason } = req.body;
      
      // Validar campos requeridos
      const validation = Validator.validateRequired(req.body, [
        'productId', 'warehouseId', 'quantity', 'type', 'reason'
      ]);
      
      if (!validation.isValid) {
        return ApiResponse.badRequest(res, 'Datos incompletos', validation.errors);
      }
      
      // Validar tipo
      if (!['in', 'out'].includes(type)) {
        return ApiResponse.badRequest(res, 'Tipo de movimiento inválido');
      }
      
      // Validar cantidad
      if (quantity <= 0) {
        return ApiResponse.badRequest(res, 'La cantidad debe ser mayor a 0');
      }
      
      await InventoryModel.updateStock(productId, warehouseId, quantity, type, reason);
      
      return ApiResponse.success(res, 'Stock actualizado correctamente');
    } catch (error) {
      logger.error(`Error al actualizar stock: ${error.message}`);
      return ApiResponse.serverError(res, 'Error al actualizar stock');
    }
  }
}

module.exports = InventoryController;
```

#### 3. Rutas (src/routes/inventoryRoutes.js)
```javascript
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const InventoryController = require('../controllers/inventoryController');

// Middleware de autenticación
router.use(verifyToken);

/**
 * @route GET /api/inventory
 * @desc Obtener inventario
 * @access Privado
 */
router.get('/', InventoryController.getAll);

/**
 * @route POST /api/inventory/stock/update
 * @desc Actualizar stock
 * @access Privado
 */
router.post('/stock/update', InventoryController.updateStock);

module.exports = router;
```

#### 4. Integración en index.js
```javascript
// Importar ruta
const inventoryRoutes = require('./src/routes/inventoryRoutes');

// Usar ruta
app.use('/api/inventory', inventoryRoutes);
```

Esta documentación proporciona una guía completa para entender y extender el sistema contable, incluyendo todos los componentes, patrones de diseño, y ejemplos prácticos de implementación.