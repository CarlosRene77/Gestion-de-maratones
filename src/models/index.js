'use strict';

const { DataTypes, Op, fn, col, literal, where, Transaction } = require('sequelize');
const { sequelize, connectDatabase, closeDatabase } = require('../config/database');

const models = {
  sequelize,
  DataTypes,
  Op,
  fn,
  col,
  literal,
  where,
  Transaction,
  connectDatabase,
  closeDatabase
};

models.Rol = require('./rol')(sequelize, DataTypes);
models.Usuario = require('./usuario')(sequelize, DataTypes);
models.Evento = require('./evento')(sequelize, DataTypes);
models.Categoria = require('./categoria')(sequelize, DataTypes);
models.Inscripcion = require('./inscripcion')(sequelize, DataTypes);
models.Dorsal = require('./dorsal')(sequelize, DataTypes);
models.TiempoCheckpoint = require('./tiempoCheckpoint')(sequelize, DataTypes);

Object.values(models).forEach((model) => {
  if (typeof model?.associate === 'function') {
    model.associate(models);
  }
});

module.exports = models;
