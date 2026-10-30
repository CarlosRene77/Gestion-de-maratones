'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const openapiDocument = require('./docs/openapi');
const apiRoutes = require('./routes');
const { sequelize } = require('./models');
const { responseEnhancer } = require('./utils/response');
const { optionalAuth } = require('./middlewares/auth');
const { generalLimiter } = require('./middlewares/rateLimit');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const origenesPermitidos = String(env.security.corsOrigin)
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origenesPermitidos.includes('*') || origenesPermitidos.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ApiError(403, `Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400
}));

app.use(compression());
if (!env.isTest) app.use(morgan('dev'));

app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: false, limit: '512kb' }));

app.use(responseEnhancer);

// Documentacion interactiva (OpenAPI 3.0)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customSiteTitle: 'MarathonHub API - Documentacion',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true
  }
}));
app.get('/api-docs.json', (req, res) => res.json(openapiDocument));

// El tema del usuario se resuelve de forma opcional para todas las rutas.
app.use(optionalAuth);

app.get('/', (req, res) => {
  return res.success({
    nombre: 'MarathonHub API',
    version: '1.0.0',
    descripcion: 'API REST para la gestion integral de carreras, maratones y eventos deportivos.',
    documentacion: '/api-docs',
    openapi: '/api-docs.json',
    salud: '/health',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      roles: '/api/roles',
      eventos: '/api/eventos',
      categorias: '/api/categorias',
      inscripciones: '/api/inscripciones',
      kits: '/api/kits',
      cronometraje: '/api/cronometraje',
      resultados: '/api/resultados'
    }
  }, 'MarathonHub API en linea.');
});

app.get('/health', async (req, res, next) => {
  try {
    await sequelize.query('SELECT 1');
    return res.success({
      estado: 'ok',
      uptime_segundos: Math.round(process.uptime()),
      entorno: env.nodeEnv,
      base_datos: 'conectada',
      timestamp: new Date().toISOString()
    }, 'Servicio saludable.');
  } catch (error) {
    return next(new ApiError(503, 'El servicio no puede conectarse a la base de datos.', {
      code: 'DATABASE_UNAVAILABLE'
    }));
  }
});

app.use('/api', generalLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
