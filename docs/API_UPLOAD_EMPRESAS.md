# 📁 API de Upload de Archivos - Empresas

## Descripción General

Esta documentación describe las APIs para manejar la subida, obtención y eliminación de logos de empresas en el sistema contable.

## 🔧 Configuración

### Middlewares Utilizados
- **Multer**: Para manejo de archivos multipart/form-data
- **Auth**: Verificación de token JWT
- **Error Handler**: Manejo específico de errores de multer

### Límites y Restricciones
- **Tamaño máximo**: 5MB para imágenes
- **Tipos permitidos**: JPG, JPEG, PNG, GIF, WEBP, SVG
- **Ubicación**: `uploads/companies/logos/`
- **Nomenclatura**: `company_logo_{timestamp}_{random}.ext`

---

## 📋 Endpoints

### 1. Crear Empresa (con logo opcional)

```http
POST /api/companies
```

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (Form Data):**
```javascript
{
  name: "string" (required),
  legal_name: "string" (required),
  tax_id: "string" (required),
  identification_type: "string" (required),
  identification_number: "string" (required),
  verification_digit: "string" (required),
  fiscal_year_start: "date" (required),
  currency_id: "number" (required),
  address: "string" (optional),
  phone: "string" (optional),
  email: "string" (optional),
  website: "string" (optional),
  logo: "file" (optional) // Archivo de imagen
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Mi Empresa",
    "legal_name": "Mi Empresa S.A.S.",
    "logo_path": "uploads/companies/logos/company_logo_1703123456789_123456789.png",
    "... otros campos ..."
  },
  "message": "Empresa creada correctamente"
}
```

**Errores Posibles:**
- `400`: Archivo demasiado grande, tipo no permitido, campos requeridos faltantes
- `401`: Token inválido
- `500`: Error interno del servidor

---

### 2. Actualizar Empresa (con logo opcional)

```http
PUT /api/companies/{id}
```

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Parámetros URL:**
- `id` (number): ID de la empresa

**Body (Form Data):**
```javascript
{
  // Campos de empresa (iguales al crear)
  logo: "file" (optional) // Si se envía, reemplaza el logo actual
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "logo_path": "uploads/companies/logos/company_logo_1703123456789_987654321.png",
    "... otros campos ..."
  },
  "message": "Empresa actualizada correctamente"
}
```

---

### 3. Subir/Actualizar Solo el Logo

```http
POST /api/companies/{id}/logo
```

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Parámetros URL:**
- `id` (number): ID de la empresa

**Body (Form Data):**
```javascript
{
  logo: "file" (required) // Archivo de imagen
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "logo_path": "uploads/companies/logos/company_logo_1703123456789_555555555.png",
    "logo_url": "/uploads/companies/logos/company_logo_1703123456789_555555555.png"
  },
  "message": "Logo subido correctamente"
}
```

**Errores Específicos:**
- `400`: No se subió archivo, archivo inválido
- `404`: Empresa no encontrada

---

### 4. Obtener Logo de Empresa

```http
GET /api/companies/{id}/logo
```

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` (number): ID de la empresa

**Respuesta Exitosa (200):**
```
Content-Type: image/* (según el tipo de imagen)
[Archivo binario de la imagen]
```

**Errores Específicos:**
- `404`: Empresa no encontrada, empresa sin logo, archivo no existe

---

### 5. Eliminar Logo de Empresa

```http
DELETE /api/companies/{id}/logo
```

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros URL:**
- `id` (number): ID de la empresa

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Logo eliminado correctamente"
}
```

**Errores Específicos:**
- `400`: La empresa no tiene logo
- `404`: Empresa no encontrada

---

## 🔍 Ejemplos de Uso

### Ejemplo con JavaScript (Axios)

```javascript
// 1. Crear empresa con logo
const formData = new FormData();
formData.append('name', 'Mi Empresa');
formData.append('legal_name', 'Mi Empresa S.A.S.');
formData.append('tax_id', '900123456-1');
formData.append('identification_type', 'NIT');
formData.append('identification_number', '900123456');
formData.append('verification_digit', '1');
formData.append('fiscal_year_start', '2024-01-01');
formData.append('currency_id', '1');
formData.append('logo', fileInput.files[0]); // Archivo del input

const response = await axios.post('/api/companies', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});

// 2. Subir logo a empresa existente
const logoFormData = new FormData();
logoFormData.append('logo', fileInput.files[0]);

await axios.post(`/api/companies/${companyId}/logo`, logoFormData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});

// 3. Obtener logo (para mostrar en UI)
const logoResponse = await axios.get(`/api/companies/${companyId}/logo`, {
  headers: { 'Authorization': `Bearer ${token}` },
  responseType: 'blob'
});

const logoUrl = URL.createObjectURL(logoResponse.data);
```

### Ejemplo con cURL

```bash
# Crear empresa con logo
curl -X POST http://localhost:3004/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Mi Empresa" \
  -F "legal_name=Mi Empresa S.A.S." \
  -F "tax_id=900123456-1" \
  -F "identification_type=NIT" \
  -F "identification_number=900123456" \
  -F "verification_digit=1" \
  -F "fiscal_year_start=2024-01-01" \
  -F "currency_id=1" \
  -F "logo=@/path/to/logo.png"

# Subir logo
curl -X POST http://localhost:3004/api/companies/1/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/new-logo.png"

# Obtener logo
curl -X GET http://localhost:3004/api/companies/1/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o company-logo.png

# Eliminar logo
curl -X DELETE http://localhost:3004/api/companies/1/logo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Consideraciones Importantes

### Seguridad
- Todos los endpoints requieren autenticación
- Validación estricta de tipos de archivo
- Límites de tamaño para prevenir ataques
- Nombres de archivo únicos para evitar conflictos

### Rendimiento
- Los archivos se almacenan localmente en disco
- URLs de acceso directo para mejor rendimiento
- Limpieza automática de archivos huérfanos

### Manejo de Errores
- Limpieza automática de archivos en caso de error
- Mensajes descriptivos para cada tipo de error
- Logs detallados para debugging

### Estructura de Archivos
```
uploads/
└── companies/
    └── logos/
        ├── company_logo_1703123456789_123456789.png
        ├── company_logo_1703123456790_987654321.jpg
        └── ...
```

---

## 🧪 Testing

Para probar el sistema, ejecutar:

```bash
# Instalar dependencias adicionales para testing
npm install form-data

# Ejecutar script de prueba
node test_file_upload.js
```

El script de prueba validará:
- ✅ Creación de empresa sin logo
- ✅ Creación de empresa con logo
- ✅ Subida de logo a empresa existente
- ✅ Obtención de logo
- ✅ Eliminación de logo
- ✅ Limpieza de datos de prueba

---

## 🔄 Estados y Flujos

### Flujo de Creación con Logo
1. Usuario selecciona archivo
2. Frontend valida archivo (tamaño, tipo)
3. Envío con FormData a `/api/companies`
4. Backend valida archivo con multer
5. Archivo se guarda en disco
6. Path se guarda en base de datos
7. Respuesta incluye datos de empresa y logo

### Flujo de Actualización de Logo
1. Usuario selecciona nuevo archivo
2. Envío a `/api/companies/{id}/logo`
3. Sistema elimina logo anterior
4. Nuevo logo se guarda
5. Base de datos se actualiza
6. Respuesta confirma cambio

### Flujo de Eliminación
1. Petición DELETE a `/api/companies/{id}/logo`
2. Sistema elimina archivo físico
3. Campo logo_path se establece a NULL
4. Confirmación de eliminación 