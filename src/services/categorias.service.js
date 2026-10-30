'use strict';

const {
  Categoria,
  Evento,
  Inscripcion,
  Op,
  fn,
  col
} = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Devuelve un mapa { id_categoria: ocupados } contando inscripciones no
 * canceladas. Una sola consulta evita el problema N+1.
 */
async function contarOcupados(idsCategorias, options = {}) {
  if (!idsCategorias.length) return new Map();

  const rows = await Inscripcion.findAll({
    attributes: [
      'id_categoria',
      [fn('COUNT', col('id_inscripcion')), 'ocupados']
    ],
    where: {
      id_categoria: { [Op.in]: idsCategorias },
      estado_pago: { [Op.ne]: 'cancelado' }
    },
    group: ['id_categoria'],
    raw: true,
    ...options
  });

  return new Map(rows.map((row) => [Number(row.id_categoria), Number(row.ocupados)]));
}

function serializarCategoria(categoria, ocupados = 0) {
  const plain = categoria?.get ? categoria.get({ plain: true }) : { ...categoria };
  const cupo = Number(plain.cupo_maximo) || 0;
  const usados = Number(ocupados) || 0;

  return {
    ...plain,
    distancia_km: plain.distancia_km === null ? null : Number(plain.distancia_km),
    precio: plain.precio === null ? null : Number(plain.precio),
    cupos_ocupados: usados,
    cupos_disponibles: Math.max(0, cupo - usados),
    porcentaje_ocupacion: cupo > 0 ? Math.round((usados / cupo) * 10000) / 100 : 0
  };
}

async function adjuntarCupos(categorias) {
  const ids = categorias.map((categoria) => categoria.id_categoria);
  const ocupados = await contarOcupados(ids);
  return categorias.map((categoria) => serializarCategoria(
    categoria,
    ocupados.get(Number(categoria.id_categoria)) || 0
  ));
}

async function crearCategoria(idEvento, payload) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('El evento indicado no existe.');

  if (
    payload.edad_minima !== undefined &&
    payload.edad_maxima !== undefined &&
    Number(payload.edad_minima) > Number(payload.edad_maxima)
  ) {
    throw ApiError.unprocessable('La edad minima no puede ser mayor que la edad maxima.');
  }

  const categoria = await Categoria.create({
    id_evento: evento.id_evento,
    nombre_cat: payload.nombre_cat,
    distancia_km: payload.distancia_km,
    cupo_maximo: payload.cupo_maximo,
    precio: payload.precio ?? 0,
    edad_minima: payload.edad_minima ?? null,
    edad_maxima: payload.edad_maxima ?? null,
    genero: payload.genero ?? 'Mixto'
  });

  return serializarCategoria(categoria, 0);
}

async function listarCategoriasEvento(idEvento, { esAdmin = false } = {}) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('Evento no encontrado.');
  if (!esAdmin && evento.estado === 'borrador') {
    throw ApiError.notFound('Evento no encontrado.');
  }

  const categorias = await Categoria.findAll({
    where: { id_evento: evento.id_evento },
    order: [['distancia_km', 'ASC'], ['nombre_cat', 'ASC']]
  });

  return adjuntarCupos(categorias);
}

async function obtenerCategoria(idCategoria, { esAdmin = false } = {}) {
  const categoria = await Categoria.findByPk(idCategoria, {
    include: [{
      model: Evento,
      as: 'evento',
      attributes: ['id_evento', 'nombre_evento', 'fecha_evento', 'ciudad', 'estado']
    }]
  });
  if (!categoria) throw ApiError.notFound('Categoria no encontrada.');
  if (!esAdmin && categoria.evento.estado === 'borrador') {
    throw ApiError.notFound('Categoria no encontrada.');
  }

  const ocupados = await contarOcupados([categoria.id_categoria]);
  return serializarCategoria(categoria, ocupados.get(Number(categoria.id_categoria)) || 0);
}

async function actualizarCategoria(idCategoria, payload) {
  const categoria = await Categoria.findByPk(idCategoria);
  if (!categoria) throw ApiError.notFound('Categoria no encontrada.');

  const edadMinima = payload.edad_minima !== undefined
    ? payload.edad_minima
    : categoria.edad_minima;
  const edadMaxima = payload.edad_maxima !== undefined
    ? payload.edad_maxima
    : categoria.edad_maxima;

  if (
    edadMinima !== null && edadMaxima !== null &&
    Number(edadMinima) > Number(edadMaxima)
  ) {
    throw ApiError.unprocessable('La edad minima no puede ser mayor que la edad maxima.');
  }

  if (payload.cupo_maximo !== undefined) {
    const ocupados = await contarOcupados([categoria.id_categoria]);
    const usados = ocupados.get(Number(categoria.id_categoria)) || 0;
    if (Number(payload.cupo_maximo) < usados) {
      throw ApiError.conflict(
        `No es posible reducir el cupo a ${payload.cupo_maximo}: ya existen ${usados} inscripciones.`
      );
    }
  }

  const campos = [
    'nombre_cat', 'distancia_km', 'cupo_maximo', 'precio',
    'edad_minima', 'edad_maxima', 'genero'
  ];

  campos.forEach((campo) => {
    if (payload[campo] !== undefined) categoria[campo] = payload[campo];
  });

  await categoria.save();

  const ocupados = await contarOcupados([categoria.id_categoria]);
  return serializarCategoria(categoria, ocupados.get(Number(categoria.id_categoria)) || 0);
}

async function eliminarCategoria(idCategoria) {
  const categoria = await Categoria.findByPk(idCategoria);
  if (!categoria) throw ApiError.notFound('Categoria no encontrada.');

  const inscripciones = await Inscripcion.count({
    where: { id_categoria: categoria.id_categoria }
  });

  if (inscripciones > 0) {
    throw ApiError.conflict(
      'No se puede eliminar la categoria porque tiene inscripciones asociadas.'
    );
  }

  await categoria.destroy();
  return { id_categoria: Number(idCategoria) };
}

module.exports = {
  contarOcupados,
  serializarCategoria,
  adjuntarCupos,
  crearCategoria,
  listarCategoriasEvento,
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria
};
