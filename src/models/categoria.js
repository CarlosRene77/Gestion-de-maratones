'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.belongsTo(models.Evento, {
        foreignKey: 'id_evento',
        as: 'evento',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Categoria.hasMany(models.Inscripcion, {
        foreignKey: 'id_categoria',
        as: 'inscripciones',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }

  Categoria.init(
    {
      id_categoria: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      id_evento: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'eventos', key: 'id_evento' }
      },
      nombre_cat: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      distancia_km: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false
      },
      cupo_maximo: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      edad_minima: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true
      },
      edad_maxima: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true
      },
      genero: {
        type: DataTypes.ENUM('M', 'F', 'Mixto'),
        allowNull: false,
        defaultValue: 'Mixto'
      }
    },
    {
      sequelize,
      modelName: 'Categoria',
      tableName: 'categorias',
      indexes: [
        { fields: ['id_evento'] },
        { unique: true, fields: ['id_evento', 'nombre_cat', 'genero'] }
      ]
    }
  );

  return Categoria;
};
