'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TiempoCheckpoint extends Model {
    static associate(models) {
      TiempoCheckpoint.belongsTo(models.Dorsal, {
        foreignKey: 'id_dorsal',
        as: 'dorsal',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      TiempoCheckpoint.belongsTo(models.Usuario, {
        foreignKey: 'id_staff_registro',
        as: 'staff',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }

  TiempoCheckpoint.init(
    {
      id_tiempo: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      id_dorsal: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'dorsales', key: 'id_dorsal' }
      },
      nombre_punto: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      tiempo_marcado: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      id_staff_registro: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id_usuario' }
      }
    },
    {
      sequelize,
      modelName: 'TiempoCheckpoint',
      tableName: 'tiempos_checkpoints',
      indexes: [
        { unique: true, fields: ['id_dorsal', 'nombre_punto'] },
        { fields: ['nombre_punto'] },
        { fields: ['tiempo_marcado'] },
        { fields: ['id_staff_registro'] }
      ]
    }
  );

  return TiempoCheckpoint;
};
