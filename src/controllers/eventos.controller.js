'use strict';

const eventosService = require('../services/eventos.service');

function puedeVerTodo(req) {
  return ['admin', 'staff'].includes(req.rol);
}

async function listar(req, res) {
  const { data, meta } = await eventosService.listarEventos(req.query, {
    esAdmin: puedeVerTodo(req)
  });
  return res.success(data, 'Eventos obtenidos correctamente.', meta);
}

async function obtener(req, res) {
  const data = await eventosService.obtenerEvento(req.params.id, {
    esAdmin: puedeVerTodo(req)
  });
  return res.success(data, 'Evento obtenido correctamente.');
}

async function crear(req, res) {
  const data = await eventosService.crearEvento(req.body);
  return res.created(data, 'Evento creado correctamente.');
}

async function actualizar(req, res) {
  const data = await eventosService.actualizarEvento(req.params.id, req.body);
  return res.success(data, 'Evento actualizado correctamente.');
}

async function cambiarEstado(req, res) {
  const data = await eventosService.cambiarEstadoEvento(req.params.id, req.body.estado);
  return res.success(data, 'Estado del evento actualizado.');
}

async function eliminar(req, res) {
  const data = await eventosService.eliminarEvento(req.params.id);
  return res.success(data, 'Evento eliminado correctamente.');
}

async function estadisticas(req, res) {
  const data = await eventosService.obtenerEstadisticasEvento(req.params.id);
  return res.success(data, 'Estadisticas del evento obtenidas correctamente.');
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  estadisticas
};
