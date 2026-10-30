'use strict';

require('dotenv').config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'si', 'on'].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || 'development';
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: toInt(process.env.PORT, 3000),

  db: {
    dialect,
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'db_maraton_hub',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: toBool(process.env.DB_LOGGING, false),
    sync: toBool(process.env.DB_SYNC, true)
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'maraton_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  security: {
    bcryptSaltRounds: Math.max(10, toInt(process.env.BCRYPT_SALT_ROUNDS, 10)),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
    rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 30000),
    authRateLimitMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20)
  },

  seed: {
    adminNombre: process.env.ADMIN_NOMBRE || 'Administrador',
    adminApellido: process.env.ADMIN_APELLIDO || 'MarathonHub',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@marathonhub.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!'
  }
};

if (env.isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'maraton_secret_key_2026') {
    throw new Error('JWT_SECRET debe configurarse con un valor seguro en produccion.');
  }
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD es obligatorio en produccion.');
  }
}

module.exports = env;
