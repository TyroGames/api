// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./src/config/db');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./src/utils/logger');
const compression = require('compression');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const accountingRoutes = require('./src/routes/Contabilidad/General/Cuentas_Contables/accountingRoutes');
const journalEntryRoutes = require('./src/routes/Contabilidad/General/Asientos_Contables/journalEntryRoutes');
const voucherRoutes = require('./src/routes/Contabilidad/General/Comprobantes_Contables/voucherRoutes');
const documentTypeRoutes = require('./src/routes/Contabilidad/General/Comprobantes_Contables/documentTypeRoutes');
const legalDocumentRoutes = require('./src/routes/Contabilidad/General/Documentos_Legales/legalDocumentRoutes');
const thirdPartyRoutes = require('./src/routes/Contabilidad/General/Terceros/thirdPartyRoutes');
const companyRoutes = require('./src/routes/Configuracion/Empresa/companyRoutes');
const currencyRoutes = require('./src/routes/Configuracion/currencyRoutes');
const company_offices_Routes = require('./src/routes/Configuracion/Empresa/Oficina/company_offices_Routes');
// Importar nuevas rutas de roles y usuarios
const roleRoutes = require('./src/routes/Configuracion/roleRoutes');
const userRoutes = require('./src/routes/Configuracion/userRoutes');
// Importar rutas de módulos
const moduleRoutes = require('./src/routes/Configuracion/moduleRoutes');
// Importar rutas de libros contables
const bookRoutes = require('./src/routes/Contabilidad/General/Libros_Contables/bookRoutes');
// Importar rutas de períodos fiscales
const fiscalYearRoutes = require('./src/routes/Contabilidad/General/Periodos_Fiscales/fiscalYearRoutes');
const fiscalPeriodRoutes = require('./src/routes/Contabilidad/General/Periodos_Fiscales/fiscalPeriodRoutes');
// Importar rutas de tesorería
const treasuryRoutes = require('./src/routes/Contabilidad/Tesoreria/treasuryRoutes');

// Importar rutas de créditos hipotecarios
const creditRoutes = require('./src/routes/Creditos/index');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3004;

// Configuración de middleware
app.use(cors());
app.use(compression());
app.use(morgan(':method :url :status', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Verificar conexión a la base de datos
testConnection()
  .then(connected => {
    if (!connected) {
      logger.error('No se pudo conectar a la base de datos. Verifique la configuración.');
      process.exit(1);
    } else {
      logger.info('Conexión a la base de datos establecida correctamente');
    }
  })
  .catch(err => {
    logger.error(`Error al verificar la conexión a la base de datos: ${err.message}`);
    process.exit(1);
  });

// Rutas base
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema Contable v1.0' });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/accounting/journal-entries', journalEntryRoutes);
app.use('/api/accounting/vouchers', voucherRoutes);
app.use('/api/accounting/document-types', documentTypeRoutes);
app.use('/api/accounting/legal-documents', legalDocumentRoutes);
app.use('/api/accounting/third-parties', thirdPartyRoutes);
app.use('/api/accounting/fiscal-years', fiscalYearRoutes);
app.use('/api/accounting/fiscal-periods', fiscalPeriodRoutes);
// Rutas para tesorería y bancos
app.use('/api/tesoreria', treasuryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/offices', company_offices_Routes);
app.use('/api/configuration/currencies', currencyRoutes);
// Nuevas rutas para roles y usuarios
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// Rutas para módulos del sistema
app.use('/api/modules', moduleRoutes);
// Rutas para libros contables
app.use('/api/contabilidad/libros-contables', bookRoutes);

// Rutas para créditos hipotecarios
app.use('/api/credits', creditRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error(`Error interno del servidor: ${err.stack}`);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Manejo de eventos Socket.io
io.on('connection', (socket) => {
  logger.debug(`Usuario conectado: ${socket.id}`);

  // Evento para unirse a una sala específica (por ejemplo, para notificaciones de asientos contables)
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.debug(`Socket ${socket.id} se unió a la sala: ${room}`);
  });

  // Evento de desconexión
  socket.on('disconnect', () => {
    logger.debug(`Usuario desconectado: ${socket.id}`);
  });
});

// Exportar io para poder usarlo en otros archivos
app.set('io', io);

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`Servidor ejecutándose en http://localhost:${PORT}`);
});
