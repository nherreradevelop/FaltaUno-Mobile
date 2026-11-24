import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  aDatosUnirse,
  clasificarErrorAlUnirse,
  formularioUnirseInicial,
  lugaresParaInvitados,
  MENSAJE_FALLA_AL_UNIRSE,
  textoLugaresParaInvitados,
  validarFormularioUnirse,
} from '../src/comun/formularioUnirse.ts';

function formulario(cambios = {}) {
  return { ...formularioUnirseInicial(), ...cambios };
}

describe('CU11 – formulario para unirse', () => {
  it('FP: sin vehículo, sin punto de partida ni invitados es válido y manda nulls', () => {
    assert.deepEqual(validarFormularioUnirse(formulario()), {});
    assert.deepEqual(aDatosUnirse(formulario()), {
      tieneVehiculo: false,
      lugaresVehiculo: null,
      puntoPartidaPlaceId: null,
      invitados: [],
    });
  });

  it('paso 5: con vehículo exige los lugares como entero no negativo', () => {
    assert.ok(validarFormularioUnirse(formulario({ tieneVehiculo: true, lugaresVehiculo: '' })).lugaresVehiculo);
    assert.ok(validarFormularioUnirse(formulario({ tieneVehiculo: true, lugaresVehiculo: '-1' })).lugaresVehiculo);
    assert.ok(validarFormularioUnirse(formulario({ tieneVehiculo: true, lugaresVehiculo: '1.5' })).lugaresVehiculo);
    assert.deepEqual(validarFormularioUnirse(formulario({ tieneVehiculo: true, lugaresVehiculo: '0' })), {});
  });

  it('paso 5: el punto de partida va como lugar o como pin, nunca los dos', () => {
    const porLugar = aDatosUnirse(formulario({ puntoPartida: { placeId: 'lugar-1', descripcion: 'Tres Cruces' } }));
    assert.equal(porLugar.puntoPartidaPlaceId, 'lugar-1');
    assert.equal(porLugar.puntoPartidaCoordenadas, undefined);

    const porPin = aDatosUnirse(
      formulario({ puntoPartida: { placeId: null, tipo: 'pin', descripcion: 'Pin', lat: -34.9, lng: -56.1 } }),
    );
    assert.equal(porPin.puntoPartidaPlaceId, null);
    assert.deepEqual(porPin.puntoPartidaCoordenadas, { lat: -34.9, lng: -56.1 });
  });

  it('paso 6: cada invitado necesita nombre y se envía sin espacios de más', () => {
    assert.ok(validarFormularioUnirse(formulario({ invitados: ['Ana', ' '] }))['invitados.1']);
    assert.deepEqual(aDatosUnirse(formulario({ invitados: [' Ana '] })).invitados, ['Ana']);
  });

  it('RN5/RN9: el usuario ocupa un lugar y los invitados el resto', () => {
    assert.equal(lugaresParaInvitados(3, 0), 2);
    assert.equal(lugaresParaInvitados(3, 2), 0);
    assert.match(textoLugaresParaInvitados(3, 1), /Queda 1 lugar/);
    assert.match(textoLugaresParaInvitados(1, 0), /No quedan lugares/);
  });
});

describe('CU11 – qué hace la pantalla con cada error', () => {
  const error = (estado, codigo, message = 'Mensaje de la API', campos) => ({ estado, codigo, message, campos });

  it('RN2: YA_PARTICIPA se muestra como éxito (reintento con la respuesta perdida)', () => {
    assert.deepEqual(clasificarErrorAlUnirse(error(409, 'YA_PARTICIPA')), { tipo: 'unido' });
  });

  for (const codigo of ['ACTIVIDAD_COMPLETA', 'ACTIVIDAD_NO_ADMITE_INCORPORACIONES', 'ACTIVIDAD_CANCELADA']) {
    it(`E1/E2/E3: ${codigo} cierra el formulario con el mensaje de la API`, () => {
      assert.deepEqual(clasificarErrorAlUnirse(error(409, codigo, 'No se puede')), { tipo: 'sinLugar', mensaje: 'No se puede' });
    });
  }

  it('RN9: LUGARES_INSUFICIENTES queda junto a los invitados', () => {
    assert.deepEqual(clasificarErrorAlUnirse(error(409, 'LUGARES_INSUFICIENTES', 'Quedan 2 lugares.')), {
      tipo: 'campos',
      campos: { invitados: 'Quedan 2 lugares.' },
    });
  });

  it('Google no disponible: el error queda en el punto de partida', () => {
    assert.deepEqual(clasificarErrorAlUnirse(error(503, 'PUNTOS_NO_DISPONIBLES', 'Sin mapas')), {
      tipo: 'campos',
      campos: { puntoPartida: 'Sin mapas' },
    });
  });

  it('400: los campos de la API se muestran en el formulario', () => {
    const resultado = clasificarErrorAlUnirse(
      error(400, 'DATOS_INVALIDOS', 'Revisá', { ubicacion: 'De Uruguay', 'invitados.0': 'Nombre' }),
    );
    assert.deepEqual(resultado, { tipo: 'campos', campos: { puntoPartida: 'De Uruguay', 'invitados.0': 'Nombre' } });
  });

  it('ER1: falla técnica o sin conexión → mensaje del caso de uso para reintentar', () => {
    assert.deepEqual(clasificarErrorAlUnirse(error(500, 'ERROR_INTERNO')), { tipo: 'falla', mensaje: MENSAJE_FALLA_AL_UNIRSE });
    assert.deepEqual(clasificarErrorAlUnirse(null), { tipo: 'falla', mensaje: MENSAJE_FALLA_AL_UNIRSE });
  });
});
