'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Rol extends Model {
    static associate(models) {
      Rol.hasMany(models.Usuario, {
        foreignKey: 'id_rol',
        as: 'usuarios',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }

  Rol.init(
    {
      id_rol: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      nombre_rol: {
        type: DataTypes.ENUM('admin', 'staff', 'corredor'),
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'Rol',
      tableName: 'roles'
    }
  );

  return Rol;
};
