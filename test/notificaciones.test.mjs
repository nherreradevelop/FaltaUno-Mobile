import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';

// Los módulos de src importan sin extensión (como los resuelve Vite): se agrega ".ts" al resolverlos acá
registerHooks({
  resolve(specifier, contexto, siguiente) {
    try {
      return siguiente(specifier, contexto);
    } catch (error) {
      if (specifier.startsWith('.') && error.code === 'ERR_MODULE_NOT_FOUND') return siguiente(specifier + '.ts', contexto);
      throw error;
    }
  },
});
const { agregarAlPrincipio, etiquetaDelIcono, haceCuanto, marcarLeidaEnLaLista, rutaDeDestino, textoDelIndicador } =
  await import('../src/notificaciones/notificaciones.ts');
const { formatearFecha } = await import('../src/comun/formato.ts');

const notificacion = (id) => ({ id, tipo: 'actividadCancelada', texto: 't', destino: null, leida: false, creadaEn: '' });

describe('CU40 – notificaciones en mobile', () => {
  it('RN4: el indicador muestra hasta 9, "9+" desde 10 y nada con cero', () => {
    assert.equal(textoDelIndicador(0), null);
    assert.equal(textoDelIndicador(1), '1');
    assert.equal(textoDelIndicador(9), '9');
    assert.equal(textoDelIndicador(10), '9+');
    assert.equal(textoDelIndicador(57), '9+');
  });

  it('RN9: el texto alternativo incluye la cantidad sin leer', () => {
    assert.equal(etiquetaDelIcono(0), 'Notificaciones');
    assert.equal(etiquetaDelIcono(3), 'Notificaciones, 3 sin leer');
  });

  it('FP paso 7: lleva a la actividad o al perfil, y a ningún lado si no tiene destino', () => {
    assert.equal(rutaDeDestino({ tipo: 'actividad', id: 'a1' }), '/actividades/a1');
    assert.equal(rutaDeDestino({ tipo: 'usuario', id: 'u1' }), '/perfil/u1');
    assert.equal(rutaDeDestino(null), null);
  });

  it('A3: una nueva se agrega al principio y no se duplica si ya estaba', () => {
    const lista = [notificacion('2'), notificacion('1')];
    assert.deepEqual(
      agregarAlPrincipio(lista, notificacion('3')).map((n) => n.id),
      ['3', '2', '1'],
    );
    assert.equal(agregarAlPrincipio(lista, notificacion('2')), lista);
  });

  it('A5: marcar una como leída sin abrirla cambia solo esa y conserva el orden', () => {
    const lista = [notificacion('3'), notificacion('2'), notificacion('1')];
    const resultado = marcarLeidaEnLaLista(lista, '2');
    assert.deepEqual(
      resultado.map((n) => [n.id, n.leida]),
      [
        ['3', false],
        ['2', true],
        ['1', false],
      ],
    );
    assert.equal(lista[1].leida, false); // no modifica la lista original
    assert.deepEqual(marcarLeidaEnLaLista(lista, 'no-existe'), lista);
  });

  it('FP paso 4: indica hace cuánto llegó cada notificación', () => {
    const ahora = new Date('2026-11-19T21:00:00Z');
    assert.equal(haceCuanto('2026-11-19T20:59:30Z', ahora), 'Recién');
    assert.equal(haceCuanto('2026-11-19T20:45:00Z', ahora), 'Hace 15 min');
    assert.equal(haceCuanto('2026-11-19T18:00:00Z', ahora), 'Hace 3 h');
    assert.equal(haceCuanto('2026-11-18T19:00:00Z', ahora), 'Ayer');
    assert.equal(haceCuanto('2026-11-15T21:00:00Z', ahora), 'Hace 4 días');
    assert.equal(haceCuanto('2026-11-01T15:00:00Z', ahora), formatearFecha('2026-11-01T15:00:00Z'));
  });
});
