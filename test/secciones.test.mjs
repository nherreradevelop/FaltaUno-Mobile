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
const { SECCIONES, SIN_NOVEDADES, etiquetaDeSeccion, indicadorDeSeccion } = await import('../src/navegacion/secciones.ts');

const seccion = (clave) => SECCIONES.find((s) => s.clave === clave);

describe('CU39 – menú de navegabilidad', () => {
  it('RN2: las opciones y su orden son fijos', () => {
    assert.deepEqual(
      SECCIONES.map((s) => s.titulo),
      ['Explorar', 'Mis actividades', 'Mensajes', 'Amigos', 'Perfil'],
    );
    assert.deepEqual(Object.keys(SIN_NOVEDADES).sort(), SECCIONES.map((s) => s.clave).sort());
  });

  it('RN5: el indicador muestra hasta 9, "9+" desde 10 y nada con cero', () => {
    assert.equal(indicadorDeSeccion(seccion('mensajes'), 0), undefined);
    assert.equal(indicadorDeSeccion(seccion('mensajes'), 3), '3');
    assert.equal(indicadorDeSeccion(seccion('amigos'), 9), '9');
    assert.equal(indicadorDeSeccion(seccion('mis-actividades'), 10), '9+');
  });

  it('FP paso 4: Explorar y Perfil no tienen indicador', () => {
    assert.equal(indicadorDeSeccion(seccion('explorar'), 5), undefined);
    assert.equal(indicadorDeSeccion(seccion('perfil'), 5), undefined);
  });

  it('RN7: la etiqueta accesible incluye el indicador', () => {
    assert.equal(etiquetaDeSeccion(seccion('mensajes'), 3), 'Mensajes, 3 sin leer');
    assert.equal(etiquetaDeSeccion(seccion('mis-actividades'), 1), 'Mis actividades, 1 invitación pendiente');
    assert.equal(etiquetaDeSeccion(seccion('mis-actividades'), 2), 'Mis actividades, 2 invitaciones pendientes');
    assert.equal(etiquetaDeSeccion(seccion('amigos'), 1), 'Amigos, 1 solicitud de amistad');
    assert.equal(etiquetaDeSeccion(seccion('amigos'), 12), 'Amigos, 12 solicitudes de amistad');
  });

  it('RN7: sin novedades la etiqueta es solo el nombre de la sección', () => {
    assert.equal(etiquetaDeSeccion(seccion('mensajes'), 0), 'Mensajes');
    assert.equal(etiquetaDeSeccion(seccion('perfil'), 4), 'Perfil');
  });
});
