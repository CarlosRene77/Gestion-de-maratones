'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Evento extends Model {
    static associate(models) {
      Evento.hasMany(models.Categoria, {
        foreignKey: 'id_evento',
        as: 'categorias',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }

  Evento.init(
    {
      id_evento: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      nombre_evento: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      fecha_evento: {
        type: DataTypes.DATE,
        allowNull: false
      },
      ciudad: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      lugar_salida: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      estado: {
        type: DataTypes.ENUM('borrador', 'publicado', 'en_curso', 'finalizado'),
        allowNull: false,
        defaultValue: 'borrador'
      },
      imagen_banner: {
        type: DataTypes.STRING(500),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Evento',
      tableName: 'eventos',
      indexes: [
        { fields: ['estado'] },
        { fields: ['fecha_evento'] },
        { fields: ['ciudad'] }
      ]
    }
  );

  return Evento;
};
