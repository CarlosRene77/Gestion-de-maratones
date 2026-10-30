'use strict';

const kitsService = require('../services/kits.service');

async function entregar(req, res) {
  const data = await kitsService.entregarKit(req.body, req.user.id_usuario);
  return res.success(data, 'Kit y dorsal entregados correctamente.');
}

async function listar(req, res) {
  const { data, meta } = await kitsService.listarKits(req.query);
  return res.success(data, 'Kits obtenidos correctamente.', meta);
}

async function obtener(req, res) {
  const data = await kitsService.obtenerKit(req.params.idInscripcion);
  return res.success(data, 'Kit obtenido correctamente.');
}

module.exports = { entregar, listar, obtener };
