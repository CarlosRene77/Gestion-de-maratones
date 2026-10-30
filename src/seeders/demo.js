'use strict';

const bcrypt = require('bcryptjs');
const {
  sequelize,
  Rol,
  Usuario,
  Evento,
  Categoria,
  Inscripcion,
  Dorsal,
  TiempoCheckpoint
} = require('../models');
const env = require('../config/env');

const DEMO_EVENT = 'Maraton de la Ciudad 2026';
const DEMO_PASSWORD = 'Corredor123!';

function minutosDesde(base, minutos) {
  return new Date(base.getTime() + minutos * 60 * 1000);
}

async function crearUsuarioDemo(datos, idRol, passwordHash, transaction) {
  const email = datos.email.toLowerCase();

  const [usuario] = await Usuario.unscoped().findOrCreate({
    where: { email },
    defaults: {
      id_rol: idRol,
      nombre: datos.nombre,
      apellido: datos.apellido,
      email,
      password_hash: passwordHash,
      telefono: datos.telefono || null,
      contacto_emergencia: datos.contacto_emergencia || null,
      modo_oscuro_pref: Boolean(datos.modo_oscuro),
      estado_cuenta: 'activo',
      fecha_nacimiento: datos.fecha_nacimiento,
      genero: datos.genero
    },
    transaction
  });

  return usuario;
}

async function seedDemo({ silent = false } = {}) {
  const resultado = await sequelize.transaction(async (transaction) => {
    const existente = await Evento.findOne({
      where: { nombre_evento: DEMO_EVENT },
      transaction
    });

    if (existente) {
      return { omitido: true, id_evento: existente.id_evento };
    }

    const roles = await Rol.findAll({ transaction });
    const porNombre = new Map(roles.map((rol) => [rol.nombre_rol, rol]));
    const idStaff = porNombre.get('staff').id_rol;
    const idCorredor = porNombre.get('corredor').id_rol;

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.security.bcryptSaltRounds);
    const passwordStaff = await bcrypt.hash('Staff123!', env.security.bcryptSaltRounds);

    await crearUsuarioDemo({
      email: 'staff@marathonhub.com',
      nombre: 'Sofia',
      apellido: 'Cronometradora',
      genero: 'F',
      fecha_nacimiento: '1994-05-12',
      telefono: '+507 6000-0001'
    }, idStaff, passwordStaff, transaction);

    const corredores = [
      {
        email: 'corredor@marathonhub.com',
        nombre: 'Carlos',
        apellido: 'Runner',
        genero: 'M',
        fecha_nacimiento: '1993-03-15',
        modo_oscuro: true,
        categoria: '10K Libre',
        salida: 0,
        meta: 52
      },
      {
        email: 'ana.torres@example.com',
        nombre: 'Ana',
        apellido: 'Torres',
        genero: 'F',
        fecha_nacimiento: '1990-07-21',
        categoria: '10K Libre',
        salida: 0,
        meta: 49
      },
      {
        email: 'luis.gomez@example.com',
        nombre: 'Luis',
        apellido: 'Gomez',
        genero: 'M',
        fecha_nacimiento: '1988-11-02',
        categoria: '10K Libre',
        salida: 0,
        meta: 47
      },
      {
        email: 'marta.ruiz@example.com',
        nombre: 'Marta',
        apellido: 'Ruiz',
        genero: 'F',
        fecha_nacimiento: '1988-01-30',
        categoria: '10K Libre',
        salida: 0,
        meta: 55
      },
      {
        email: 'pedro.master@example.com',
        nombre: 'Pedro',
        apellido: 'Master',
        genero: 'M',
        fecha_nacimiento: '1975-09-09',
        categoria: '10K Master',
        salida: 0,
        meta: 58
      },
      {
        email: 'sofia.veloz@example.com',
        nombre: 'Sofia',
        apellido: 'Veloz',
        genero: 'F',
        fecha_nacimiento: '1995-12-05',
        categoria: '5K Femenil',
        salida: 0,
        meta: 27,
        sinKm: true
      },
      {
        email: 'jorge.21k@example.com',
        nombre: 'Jorge',
        apellido: 'Fondo',
        genero: 'M',
        fecha_nacimiento: '1982-04-18',
        categoria: '21K Libre',
        salida: 0,
        meta: null
      }
    ];

    const usuarios = [];
    for (const corredor of corredores) {
      const usuario = await crearUsuarioDemo({
        ...corredor,
        telefono: null,
        contacto_emergencia: 'Contacto de emergencia 555-0100'
      }, idCorredor, passwordHash, transaction);
      usuarios.push({ usuario, corredor });
    }

    const inicio = new Date(Date.now() - 2 * 60 * 60 * 1000);
    inicio.setSeconds(0, 0);

    const evento = await Evento.create({
      nombre_evento: DEMO_EVENT,
      descripcion: 'Evento de demostracion con resultados, kits y cronometraje ya registrados.',
      fecha_evento: inicio,
      ciudad: 'Ciudad de Panama',
      lugar_salida: 'Parque Omar',
      estado: 'en_curso',
      imagen_banner: 'https://images.example.com/maraton-ciudad-2026.jpg'
    }, { transaction });

    const categorias = [];
    const datosCategorias = [
      {
        nombre_cat: '10K Libre',
        distancia_km: 10,
        cupo_maximo: 200,
        precio: 25,
        edad_minima: 18,
        edad_maxima: 39,
        genero: 'Mixto'
      },
      {
        nombre_cat: '10K Master',
        distancia_km: 10,
        cupo_maximo: 150,
        precio: 25,
        edad_minima: 40,
        edad_maxima: 99,
        genero: 'Mixto'
      },
      {
        nombre_cat: '21K Libre',
        distancia_km: 21.1,
        cupo_maximo: 100,
        precio: 40,
        edad_minima: 18,
        edad_maxima: 99,
        genero: 'Mixto'
      },
      {
        nombre_cat: '5K Femenil',
        distancia_km: 5,
        cupo_maximo: 80,
        precio: 15,
        edad_minima: 15,
        edad_maxima: 99,
        genero: 'F'
      }
    ];

    for (const datos of datosCategorias) {
      categorias.push(await Categoria.create({
        id_evento: evento.id_evento,
        ...datos
      }, { transaction }));
    }

    const categoriaPorNombre = new Map(categorias.map((categoria) => [categoria.nombre_cat, categoria]));

    const eventoFuturo = await Evento.create({
      nombre_evento: 'Carrera Nocturna 2026',
      descripcion: 'Evento abierto para probar el flujo completo de inscripciones.',
      fecha_evento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ciudad: 'Ciudad de Panama',
      lugar_salida: 'Cinta Costera',
      estado: 'publicado',
      imagen_banner: 'https://images.example.com/carrera-nocturna-2026.jpg'
    }, { transaction });

    await Categoria.bulkCreate([
      {
        id_evento: eventoFuturo.id_evento,
        nombre_cat: '10K Nocturno',
        distancia_km: 10,
        cupo_maximo: 300,
        precio: 20,
        edad_minima: 18,
        edad_maxima: 99,
        genero: 'Mixto'
      },
      {
        id_evento: eventoFuturo.id_evento,
        nombre_cat: '5K Nocturno',
        distancia_km: 5,
        cupo_maximo: 150,
        precio: 15,
        edad_minima: 15,
        edad_maxima: 99,
        genero: 'Mixto'
      }
    ], { transaction });

    let siguienteDorsal = Math.max(Number(await Dorsal.max('numero_dorsal', { transaction })) || 0, 1000) + 1;

    for (const { usuario, corredor } of usuarios) {
      const categoria = categoriaPorNombre.get(corredor.categoria);

      const inscripcion = await Inscripcion.create({
        id_usuario: usuario.id_usuario,
        id_categoria: categoria.id_categoria,
        codigo_transaccion: `TX-DEMO-${usuario.id_usuario}`,
        estado_pago: 'completado',
        talla_camiseta: ['S', 'M', 'L'][usuario.id_usuario % 3],
        fecha_inscripcion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }, { transaction });

      const dorsal = await Dorsal.create({
        id_inscripcion: inscripcion.id_inscripcion,
        numero_dorsal: siguienteDorsal,
        chip_code: `CHIP-${siguienteDorsal}`,
        estado_kit: 'entregado'
      }, { transaction });

      siguienteDorsal += 1;

      const marcas = [];
      if (corredor.meta === null) {
        marcas.push({ nombre: 'SALIDA', minuto: 0 });
        marcas.push({ nombre: 'KM 5', minuto: 25 });
        marcas.push({ nombre: 'KM 10', minuto: 50 });
      } else if (corredor.categoria === '21K Libre') {
        marcas.push({ nombre: 'SALIDA', minuto: 0 });
        marcas.push({ nombre: 'KM 5', minuto: 25 });
        marcas.push({ nombre: 'KM 10', minuto: 50 });
        marcas.push({ nombre: 'META', minuto: corredor.meta });
      } else if (corredor.sinKm) {
        marcas.push({ nombre: 'SALIDA', minuto: 0 });
        marcas.push({ nombre: 'META', minuto: corredor.meta });
      } else {
        marcas.push({ nombre: 'SALIDA', minuto: 0 });
        marcas.push({ nombre: 'KM 5', minuto: Math.round(corredor.meta * 0.48) });
        marcas.push({ nombre: 'META', minuto: corredor.meta });
      }

      await TiempoCheckpoint.bulkCreate(marcas.map((marca) => ({
        id_dorsal: dorsal.id_dorsal,
        nombre_punto: marca.nombre,
        tiempo_marcado: minutosDesde(inicio, marca.minuto),
        id_staff_registro: null
      })), { transaction });
    }

    // Se deja constancia del evento creado para futuras ampliaciones.
    return {
      omitido: false,
      id_evento: evento.id_evento,
      id_evento_futuro: eventoFuturo.id_evento,
      corredores: usuarios.length
    };
  });

  if (!silent) {
    if (resultado.omitido) {
      console.log('[SEED] El evento de demostracion ya existe. No se duplicaron datos.');
    } else {
      console.log('[SEED] Datos de demostracion creados.');
      console.log('[SEED] Staff:      staff@marathonhub.com / Staff123!');
      console.log(`[SEED] Corredor:   corredor@marathonhub.com / ${DEMO_PASSWORD}`);
      console.log(`[SEED] Evento demo (en curso): id ${resultado.id_evento}`);
      console.log(`[SEED] Evento abierto a inscripciones: id ${resultado.id_evento_futuro}`);
    }
  }

  return resultado;
}

module.exports = { seedDemo, DEMO_PASSWORD };
