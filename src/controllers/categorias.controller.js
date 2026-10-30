'use strict';

const categoriasService = require('../services/categorias.service');

async function crear(req, res) {
  const data = await categoriasService.crearCategoria(req.params.idEvento, req.body);
  return res.created(data, 'Categoria creada correctamente.');
}

async function listarPorEvento(req, res) {
  const data = await categoriasService.listarCategoriasEvento(req.params.idEvento, {
    esAdmin: ['admin', 'staff'].includes(req.rol)
  });
  return res.success(data, 'Categorias del evento obtenidas correctamente.');
}

async function obtener(req, res) {
  const data = await categoriasService.obtenerCategoria(req.params.id, {
    esAdmin: ['admin', 'staff'].includes(req.rol)
  });
  return res.success(data, 'Categoria obtenida correctamente.');
}

async function actualizar(req, res) {
  const data = await categoriasService.actualizarCategoria(req.params.id, req.body);
  return res.success(data, 'Categoria actualizada correctamente.');
}

async function eliminar(req, res) {
  const data = await categoriasService.eliminarCategoria(req.params.id);
  return res.success(data, 'Categoria eliminada correctamente.');
}

module.exports = { crear, listarPorEvento, obtener, actualizar, eliminar };
