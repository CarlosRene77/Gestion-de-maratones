'use strict';

const { connectDatabase, closeDatabase } = require('../config/database');
const { seedBase } = require('./base');
const { seedDemo } = require('./demo');

async function main() {
  const conDemo = process.argv.includes('--demo');

  try {
    await connectDatabase();
    await seedBase();

    if (conDemo) {
      await seedDemo();
    }

    console.log('[SEED] Proceso finalizado correctamente.');
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
