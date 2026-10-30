'use strict';

const cronometrajeService = require('../services/cronometraje.service');

async function marcar(req, res) {
  const data = await cronometrajeService.marcarTiempo(req.body, req.user.id_usuario);
  return res.created(data, 'Marcacion registrada correctamente.');
}

async function listarPorEvento(req, res) {
  const { data, meta } = await cronometrajeService.listarMarcaciones(
    req.params.idEvento,
    req.query
  );
  return res.success(data, 'Marcaciones del evento obtenidas correctamente.', meta);
}

async function obtenerPorDorsal(req, res) {
  const data = await cronometrajeService.obtenerMarcacionesPorDorsal(req.params.idDorsal);
  return res.success(data, 'Marcaciones del dorsal obtenidas correctamente.');
}

async function actualizar(req, res) {
  const data = await cronometrajeService.actualizarMarcacion(req.params.idTiempo, req.body);
  return res.success(data, 'Marcacion actualizada correctamente.');
}

async function eliminar(req, res) {
  const data = await cronometrajeService.eliminarMarcacion(req.params.idTiempo);
  return res.success(data, 'Marcacion eliminada correctamente.');
}

module.exports = { marcar, listarPorEvento, obtenerPorDorsal, actualizar, eliminar };
