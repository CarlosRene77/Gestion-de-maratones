'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');

const commonOptions = {
  logging: env.db.logging ? (msg) => console.log(`[SQL] ${msg}`) : false,
  define: {
    underscored: true,
    timestamps: true,
    freezeTableName: true
  }
};

let sequelize;

if (env.db.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.db.storage,
    ...commonOptions
  });
} else {
  sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    timezone: '+00:00',
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: false
    },
    ...commonOptions
  });
}

async function connectDatabase() {
  await sequelize.authenticate();
  if (env.db.sync) {
    await sequelize.sync();
  }
  return sequelize;
}

async function closeDatabase() {
  await sequelize.close();
}

module.exports = { sequelize, connectDatabase, closeDatabase };
