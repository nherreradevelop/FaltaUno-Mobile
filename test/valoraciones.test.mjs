import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';

// Los módulos de src importan sin extensión (como los resuelve Metro): se agrega ".ts" al resolverlos acá
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
const { armarValoracion, etiquetaDelBotonDeValorar, MENSAJES_VALORACION, textoDePendientes } =
  await import('../src/comun/valoraciones.ts');

describe('CU21 – valoración de usuarios en mobile', () => {
  it('E1: sin puntaje no se arma la valoración', () => {
    assert.equal(armarValoracion(null, 'Muy bien'), null);
  });

  it('RN6: el comentario es opcional; vacío o con espacios se envía como null', () => {
    assert.deepEqual(armarValoracion(4, ''), { puntaje: 4, comentario: null });
    assert.deepEqual(armarValoracion(4, '   '), { puntaje: 4, comentario: null });
    assert.deepEqual(armarValoracion(5, '  Muy puntual.  '), { puntaje: 5, comentario: 'Muy puntual.' });
  });

  it('FP paso 2 y A1: indica cuántos participantes faltan valorar', () => {
    assert.equal(textoDePendientes(0), MENSAJES_VALORACION.todosValorados);
    assert.equal(textoDePendientes(1), 'Te falta valorar a 1 participante.');
    assert.equal(textoDePendientes(3), 'Te falta valorar a 3 participantes.');
  });

  it('A2: la etiqueta accesible dice si está pendiente o con cuántas estrellas lo valoraste', () => {
    assert.equal(etiquetaDelBotonDeValorar('Carla', null), 'Valorar a Carla');
    assert.equal(
      etiquetaDelBotonDeValorar('Carla', { puntaje: 4, comentario: null }),
      'Valoraste a Carla con 4 de 5 estrellas. Cambiar valoración',
    );
  });
});
