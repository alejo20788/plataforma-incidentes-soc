require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/logger');
const { PrismaClient } = require('@prisma/client');
const path = require('node:path');
const { uploadEvidence, evidenceErrorHandler } = require('./src/middleware/evidencias');
const { verificarToken, verificarRol } = require('./src/middleware/auth');
const { login, listar, crear, actualizar, eliminar, descargarEvidencia } = require('./src/controllers/incidentes.controller');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || !process.env.ADMIN_PASSWORD_HASH || !process.env.ANALISTA_PASSWORD_HASH || !process.env.DATABASE_URL) {
  console.error('Configura DATABASE_URL, JWT_SECRET (mínimo 32 caracteres), ADMIN_PASSWORD_HASH y ANALISTA_PASSWORD_HASH en .env');
  process.exit(1);
}
const app = express();
const healthPrisma = new PrismaClient();
app.disable('x-powered-by');
app.use(requestLogger);
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(x => x.trim());
app.use(helmet());
app.use(cors({ origin(origin, cb) { cb(null, !origin || allowedOrigins.includes(origin)); }, methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '32kb' }));
// Publicar únicamente archivos web, nunca .env, Prisma o evidencias.
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'index.html')));
for (const folder of ['js','css','assets']) app.use('/'+folder, express.static(path.join(__dirname, folder), {dotfiles:'deny'}));
// Liveness y readiness. No exponen secretos ni datos de los incidentes.
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'incidentes', version: '1.1.0' }));
app.get('/api/ready', async (_req, res) => {
  try {
    await healthPrisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ready', database: 'ok' });
  } catch (_err) {
    return res.status(503).json({ status: 'unavailable', database: 'error' });
  }
});
app.post('/api/login', login);
app.get('/api/incidentes', verificarToken, listar);
app.post('/api/incidentes', verificarToken, verificarRol(['ANALISTA','ADMINISTRADOR']), uploadEvidence, crear);
app.put('/api/incidentes/:id', verificarToken, verificarRol(['ANALISTA','ADMINISTRADOR']), uploadEvidence, actualizar);
app.get('/api/incidentes/:id/evidencia', verificarToken, descargarEvidencia);
app.delete('/api/incidentes/:id', verificarToken, verificarRol(['ADMINISTRADOR']), eliminar);
app.use(evidenceErrorHandler);
app.use(errorHandler);
app.listen(PORT, () => console.log(`Servidor seguro SOC ejecutándose en http://localhost:${PORT}`));
