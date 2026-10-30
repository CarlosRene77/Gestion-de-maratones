'use strict';

const {
  Evento,
  Categoria,
  Inscripcion,
  Usuario,
  Dorsal,
  TiempoCheckpoint,
  Op,
  fn,
  col,
  literal
} = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { adjuntarCupos, contarOcupados, serializarCategoria } = require('./categorias.service');

const ESTADOS = ['borrador', 'publicado', 'en_curso', 'finalizado'];
const ESTADOS_PUBLICOS = ['publicado', 'en_curso', 'finalizado'];

function serializarEvento(evento, categorias = null) {
  const plain = evento?.get ? evento.get({ plain: true }) : { ...evento };

  if (Array.isArray(categorias)) {
    plain.categorias = categorias;
  } else if (Array.isArray(plain.categorias)) {
    plain.categorias = plain.categorias.map((categoria) => serializarCategoria(categoria));
  } else {
    plain.categorias = [];
  }

  return plain;
}

async function listarEventos(query, { esAdmin = false } = {}) {
  const { page, limit, offset } = getPagination(query, { defaultLimit: 20, maxLimit: 100 });

  const where = {};

  if (query.estado) {
    if (!ESTADOS.includes(query.estado)) {
      throw ApiError.unprocessable('Estado de evento invalido.', {
        permitidos: ESTADOS
      });
    }
    // Un evento en borrador nunca debe exponerse en el listado publico.
    where.estado = !esAdmin && query.estado === 'borrador'
      ? { [Op.in]: [] }
      : query.estado;
  } else if (!esAdmin) {
    where.estado = { [Op.in]: ESTADOS_PUBLICOS };
  }

  if (query.ciudad) where.ciudad = { [Op.like]: `%${query.ciudad}%` };
  if (query.q) {
    where[Op.or] = [
      { nombre_evento: { [Op.like]: `%${query.q}%` } },
      { descripcion: { [Op.like]: `%${query.q}%` } },
      { ciudad: { [Op.like]: `%${query.q}%` } }
    ];
  }

  if (query.desde || query.hasta) {
    where.fecha_evento = {};
    if (query.desde) where.fecha_evento[Op.gte] = new Date(query.desde);
    if (query.hasta) where.fecha_evento[Op.lte] = new Date(query.hasta);
  }

  const camposOrden = {
    fecha_evento: 'fecha_evento',
    nombre_evento: 'nombre_evento',
    created_at: 'createdAt'
  };
  const orden = camposOrden[query.sort] || 'fecha_evento';
  const direccion = String(query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const { rows, count } = await Evento.findAndCountAll({
    where,
    order: [[orden, direccion]],
    limit,
    offset,
    distinct: true
  });

  const categorias = await Categoria.findAll({
    where: { id_evento: { [Op.in]: rows.map((evento) => evento.id_evento) } },
    order: [['distancia_km', 'ASC'], ['nombre_cat', 'ASC']]
  });

  const ocupados = await contarOcupados(categorias.map((categoria) => categoria.id_categoria));
  const categoriasPorEvento = new Map();

  categorias.forEach((categoria) => {
    const key = Number(categoria.id_evento);
    if (!categoriasPorEvento.has(key)) categoriasPorEvento.set(key, []);
    categoriasPorEvento.get(key).push(
      serializarCategoria(categoria, ocupados.get(Number(categoria.id_categoria)) || 0)
    );
  });

  const data = rows.map((evento) => serializarEvento(
    evento,
    categoriasPorEvento.get(Number(evento.id_evento)) || []
  ));

  return {
    data,
    meta: buildPaginationMeta(count, page, limit)
  };
}

async function obtenerEvento(idEvento, { esAdmin = false, incluirCategorias = true } = {}) {
  const evento = await Evento.findByPk(idEvento);

  if (!evento) throw ApiError.notFound('Evento no encontrado.');
  if (!esAdmin && !ESTADOS_PUBLICOS.includes(evento.estado)) {
    throw ApiError.notFound('Evento no encontrado.');
  }

  const plain = evento.get({ plain: true });

  if (incluirCategorias) {
    const categorias = await Categoria.findAll({
      where: { id_evento: evento.id_evento },
      order: [['distancia_km', 'ASC'], ['nombre_cat', 'ASC']]
    });
    plain.categorias = await adjuntarCupos(categorias);
  }

  return plain;
}

async function crearEvento(payload) {
  const evento = await Evento.create({
    nombre_evento: payload.nombre_evento,
    descripcion: payload.descripcion ?? null,
    fecha_evento: payload.fecha_evento,
    ciudad: payload.ciudad ?? null,
    lugar_salida: payload.lugar_salida ?? null,
    estado: payload.estado ?? 'borrador',
    imagen_banner: payload.imagen_banner ?? null
  });

  return { ...evento.get({ plain: true }), categorias: [] };
}

async function actualizarEvento(idEvento, payload) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('Evento no encontrado.');

  const campos = [
    'nombre_evento', 'descripcion', 'fecha_evento', 'ciudad',
    'lugar_salida', 'estado', 'imagen_banner'
  ];

  campos.forEach((campo) => {
    if (payload[campo] !== undefined) evento[campo] = payload[campo];
  });

  await evento.save();
  return obtenerEvento(evento.id_evento, { esAdmin: true });
}

async function cambiarEstadoEvento(idEvento, estado) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('Evento no encontrado.');

  if (!ESTADOS.includes(estado)) {
    throw ApiError.unprocessable('Estado de evento invalido.', { permitidos: ESTADOS });
  }

  evento.estado = estado;
  await evento.save();

  return { id_evento: evento.id_evento, estado: evento.estado };
}

async function eliminarEvento(idEvento) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('Evento no encontrado.');

  const inscripciones = await Inscripcion.count({
    include: [{
      model: Categoria,
      as: 'categoria',
      attributes: [],
      required: true,
      where: { id_evento: evento.id_evento }
    }]
  });

  if (inscripciones > 0) {
    throw ApiError.conflict(
      'No se puede eliminar un evento con inscripciones. Cambie su estado a finalizado.'
    );
  }

  await evento.destroy();
  return { id_evento: Number(idEvento) };
}

async function obtenerEstadisticasEvento(idEvento) {
  const evento = await Evento.findByPk(idEvento, {
    include: [{
      model: Categoria,
      as: 'categorias',
      attributes: ['id_categoria', 'nombre_cat', 'cupo_maximo', 'precio']
    }]
  });

  if (!evento) throw ApiError.notFound('Evento no encontrado.');

  const idsCategorias = evento.categorias.map((categoria) => categoria.id_categoria);

  const [porEstado, dorsales, tiempos] = await Promise.all([
    Inscripcion.findAll({
      attributes: ['estado_pago', [fn('COUNT', col('id_inscripcion')), 'total']],
      where: { id_categoria: { [Op.in]: idsCategorias.length ? idsCategorias : [0] } },
      group: ['estado_pago'],
      raw: true
    }),
    Dorsal.findAll({
      attributes: ['estado_kit', [fn('COUNT', col('id_dorsal')), 'total']],
      include: [{
        model: Inscripcion,
        as: 'inscripcion',
        attributes: [],
        required: true,
        include: [{
          model: Categoria,
          as: 'categoria',
          attributes: [],
          required: true,
          where: { id_evento: evento.id_evento }
        }]
      }],
      group: ['estado_kit'],
      raw: true
    }),
    TiempoCheckpoint.count({
      include: [{
        model: Dorsal,
        as: 'dorsal',
        attributes: [],
        required: true,
        include: [{
          model: Inscripcion,
          as: 'inscripcion',
          attributes: [],
          required: true,
          include: [{
            model: Categoria,
            as: 'categoria',
            attributes: [],
            required: true,
            where: { id_evento: evento.id_evento }
          }]
        }]
      }]
    })
  ]);

  const inscripciones = { pendiente: 0, completado: 0, cancelado: 0 };
  porEstado.forEach((row) => {
    inscripciones[row.estado_pago] = Number(row.total);
  });

  const kits = { pendiente: 0, entregado: 0 };
  dorsales.forEach((row) => {
    kits[row.estado_kit] = Number(row.total);
  });

  const cupoTotal = evento.categorias.reduce((acc, categoria) => acc + Number(categoria.cupo_maximo), 0);
  const inscritosActivos = inscripciones.pendiente + inscripciones.completado;

  // El recaudo se calcula con una consulta agregada para no asumir que todas
  // las categorias tienen el mismo precio.
  const recaudoReal = await Inscripcion.findOne({
    attributes: [[
      literal('COALESCE(SUM(categoria.precio), 0)'),
      'total'
    ]],
    include: [{
      model: Categoria,
      as: 'categoria',
      attributes: [],
      required: true,
      where: { id_evento: evento.id_evento }
    }],
    where: { estado_pago: 'completado' },
    raw: true
  });

  // Desgloses ligeros para el dashboard del frontend. Se calculan sobre las
  // inscripciones activas (pendientes + completadas) para evitar inflar las
  // metricas con cancelaciones.
  const detalle = await Inscripcion.findAll({
    attributes: ['id_categoria', 'estado_pago', 'talla_camiseta'],
    where: {
      id_categoria: { [Op.in]: idsCategorias.length ? idsCategorias : [0] },
      estado_pago: { [Op.ne]: 'cancelado' }
    },
    include: [{
      model: Usuario,
      as: 'usuario',
      attributes: ['genero'],
      required: false
    }],
    raw: true
  });

  const generos = { M: 0, F: 0, sin_definir: 0 };
  const tallas = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, sin_talla: 0 };
  const porCategoria = new Map(
    evento.categorias.map((categoria) => [
      Number(categoria.id_categoria),
      {
        id_categoria: categoria.id_categoria,
        nombre_cat: categoria.nombre_cat,
        cupo_maximo: Number(categoria.cupo_maximo),
        precio: Number(categoria.precio),
        inscritos: 0
      }
    ])
  );

  detalle.forEach((fila) => {
    const genero = fila['usuario.genero'] ?? fila.genero ?? null;
    if (genero === 'M' || genero === 'F') generos[genero] += 1;
    else generos.sin_definir += 1;

    const talla = String(fila.talla_camiseta || '').toUpperCase();
    if (tallas[talla] !== undefined && talla !== 'sin_talla') tallas[talla] += 1;
    else tallas.sin_talla += 1;

    const categoria = porCategoria.get(Number(fila.id_categoria));
    if (categoria) categoria.inscritos += 1;
  });

  return {
    id_evento: evento.id_evento,
    nombre_evento: evento.nombre_evento,
    estado: evento.estado,
    cupo_total: cupoTotal,
    cupos_disponibles: Math.max(0, cupoTotal - inscritosActivos),
    inscripciones,
    inscritos_activos: inscritosActivos,
    kits,
    marcaciones_registradas: tiempos,
    recaudado: Number(recaudoReal?.total || 0),
    generos,
    tallas,
    categorias: [...porCategoria.values()]
  };
}

module.exports = {
  ESTADOS,
  ESTADOS_PUBLICOS,
  listarEventos,
  obtenerEvento,
  crearEvento,
  actualizarEvento,
  cambiarEstadoEvento,
  eliminarEvento,
  obtenerEstadisticasEvento
};
