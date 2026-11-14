import { fechaHoraUruguay, valorDelSelector } from '../src/comun/fechaHoraActividad.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { datosDelFormulario, ErrorFormulario, formularioInicial } from '../src/comun/formularioActividad.ts';

const ahora = new Date('2026-11-10T12:00:00Z');
function formularioValido(cambios = {}) {
  return {
    ...formularioInicial(),
    nombre: 'Surf en La Paloma',
    descripcion: 'Una mañana para compartir el deporte.',
    deporteId: '1',
    fecha: '2026-11-20',
    hora: '07:30',
    cupoMaximo: '5',
    origen: { placeId: 'origen', descripcion: 'Montevideo' },
    destino: { placeId: 'destino', descripcion: 'La Paloma' },
    ...cambios,
  };
}
function camposInvalidos(formulario, maximo = 20) {
  try {
    datosDelFormulario(formulario, maximo, ahora);
  } catch (error) {
    assert.ok(error instanceof ErrorFormulario);
    return error.campos;
  }
  assert.fail('El formulario inválido no puede generar un pedido de alta.');
}

describe('CU10 validación de formularios independiente de Maps', () => {
  it('E1/E4: informa todos los obligatorios aunque no haya ubicaciones seleccionadas', () => {
    const campos = camposInvalidos(formularioInicial());
    for (const campo of ['nombre', 'descripcion', 'deporteId', 'fecha', 'hora', 'destinoPlaceId']) {
      assert.ok(campos[campo], `Falta el error de ${campo}`);
    }
  });
  it('E2/E3/E4: conserva errores de fecha, cupo y dinero junto a los de ubicaciones', () => {
    const formulario = formularioValido({ fecha: '2020-01-01', cupoMaximo: '21', costo: '-1', origen: null, destino: null });
    const antes = JSON.parse(JSON.stringify(formulario));
    const campos = camposInvalidos(formulario);
    for (const campo of ['fechaHoraInicio', 'cupoMaximo', 'costoEstimadoCentavos', 'destinoPlaceId']) assert.ok(campos[campo]);
    assert.deepEqual(formulario, antes, 'La validación debe conservar lo escrito.');
  });
  it('E4: sigue impidiendo crear si solo falta el destino válido', () => {
    assert.deepEqual(Object.keys(camposInvalidos(formularioValido({ origen: null, destino: null }))).sort(), ['destinoPlaceId']);
  });
  it('FP: admite crear sin origen y lo envía como null', () => {
    const datos = datosDelFormulario(formularioValido({ origen: null }), 20, ahora);
    assert.equal(datos.origenPlaceId, null);
    assert.equal(datos.destinoPlaceId, 'destino');
  });
  it('E4: el destino provisional usa el identificador del servidor sin enviar coordenadas arbitrarias', () => {
    const datos = datosDelFormulario(
      formularioValido({
        origen: null,
        destino: {
          placeId: 'faltauno:destino-provisional',
          descripcion: 'Ubicación por defecto',
          provisional: true,
          lat: -34.91635775362398,
          lng: -56.11543161770436,
        },
      }),
      20,
      ahora,
    );
    assert.equal(datos.destinoPlaceId, 'faltauno:destino-provisional');
    assert.equal(datos.origenPlaceId, null);
    assert.ok(!('lat' in datos));
  });
  it('FP: genera el mismo contrato de alta con datos válidos', () => {
    const datos = datosDelFormulario(formularioValido({ costo: '1200,50', invitados: [' Ana '] }), 20, ahora);
    assert.equal(datos.costoEstimadoCentavos, 120050);
    assert.equal(datos.fechaHoraInicio, '2026-11-20T10:30:00.000Z');
    assert.deepEqual(datos.invitados, ['Ana']);
    assert.equal(datos.origenPlaceId, 'origen');
    assert.equal(datos.lugaresVehiculo, null);
  });
  it('E3: toma el máximo recibido del servidor sin fijarlo en el cliente', () => {
    assert.ok(camposInvalidos(formularioValido({ cupoMaximo: '21' })).cupoMaximo);
    assert.equal(datosDelFormulario(formularioValido({ cupoMaximo: '21' }), 30, ahora).cupoMaximo, 21);
    assert.ok(camposInvalidos(formularioValido({ cupoMaximo: '1' })).cupoMaximo);
    assert.ok(camposInvalidos(formularioValido({ cupoMaximo: '2.5' })).cupoMaximo);
  });
  it('E2: rechaza un instante igual al actual y una fecha imposible', () => {
    assert.ok(camposInvalidos(formularioValido({ fecha: '2026-11-10', hora: '09:00' })).fechaHoraInicio);
    assert.ok(camposInvalidos(formularioValido({ fecha: '2026-02-30' })).fechaHoraInicio);
    assert.ok(camposInvalidos(formularioValido({ hora: '25:00' })).fechaHoraInicio);
  });
  it('E1: valida los nombres de invitados y el cupo ocupado', () => {
    const campos = camposInvalidos(formularioValido({ cupoMaximo: '2', invitados: ['', 'Ana'] }));
    assert.ok(campos.invitados);
    assert.ok(campos['invitados.0']);
  });
  it('E4: exige un origen seleccionado cuando se tiene vehículo propio', () => {
    const formulario = formularioValido({ tieneVehiculo: true, lugaresVehiculo: '3', origen: null });
    assert.equal(camposInvalidos(formulario).origenPlaceId, 'Si tenés vehículo propio, seleccioná tu punto de origen.');
    const conOrigen = { ...formulario, origen: { placeId: 'origen', descripcion: 'Montevideo' } };
    assert.equal(datosDelFormulario(conOrigen, 20, ahora).origenPlaceId, 'origen');
  });
  it('E4: al desmarcar vehículo permite continuar sin origen', () => {
    const formulario = formularioValido({ tieneVehiculo: true, lugaresVehiculo: '3', origen: null });
    const datos = datosDelFormulario({ ...formulario, tieneVehiculo: false }, 20, ahora);
    assert.equal(datos.origenPlaceId, null);
    assert.equal(datos.lugaresVehiculo, null);
  });
  it('E1: exige lugares solo cuando se tiene vehículo propio', () => {
    assert.ok(camposInvalidos(formularioValido({ tieneVehiculo: true, lugaresVehiculo: '' })).lugaresVehiculo);
    assert.equal(
      datosDelFormulario(formularioValido({ tieneVehiculo: true, lugaresVehiculo: '0' }), 20, ahora).lugaresVehiculo,
      0,
    );
    assert.equal(
      datosDelFormulario(formularioValido({ tieneVehiculo: false, lugaresVehiculo: '3' }), 20, ahora).lugaresVehiculo,
      null,
    );
  });
});

describe('CU10 selectores nativos de fecha y hora', () => {
  it('FP: interpreta el instante del selector como hora uruguaya', () => {
    assert.deepEqual(fechaHoraUruguay(new Date('2026-11-20T10:30:00Z')), { fecha: '2026-11-20', hora: '07:30' });
  });
  it('E2: respeta el día uruguayo cerca de medianoche y del cambio de año', () => {
    assert.deepEqual(fechaHoraUruguay(new Date('2027-01-01T01:30:00Z')), { fecha: '2026-12-31', hora: '22:30' });
    assert.equal(fechaHoraUruguay(new Date('2026-11-10T03:00:00Z')).hora, '00:00');
  });
  it('FP: reabre con los valores existentes sin depender de la zona del dispositivo', () => {
    assert.equal(valorDelSelector('2026-11-20', '07:30', ahora).toISOString(), '2026-11-20T10:30:00.000Z');
    assert.equal(valorDelSelector('', '', new Date('2026-11-11T01:30:00Z')).toISOString(), '2026-11-11T01:30:00.000Z');
  });
  it('FP/E2: mantiene el contrato ISO y la validación de inicio futuro al seleccionar', () => {
    const seleccion = fechaHoraUruguay(new Date('2026-11-20T10:30:00Z'));
    const datos = datosDelFormulario(formularioValido(seleccion), 20, ahora);
    assert.equal(datos.fechaHoraInicio, '2026-11-20T10:30:00.000Z');
    const pasado = fechaHoraUruguay(new Date('2026-11-10T11:59:00Z'));
    assert.ok(camposInvalidos(formularioValido(pasado)).fechaHoraInicio);
  });
});
import { obtenerUbicacionActual } from '../src/comun/ubicacionDispositivo.ts';
import { resultadoIncierto } from '../src/comun/formularioActividad.ts';

describe('CU10 selección con pin en mobile', () => {
  it('FP/E4: acepta pin para el origen del conductor y conserva las coordenadas exactas', () => {
    const origen = {
      placeId: null,
      tipo: 'pin',
      descripcion: 'Origen elegido',
      lat: -34.91635775362398,
      lng: -56.11543161770436,
    };
    const destino = { ...origen, descripcion: 'Destino elegido', lat: -34.9 };
    const formulario = formularioValido({ origen, destino, tieneVehiculo: true, lugaresVehiculo: '3' });
    const datos = datosDelFormulario(formulario, 20, ahora);
    assert.equal(datos.origenPlaceId, null);
    assert.equal(datos.destinoPlaceId, null);
    assert.deepEqual(datos.origenCoordenadas, { lat: origen.lat, lng: origen.lng });
    assert.deepEqual(datos.destinoCoordenadas, { lat: destino.lat, lng: destino.lng });
    assert.equal(formulario.origen.descripcion, 'Origen elegido');
  });
  it('E4: rechaza pines incompletos, infinitos y fuera de rango', () => {
    for (const punto of [{ lat: -34 }, { lat: Infinity, lng: -56 }, { lat: 91, lng: 0 }, { lat: -34, lng: -181 }]) {
      const pin = { placeId: null, tipo: 'pin', descripcion: 'Punto inválido', ...punto };
      const campos = camposInvalidos(formularioValido({ origen: pin, destino: pin }));
      assert.ok(campos.origenPlaceId);
      assert.ok(campos.destinoPlaceId);
    }
  });
  it('FP: conserva la selección por lugar y solo envía coordenadas para el pin', () => {
    const pin = { placeId: null, tipo: 'pin', descripcion: 'Punto', lat: -34.9, lng: -56.1 };
    const datos = datosDelFormulario(formularioValido({ destino: pin }), 20, ahora);
    assert.equal(datos.origenPlaceId, 'origen');
    assert.equal(Object.hasOwn(datos, 'origenCoordenadas'), false);
    assert.deepEqual(datos.destinoCoordenadas, { lat: -34.9, lng: -56.1 });
  });
  it('ER2: permite corregir el pin tras un fallo de Google previo a persistir', () => {
    assert.equal(resultadoIncierto({ estado: 503, codigo: 'PUNTOS_NO_DISPONIBLES' }), false);
    assert.equal(resultadoIncierto({ estado: 500, codigo: 'ERROR_INTERNO' }), true);
    assert.equal(resultadoIncierto({ estado: 0, codigo: 'SIN_CONEXION' }), true);
  });
});

const posicionGps = { lat: -34.91635775362398, lng: -56.11543161770436, precisionMetros: 12 };
function fuenteGps(cambios = {}) {
  return {
    pedirPermiso: async () => true,
    serviciosActivos: async () => true,
    obtenerPosicion: async () => posicionGps,
    ...cambios,
  };
}
function diferida() {
  let resolver;
  const promesa = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}

describe('CU10 ubicación actual de mobile sin GPS real', () => {
  it('FP: solicita permiso y una sola posición, conservando precisión y coordenadas', async () => {
    const pasos = [];
    const fuente = fuenteGps({
      pedirPermiso: async () => {
        pasos.push('permiso');
        return true;
      },
      serviciosActivos: async () => {
        pasos.push('servicios');
        return true;
      },
      obtenerPosicion: async () => {
        pasos.push('posición');
        return posicionGps;
      },
    });
    assert.deepEqual(await obtenerUbicacionActual(fuente), posicionGps);
    assert.deepEqual(pasos, ['permiso', 'servicios', 'posición']);
  });
  it('E4: denegar permiso no consulta servicios ni GPS', async () => {
    const fuente = fuenteGps({
      pedirPermiso: async () => false,
      serviciosActivos: async () => assert.fail('No consultar servicios sin permiso'),
      obtenerPosicion: async () => assert.fail('No consultar GPS sin permiso'),
    });
    await assert.rejects(obtenerUbicacionActual(fuente), /No diste permiso/);
  });
  it('E4: informa servicios apagados sin consultar la posición', async () => {
    const fuente = fuenteGps({
      serviciosActivos: async () => false,
      obtenerPosicion: async () => assert.fail('No consultar posición con servicios apagados'),
    });
    await assert.rejects(obtenerUbicacionActual(fuente), /está apagada/);
  });
  it('ER2: un fallo nativo conserva la alternativa manual y no expone datos internos', async () => {
    await assert.rejects(
      obtenerUbicacionActual(
        fuenteGps({
          obtenerPosicion: async () => {
            throw new Error('Detalle interno');
          },
        }),
      ),
      { message: 'No pudimos obtener tu ubicación. Reintentá o marcá el punto manualmente.' },
    );
  });
  it('E4: rechaza coordenadas y precisión inválidas del dispositivo', async () => {
    for (const posicion of [
      { ...posicionGps, lat: NaN },
      { ...posicionGps, lng: 181 },
      { ...posicionGps, precisionMetros: -1 },
    ]) {
      await assert.rejects(obtenerUbicacionActual(fuenteGps({ obtenerPosicion: async () => posicion })), /ubicación inválida/);
    }
    assert.equal(
      (await obtenerUbicacionActual(fuenteGps({ obtenerPosicion: async () => ({ ...posicionGps, precisionMetros: null }) })))
        .precisionMetros,
      null,
    );
  });
  it('A1: cancelar antes de iniciar no solicita permiso', async () => {
    const controlador = new globalThis.AbortController();
    controlador.abort();
    await assert.rejects(
      obtenerUbicacionActual(fuenteGps({ pedirPermiso: async () => assert.fail('Solicitud cancelada') }), controlador.signal),
      /canceló/,
    );
  });
  it('A1: cancelar mientras se pide permiso impide iniciar el GPS tras una respuesta tardía', async () => {
    const permiso = diferida();
    const controlador = new globalThis.AbortController();
    const solicitud = obtenerUbicacionActual(
      fuenteGps({ pedirPermiso: () => permiso.promesa, serviciosActivos: async () => assert.fail('Solicitud cancelada') }),
      controlador.signal,
    );
    controlador.abort();
    await assert.rejects(solicitud, /canceló/);
    permiso.resolver(true);
    await Promise.resolve();
  });
  it('A1: ignora una posición que llega después de cerrar el mapa', async () => {
    const respuesta = diferida();
    const iniciado = diferida();
    const controlador = new globalThis.AbortController();
    const solicitud = obtenerUbicacionActual(
      fuenteGps({
        obtenerPosicion: () => {
          iniciado.resolver();
          return respuesta.promesa;
        },
      }),
      controlador.signal,
    );
    await iniciado.promesa;
    controlador.abort();
    await assert.rejects(solicitud, /canceló/);
    respuesta.resolver({
      get lat() {
        return assert.fail('No leer la posición después de cancelar');
      },
    });
    await Promise.resolve();
  });
  it('ER2: limita la espera de GPS e ignora su respuesta tardía', async () => {
    const respuesta = diferida();
    await assert.rejects(
      obtenerUbicacionActual(fuenteGps({ obtenerPosicion: () => respuesta.promesa }), undefined, 5),
      /tardando demasiado/,
    );
    respuesta.resolver({
      get lat() {
        return assert.fail('No leer posición vencida');
      },
    });
    await Promise.resolve();
  });
});
