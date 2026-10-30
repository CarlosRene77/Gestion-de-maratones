'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Dorsal extends Model {
    static associate(models) {
      Dorsal.belongsTo(models.Inscripcion, {
        foreignKey: 'id_inscripcion',
        as: 'inscripcion',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Dorsal.hasMany(models.TiempoCheckpoint, {
        foreignKey: 'id_dorsal',
        as: 'tiempos',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }

  Dorsal.init(
    {
      id_dorsal: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      id_inscripcion: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'inscripciones', key: 'id_inscripcion' }
      },
      numero_dorsal: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true
      },
      chip_code: {
        type: DataTypes.STRING(60),
        allowNull: true,
        unique: true
      },
      estado_kit: {
        type: DataTypes.ENUM('pendiente', 'entregado'),
        allowNull: false,
        defaultValue: 'pendiente'
      }
    },
    {
      sequelize,
      modelName: 'Dorsal',
      tableName: 'dorsales',
      indexes: [
        { unique: true, fields: ['id_inscripcion'] },
        { unique: true, fields: ['numero_dorsal'] },
        { unique: true, fields: ['chip_code'] },
        { fields: ['estado_kit'] }
      ]
    }
  );

  return Dorsal;
};
