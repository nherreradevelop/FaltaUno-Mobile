import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inicialDelParticipante, puntosDePartidaEnMapa, tituloDelPuntoDePartida } from '../src/comun/puntosDePartida.ts';

const PUNTO = { direccion: 'Tres Cruces', lat: -34.894, lng: -56.166 };

function participante(cambios = {}) {
  return {
    usuario: { id: 'u1', nombre: 'Juan Pérez', fotoUrl: null },
    esOrganizador: false,
    invitadosExternos: [],
    puntoPartida: PUNTO,
    ...cambios,
  };
}

describe('CU09 A2 – puntos de partida en el mapa', () => {
  it('marca a cada participante que indicó punto de partida', () => {
    assert.deepEqual(puntosDePartidaEnMapa([participante()]), [
      { clave: 'u1', nombre: 'Juan Pérez', direccion: 'Tres Cruces', lat: -34.894, lng: -56.166 },
    ]);
  });

  it('el organizador no lleva marcador propio: su punto es la salida de la actividad', () => {
    assert.deepEqual(puntosDePartidaEnMapa([participante({ esOrganizador: true })]), []);
  });

  it('no marca a quien no indicó punto ni a cuentas cerradas (CU33)', () => {
    assert.deepEqual(puntosDePartidaEnMapa([participante({ puntoPartida: null }), participante({ usuario: null })]), []);
  });

  it('el título dice quién sale y desde dónde, y la inicial va en mayúscula', () => {
    const [punto] = puntosDePartidaEnMapa([participante()]);
    assert.equal(tituloDelPuntoDePartida(punto), 'Juan Pérez sale desde Tres Cruces');
    assert.equal(inicialDelParticipante(' ana'), 'A');
  });
});
