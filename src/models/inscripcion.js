'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inscripcion extends Model {
    static associate(models) {
      Inscripcion.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario',
        as: 'usuario',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Inscripcion.belongsTo(models.Categoria, {
        foreignKey: 'id_categoria',
        as: 'categoria',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Inscripcion.hasOne(models.Dorsal, {
        foreignKey: 'id_inscripcion',
        as: 'dorsal',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }

  Inscripcion.init(
    {
      id_inscripcion: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      id_usuario: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id_usuario' }
      },
      id_categoria: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categorias', key: 'id_categoria' }
      },
      codigo_transaccion: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      estado_pago: {
        type: DataTypes.ENUM('pendiente', 'completado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      talla_camiseta: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      fecha_inscripcion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Inscripcion',
      tableName: 'inscripciones',
      indexes: [
        { fields: ['id_usuario'] },
        { fields: ['id_categoria'] },
        { fields: ['estado_pago'] },
        { unique: true, fields: ['id_usuario', 'id_categoria'] }
      ]
    }
  );

  return Inscripcion;
};
