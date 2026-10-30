'use strict';

const bcrypt = require('bcryptjs');
const { Rol, Usuario } = require('../models');
const env = require('../config/env');

const ROLES = ['admin', 'staff', 'corredor'];

async function seedBase({ silent = false } = {}) {
  const roles = [];

  for (const nombreRol of ROLES) {
    const [rol] = await Rol.findOrCreate({
      where: { nombre_rol: nombreRol },
      defaults: { nombre_rol: nombreRol }
    });
    roles.push(rol);
  }

  const rolAdmin = roles.find((rol) => rol.nombre_rol === 'admin');
  const email = env.seed.adminEmail.trim().toLowerCase();

  const [admin, creado] = await Usuario.unscoped().findOrCreate({
    where: { email },
    defaults: {
      id_rol: rolAdmin.id_rol,
      nombre: env.seed.adminNombre,
      apellido: env.seed.adminApellido,
      email,
      password_hash: await bcrypt.hash(env.seed.adminPassword, env.security.bcryptSaltRounds),
      modo_oscuro_pref: false,
      estado_cuenta: 'activo'
    }
  });

  if (!creado && Number(admin.id_rol) !== Number(rolAdmin.id_rol)) {
    admin.id_rol = rolAdmin.id_rol;
    await admin.save();
  }

  if (!silent) {
    console.log('[SEED] Roles base verificados:', roles.map((rol) => rol.nombre_rol).join(', '));
    console.log(`[SEED] Administrador ${creado ? 'creado' : 'verificado'}: ${email}`);
    if (creado) {
      console.log(`[SEED] Contrasena inicial: ${env.seed.adminPassword}`);
      console.log('[SEED] Cambie esta contrasena despues del primer inicio de sesion.');
    }
  }

  return {
    roles: roles.map((rol) => rol.nombre_rol),
    adminCreado: creado,
    adminEmail: email
  };
}

module.exports = { seedBase, ROLES };
