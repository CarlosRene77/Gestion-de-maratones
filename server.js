'use strict';

const app = require('./src/app');
const env = require('./src/config/env');
const { connectDatabase, closeDatabase } = require('./src/config/database');
const { seedBase } = require('./src/seeders');

let server;

async function start() {
  try {
    await connectDatabase();
    console.log(`[DB] Conexion establecida (${env.db.dialect}).`);

    if (!env.isProduction && process.env.SEED_ON_START !== 'false') {
      const resultado = await seedBase({ silent: true });
      console.log(`[SEED] Roles verificados: ${resultado.roles.join(', ')}.`);
    }

    server = app.listen(env.port, () => {
      console.log('');
      console.log('  MarathonHub API');
      console.log(`  Entorno:    ${env.nodeEnv}`);
      console.log(`  API:        http://localhost:${env.port}/api`);
      console.log(`  Swagger:    http://localhost:${env.port}/api-docs`);
      console.log(`  Salud:      http://localhost:${env.port}/health`);
      console.log('');
    });
  } catch (error) {
    console.error('[FATAL] No fue posible iniciar la API:', error.message);
    if (env.db.dialect === 'mysql') {
      console.error('Verifique que MySQL este en ejecucion y que las credenciales del archivo .env sean correctas.');
    }
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`\n[${signal}] Cerrando servidor...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('[UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

start();
