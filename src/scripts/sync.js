'use strict';

const { sequelize } = require('../config/database');
const { connectDatabase, closeDatabase } = require('../config/database');

async function main() {
  const alter = process.argv.includes('--alter');

  try {
    await connectDatabase();
    await sequelize.sync({ alter });
    console.log(`[DB] Esquema sincronizado${alter ? ' (alter)' : ''}.`);
    const tablas = await sequelize.getQueryInterface().showAllTables();
    console.log('[DB] Tablas:', tablas.join(', '));
  } catch (error) {
    console.error('[DB] Error al sincronizar:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
