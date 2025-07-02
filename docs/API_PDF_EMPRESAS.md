# 📄 API de Generación de PDFs - Empresas

## Descripción General

Esta documentación describe las APIs para generar documentos PDF con información empresarial del sistema contable. Los PDFs se generan en formato carta (Letter) con diseño profesional y elegante.

## 🔧 Tecnologías Utilizadas

- **PDFKit**: Biblioteca principal para generación de PDFs
- **Express**: Framework del servidor
- **JWT**: Autenticación mediante tokens
- **MySQL**: Base de datos para información empresarial

## 🎨 Características del PDF

### Diseño y Formato
- **Formato**: Carta (Letter) 8.5" x 11"
- **Márgenes**: 50px en todos los lados
- **Fuentes**: Helvetica (regular y bold)
- **Colores**: Esquema corporativo moderno
- **Diseño**: Profesional con secciones organizadas

### Contenido del PDF
- **Encabezado**: Logo empresarial (si existe) + nombre de empresa
- **Información General**: ID, identificación, datos fiscales
- **Información de Contacto**: Dirección, teléfono, email, sitio web
- **Información Fiscal**: Moneda, fechas de registro y actualización
- **Pie de página**: Información del sistema y fecha de generación

---

## 📋 Endpoints Disponibles

### 1. Generar PDF Individual (Descarga)

```http
GET /api/companies/:id/pdf
```

**Descripción**: Genera y descarga un PDF con la información completa de una empresa específica.

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros:**
- `id` (path): ID de la empresa

**Respuesta Exitosa:**
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="empresa_NombreEmpresa_2024-01-15.pdf"`
- **Body**: Archivo PDF binario

**Ejemplo de uso:**
```javascript
// JavaScript/Axios
const response = await axios.get('/api/companies/1/pdf', {
  headers: { 'Authorization': 'Bearer ' + token },
  responseType: 'blob'
});

// Crear enlace de descarga
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'empresa.pdf');
document.body.appendChild(link);
link.click();
```

**Códigos de Estado:**
- `200`: PDF generado exitosamente
- `404`: Empresa no encontrada
- `401`: Token inválido o expirado
- `500`: Error interno del servidor

---

### 2. Preview de PDF (Vista en Navegador)

```http
GET /api/companies/:id/pdf/preview
```

**Descripción**: Genera un PDF para mostrar directamente en el navegador (sin descarga).

**Headers:**
```http
Authorization: Bearer {token}
```

**Parámetros:**
- `id` (path): ID de la empresa

**Respuesta Exitosa:**
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `inline`
- **Body**: Archivo PDF binario

**Ejemplo de uso:**
```javascript
// Mostrar en iframe
<iframe 
  src="/api/companies/1/pdf/preview" 
  width="100%" 
  height="600px">
</iframe>

// O abrir en nueva ventana
window.open('/api/companies/1/pdf/preview', '_blank');
```

**Códigos de Estado:**
- `200`: PDF generado exitosamente
- `404`: Empresa no encontrada
- `401`: Token inválido o expirado
- `500`: Error interno del servidor

---

### 3. PDF de Listado de Empresas

```http
GET /api/companies/pdf/list
```

**Descripción**: Genera un PDF con el listado de todas las empresas registradas.

**Headers:**
```http
Authorization: Bearer {token}
```

**Query Parameters (Opcionales):**
- `name`: Filtrar por nombre de empresa
- `tax_id`: Filtrar por ID fiscal
- `currency_id`: Filtrar por moneda

**Respuesta Exitosa:**
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="listado_empresas_2024-01-15.pdf"`
- **Body**: Archivo PDF binario

**Ejemplo de uso:**
```javascript
// Sin filtros
const response = await axios.get('/api/companies/pdf/list', {
  headers: { 'Authorization': 'Bearer ' + token },
  responseType: 'blob'
});

// Con filtros
const response = await axios.get('/api/companies/pdf/list?name=Acme&currency_id=1', {
  headers: { 'Authorization': 'Bearer ' + token },
  responseType: 'blob'
});
```

**Códigos de Estado:**
- `200`: PDF generado exitosamente
- `404`: No se encontraron empresas
- `401`: Token inválido o expirado
- `500`: Error interno del servidor

---

## 🎯 Casos de Uso

### 1. **Perfil Empresarial Completo**
Generar documento oficial con toda la información de una empresa para:
- Presentaciones comerciales
- Documentación legal
- Archivos corporativos
- Reportes administrativos

### 2. **Vista Previa Rápida**
Mostrar información empresarial sin necesidad de descarga para:
- Verificación de datos
- Consultas rápidas
- Validación de información

### 3. **Listado Corporativo**
Generar reportes con múltiples empresas para:
- Inventario de empresas
- Reportes gerenciales
- Documentación del sistema
- Auditorías

---

## 🔒 Seguridad

### Autenticación Requerida
Todos los endpoints requieren autenticación JWT válida:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Validaciones
- **Existencia de empresa**: Se valida que la empresa exista antes de generar PDF
- **Permisos**: Se verifican los permisos del usuario autenticado
- **Límites**: Se aplican límites de tamaño y tiempo de generación

### Manejo de Errores
- **404**: Recursos no encontrados
- **401**: Credenciales inválidas
- **500**: Errores del servidor con logs detallados

---

## 📊 Estructura del PDF Generado

### Encabezado (Header)
```
┌─────────────────────────────────────────────────────┐
│ Banda Azul Corporativa                               │
├─────────────────────────────────────────────────────┤
│ [LOGO]  NOMBRE DE LA EMPRESA                        │
│         Razón Social                                │
└─────────────────────────────────────────────────────┘
```

### Información General
```
INFORMACIÓN GENERAL
├── ID de Empresa: 1
├── Tipo de Identificación: NIT
├── Número de Identificación: 900123456
├── Dígito de Verificación: 7
├── NIT/ID Fiscal: 900123456-7
└── Inicio Año Fiscal: 01/01/2024
```

### Información de Contacto
```
INFORMACIÓN DE CONTACTO
┌─────────────────────────────────────────────────────┐
│ 📍 Dirección: Calle 123 #45-67, Bogotá            │
│ 📞 Teléfono: +57 1 234 5678                        │
│ ✉️  Email: contacto@empresa.com                     │
│ 🌐 Sitio Web: https://www.empresa.com              │
└─────────────────────────────────────────────────────┘
```

### Información Fiscal
```
INFORMACIÓN FISCAL Y FINANCIERA
├── Moneda Predeterminada: Peso Colombiano (COP)
├── Fecha de Registro: 15/01/2024
└── Última Actualización: 15/01/2024
```

### Pie de Página (Footer)
```
────────────────────────────────────────────────────────
Documento generado por Sistema Contable
Generado el: 15/01/2024 a las 14:30:25     Página 1 de 1
```

---

## 🚀 Ejemplos de Integración

### React/Frontend
```jsx
import React from 'react';
import { Button } from 'antd';
import { FilePdfOutlined, EyeOutlined } from '@ant-design/icons';

const CompanyActions = ({ companyId }) => {
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/pdf`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `empresa_${companyId}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  const handlePreviewPDF = () => {
    const url = `/api/companies/${companyId}/pdf/preview`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <Button 
        icon={<FilePdfOutlined />} 
        onClick={handleDownloadPDF}
      >
        Descargar PDF
      </Button>
      <Button 
        icon={<EyeOutlined />} 
        onClick={handlePreviewPDF}
      >
        Ver PDF
      </Button>
    </div>
  );
};
```

### Node.js/Backend
```javascript
const express = require('express');
const axios = require('axios');

app.get('/download-company-pdf/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `http://localhost:3004/api/companies/${req.params.id}/pdf`,
      {
        headers: { 'Authorization': req.headers.authorization },
        responseType: 'stream'
      }
    );
    
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});
```

---

## 🛠️ Personalización

### Colores Corporativos
```javascript
const colors = {
  primary: '#1890ff',    // Azul principal
  secondary: '#f0f2f5',  // Gris claro
  accent: '#52c41a',     // Verde acentuado
  text: '#262626',       // Texto principal
  lightText: '#8c8c8c',  // Texto secundario
  border: '#d9d9d9'      // Bordes
};
```

### Fuentes Disponibles
- `Helvetica`: Fuente principal
- `Helvetica-Bold`: Para títulos y énfasis
- `Helvetica-Oblique`: Para textos en cursiva

### Tamaños de Página Soportados
- `LETTER`: 8.5" x 11" (por defecto)
- `A4`: 210mm x 297mm
- `LEGAL`: 8.5" x 14"

---

## 📝 Logs y Monitoreo

### Eventos Registrados
- Generación exitosa de PDFs
- Errores durante la generación
- Tiempo de generación
- Tamaño de archivos generados

### Ejemplo de Logs
```
[2024-01-15 14:30:25] INFO: PDF generado exitosamente para empresa 1: Acme Corporation
[2024-01-15 14:30:26] INFO: PDF de listado de empresas generado: 5 empresas
[2024-01-15 14:30:27] ERROR: Error al generar PDF para empresa 999: Empresa no encontrada
```

---

## 🔧 Comandos de Prueba

### Ejecutar Pruebas
```bash
# Probar generación de PDFs
node test_pdf_generation.js

# Limpiar archivos de prueba
node test_pdf_generation.js --clean
```

### Ejemplo de Salida
```
🚀 Iniciando pruebas de generación de PDFs...

🔐 Obteniendo token de autenticación...
✅ Token obtenido exitosamente

📊 Obteniendo lista de empresas...
✅ 3 empresas encontradas

📄 Generando PDF para empresa: Acme Corporation (ID: 1)
✅ PDF generado exitosamente: empresa_Acme_Corporation_1.pdf
   Ubicación: /path/to/test_pdfs/empresa_Acme_Corporation_1.pdf
   Tamaño: 15420 bytes

🎉 ¡Todas las pruebas completadas exitosamente!
```

---

## 📋 Troubleshooting

### Problemas Comunes

#### 1. Error 404 - Empresa no encontrada
```json
{
  "success": false,
  "message": "Empresa con ID 999 no encontrada"
}
```
**Solución**: Verificar que el ID de empresa existe en la base de datos.

#### 2. Error 401 - Token inválido
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```
**Solución**: Renovar el token de autenticación.

#### 3. Error 500 - Error de generación
```json
{
  "success": false,
  "message": "Error al generar PDF",
  "error": "Cannot read property 'name' of undefined"
}
```
**Solución**: Verificar que la empresa tiene todos los campos requeridos.

### Verificar Dependencias
```bash
npm list pdfkit
npm list express
npm list jsonwebtoken
```

### Verificar Logs
```bash
tail -f logs/application.log | grep PDF
```

---

¡El sistema de generación de PDFs está listo para usar! 🚀 