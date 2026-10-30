'use strict';

const { Rol } = require('../models');

async function listar(req, res) {
  const roles = await Rol.findAll({
    attributes: ['id_rol', 'nombre_rol'],
    order: [['id_rol', 'ASC']]
  });
  return res.success(roles, 'Roles obtenidos correctamente.');
}

module.exports = { listar };
