'use strict';

const crypto = require('crypto');
const {
  Evento,
  Categoria,
  Inscripcion,
  Usuario,
  Dorsal,
  TiempoCheckpoint,
  Op
} = require('../models');
const ApiError = require('../utils/ApiError');
const { calcularTiempos } = require('../utils/tiempos');

const includeUsuario = {
  model: Usuario,
  as: 'usuario',
  required: true,
  attributes: ['id_usuario', 'nombre', 'apellido', 'genero']
};

const includeDorsalConTiempos = {
  model: Dorsal,
  as: 'dorsal',
  required: true,
  attributes: ['id_dorsal', 'numero_dorsal', 'chip_code', 'estado_kit'],
  include: [{
    model: TiempoCheckpoint,
    as: 'tiempos',
    required: false,
    attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado']
  }]
};

async function cargarEvento(idEvento, { esAdmin = false } = {}) {
  const evento = await Evento.findByPk(idEvento);
  if (!evento) throw ApiError.notFound('Evento no encontrado.');
  if (!esAdmin && evento.estado === 'borrador') {
    throw ApiError.notFound('Evento no encontrado.');
  }
  return evento;
}

async function cargarCategorias(idEvento) {
  return Categoria.findAll({
    where: { id_evento: idEvento },
    order: [['distancia_km', 'ASC'], ['nombre_cat', 'ASC']]
  });
}

async function cargarInscripciones(idsCategorias) {
  if (!idsCategorias.length) return [];

  return Inscripcion.findAll({
    where: {
      id_categoria: { [Op.in]: idsCategorias },
      estado_pago: 'completado'
    },
    include: [includeUsuario, includeDorsalConTiempos],
    order: [['id_inscripcion', 'ASC']]
  });
}

function resumenCategoria(categoria) {
  return {
    id_categoria: categoria.id_categoria,
    nombre_cat: categoria.nombre_cat,
    distancia_km: Number(categoria.distancia_km),
    genero: categoria.genero,
    edad_minima: categoria.edad_minima,
    edad_maxima: categoria.edad_maxima
  };
}

function construirParticipante(inscripcion, categoria) {
  const tiempos = inscripcion.dorsal?.tiempos || [];
  const calculo = calcularTiempos(tiempos);

  return {
    posicion: null,
    id_inscripcion: inscripcion.id_inscripcion,
    numero_dorsal: inscripcion.dorsal.numero_dorsal,
    chip_code: inscripcion.dorsal.chip_code,
    corredor: {
      id_usuario: inscripcion.usuario.id_usuario,
      nombre: inscripcion.usuario.nombre,
      apellido: inscripcion.usuario.apellido,
      genero: inscripcion.usuario.genero
    },
    categoria: resumenCategoria(categoria),
    finalizado: calculo.finalizado,
    tiempo_neto_segundos: calculo.tiempo_neto_segundos,
    tiempo_neto: calculo.tiempo_neto,
    salida: calculo.salida,
    meta: calculo.meta,
    splits: calculo.splits
  };
}

function compararPorTiempo(a, b) {
  if (a.tiempo_neto_segundos === b.tiempo_neto_segundos) {
    const apellido = String(a.corredor.apellido || '').localeCompare(String(b.corredor.apellido || ''));
    if (apellido !== 0) return apellido;
    return String(a.corredor.nombre || '').localeCompare(String(b.corredor.nombre || ''));
  }
  return a.tiempo_neto_segundos - b.tiempo_neto_segundos;
}

function asignarPosiciones(participantes) {
  const conTiempo = participantes
    .filter((p) => p.tiempo_neto_segundos !== null && p.tiempo_neto_segundos !== undefined)
    .sort(compararPorTiempo);

  let ultimoTiempo = null;
  let ultimaPosicion = 0;

  conTiempo.forEach((participante, indice) => {
    if (ultimoTiempo === null || participante.tiempo_neto_segundos !== ultimoTiempo) {
      ultimaPosicion = indice + 1;
      ultimoTiempo = participante.tiempo_neto_segundos;
    }
    participante.posicion = ultimaPosicion;
  });

  const finalizadosSinTiempoNeto = participantes
    .filter((p) => p.finalizado && (p.tiempo_neto_segundos === null || p.tiempo_neto_segundos === undefined))
    .sort((a, b) => new Date(a.meta) - new Date(b.meta));

  const enCarrera = participantes
    .filter((p) => !p.finalizado)
    .sort((a, b) => a.numero_dorsal - b.numero_dorsal);

  return [...conTiempo, ...finalizadosSinTiempoNeto, ...enCarrera];
}

function construirResultadosCategoria(categoria, inscripciones, filtros = {}) {
  let participantes = inscripciones
    .filter((inscripcion) => Number(inscripcion.id_categoria) === Number(categoria.id_categoria))
    .filter((inscripcion) => inscripcion.dorsal)
    .map((inscripcion) => construirParticipante(inscripcion, categoria));

  if (filtros.genero) {
    participantes = participantes.filter((p) => p.corredor.genero === filtros.genero);
  }

  const ordenados = asignarPosiciones(participantes);

  return {
    ...resumenCategoria(categoria),
    inscritos: participantes.length,
    finalizados: participantes.filter((p) => p.finalizado).length,
    resultados: ordenados
  };
}

function contarResumen(categorias) {
  return categorias.reduce((acc, categoria) => {
    acc.inscritos += categoria.inscritos;
    acc.finalizados += categoria.finalizados;
    return acc;
  }, { categorias: categorias.length, inscritos: 0, finalizados: 0 });
}

async function obtenerResultadosEvento(idEvento, query = {}, { esAdmin = false } = {}) {
  const evento = await cargarEvento(idEvento, { esAdmin });
  let categorias = await cargarCategorias(evento.id_evento);

  if (query.id_categoria) {
    categorias = categorias.filter(
      (categoria) => Number(categoria.id_categoria) === Number(query.id_categoria)
    );
    if (!categorias.length) {
      throw ApiError.notFound('La categoria no pertenece al evento indicado.');
    }
  }

  const inscripciones = await cargarInscripciones(categorias.map((c) => c.id_categoria));

  const resultados = categorias.map((categoria) => construirResultadosCategoria(
    categoria,
    inscripciones,
    { genero: query.genero }
  ));

  return {
    evento: {
      id_evento: evento.id_evento,
      nombre_evento: evento.nombre_evento,
      fecha_evento: evento.fecha_evento,
      ciudad: evento.ciudad,
      lugar_salida: evento.lugar_salida,
      estado: evento.estado,
      imagen_banner: evento.imagen_banner
    },
    filtros: {
      genero: query.genero || null,
      id_categoria: query.id_categoria ? Number(query.id_categoria) : null
    },
    resumen: contarResumen(resultados),
    categorias: resultados
  };
}

async function obtenerResultadosCategoria(idCategoria, query = {}, { esAdmin = false } = {}) {
  const categoria = await Categoria.findByPk(idCategoria, {
    include: [{
      model: Evento,
      as: 'evento',
      attributes: [
        'id_evento', 'nombre_evento', 'fecha_evento', 'ciudad',
        'lugar_salida', 'estado', 'imagen_banner'
      ]
    }]
  });

  if (!categoria) throw ApiError.notFound('Categoria no encontrada.');
  if (!esAdmin && categoria.evento.estado === 'borrador') {
    throw ApiError.notFound('Categoria no encontrada.');
  }

  const inscripciones = await cargarInscripciones([categoria.id_categoria]);
  const resultado = construirResultadosCategoria(categoria, inscripciones, {
    genero: query.genero
  });

  return {
    evento: categoria.evento,
    filtros: { genero: query.genero || null },
    resumen: {
      categorias: 1,
      inscritos: resultado.inscritos,
      finalizados: resultado.finalizados
    },
    categoria: resultado
  };
}

async function buscarDorsalPublico(numeroDorsal) {
  const dorsal = await Dorsal.findOne({
    where: { numero_dorsal: numeroDorsal },
    include: [{
      model: Inscripcion,
      as: 'inscripcion',
      required: true,
      include: [
        includeUsuario,
        {
          model: Categoria,
          as: 'categoria',
          required: true,
          include: [{
            model: Evento,
            as: 'evento',
            attributes: ['id_evento', 'nombre_evento', 'fecha_evento', 'ciudad', 'lugar_salida', 'estado']
          }]
        }
      ]
    }, {
      model: TiempoCheckpoint,
      as: 'tiempos',
      required: false,
      attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado']
    }]
  });

  if (!dorsal) throw ApiError.notFound('No existe un dorsal con ese numero.');
  return dorsal;
}

function construirConsultaDorsal(dorsal, incluirPosicion = false) {
  const inscripcion = dorsal.inscripcion;
  const calculo = calcularTiempos(dorsal.tiempos || []);

  return {
    numero_dorsal: dorsal.numero_dorsal,
    chip_code: dorsal.chip_code,
    corredor: {
      nombre: inscripcion.usuario.nombre,
      apellido: inscripcion.usuario.apellido,
      genero: inscripcion.usuario.genero
    },
    categoria: {
      id_categoria: inscripcion.categoria.id_categoria,
      nombre_cat: inscripcion.categoria.nombre_cat,
      distancia_km: Number(inscripcion.categoria.distancia_km),
      genero: inscripcion.categoria.genero
    },
    evento: {
      id_evento: inscripcion.categoria.evento.id_evento,
      nombre_evento: inscripcion.categoria.evento.nombre_evento,
      fecha_evento: inscripcion.categoria.evento.fecha_evento,
      ciudad: inscripcion.categoria.evento.ciudad
    },
    finalizado: calculo.finalizado,
    tiempo_neto_segundos: calculo.tiempo_neto_segundos,
    tiempo_neto: calculo.tiempo_neto,
    salida: calculo.salida,
    meta: calculo.meta,
    total_marcaciones: (dorsal.tiempos || []).length,
    splits: calculo.splits,
    incluir_posicion: incluirPosicion
  };
}

async function obtenerResultadoDorsal(numeroDorsal) {
  const dorsal = await buscarDorsalPublico(numeroDorsal);
  return construirConsultaDorsal(dorsal);
}

async function obtenerCertificado(numeroDorsal) {
  const dorsal = await buscarDorsalPublico(numeroDorsal);
  const calculo = calcularTiempos(dorsal.tiempos || []);

  if (!calculo.finalizado || calculo.tiempo_neto_segundos === null) {
    throw ApiError.conflict(
      'El corredor aun no registra tiempos de salida y meta para emitir el certificado.'
    );
  }

  if (dorsal.inscripcion.estado_pago !== 'completado') {
    throw ApiError.conflict('La inscripcion no registra pago completado.');
  }

  const categoria = dorsal.inscripcion.categoria;
  const inscripciones = await cargarInscripciones([categoria.id_categoria]);
  const ranking = construirResultadosCategoria(categoria, inscripciones);

  const posicionCategoria = ranking.resultados.find(
    (p) => Number(p.numero_dorsal) === Number(dorsal.numero_dorsal)
  );

  const mismoGenero = ranking.resultados.filter(
    (p) => p.corredor.genero === dorsal.inscripcion.usuario.genero &&
      p.tiempo_neto_segundos !== null &&
      p.tiempo_neto_segundos !== undefined
  );
  const posicionGenero = mismoGenero.findIndex(
    (p) => Number(p.numero_dorsal) === Number(dorsal.numero_dorsal)
  );

  const codigoVerificacion = crypto
    .createHash('sha256')
    .update([
      dorsal.numero_dorsal,
      categoria.evento.id_evento,
      categoria.id_categoria,
      calculo.meta
    ].join('|'))
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();

  return {
    codigo_verificacion: codigoVerificacion,
    emitido_en: new Date().toISOString(),
    evento: {
      id_evento: categoria.evento.id_evento,
      nombre_evento: categoria.evento.nombre_evento,
      fecha_evento: categoria.evento.fecha_evento,
      ciudad: categoria.evento.ciudad,
      lugar_salida: categoria.evento.lugar_salida
    },
    corredor: {
      nombre: dorsal.inscripcion.usuario.nombre,
      apellido: dorsal.inscripcion.usuario.apellido,
      genero: dorsal.inscripcion.usuario.genero
    },
    categoria: {
      id_categoria: categoria.id_categoria,
      nombre_cat: categoria.nombre_cat,
      distancia_km: Number(categoria.distancia_km),
      genero: categoria.genero
    },
    numero_dorsal: dorsal.numero_dorsal,
    chip_code: dorsal.chip_code,
    posicion_categoria: posicionCategoria?.posicion ?? null,
    posicion_genero: posicionGenero >= 0 ? posicionGenero + 1 : null,
    finalizados_categoria: ranking.finalizados,
    tiempo_neto_segundos: calculo.tiempo_neto_segundos,
    tiempo_neto: calculo.tiempo_neto,
    salida: calculo.salida,
    meta: calculo.meta,
    splits: calculo.splits,
    leyenda: 'Tiempo neto calculado entre los puntos SALIDA y META.'
  };
}

module.exports = {
  obtenerResultadosEvento,
  obtenerResultadosCategoria,
  obtenerResultadoDorsal,
  obtenerCertificado
};
