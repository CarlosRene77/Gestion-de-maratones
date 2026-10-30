'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.belongsTo(models.Rol, {
        foreignKey: 'id_rol',
        as: 'rol',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Usuario.hasMany(models.Inscripcion, {
        foreignKey: 'id_usuario',
        as: 'inscripciones',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });

      Usuario.hasMany(models.TiempoCheckpoint, {
        foreignKey: 'id_staff_registro',
        as: 'tiempos_registrados',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }

    toPublicJSON() {
      const data = this.get({ plain: true });
      delete data.password_hash;
      return data;
    }
  }

  Usuario.init(
    {
      id_usuario: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      id_rol: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'roles', key: 'id_rol' }
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      telefono: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      contacto_emergencia: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      ficha_medica_json: {
        type: DataTypes.JSON,
        allowNull: true
      },
      modo_oscuro_pref: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      estado_cuenta: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      },
      // Campos adicionales necesarios para validar categorias por edad/genero (RF-02).
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      genero: {
        type: DataTypes.ENUM('M', 'F'),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'usuarios',
      defaultScope: {
        attributes: { exclude: ['password_hash'] }
      },
      indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['id_rol'] },
        { fields: ['estado_cuenta'] }
      ]
    }
  );

  return Usuario;
};
