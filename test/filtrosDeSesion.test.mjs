import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { registerHooks } from 'node:module';
import { FILTROS_INICIALES, sonFiltrosValidos } from '../src/comun/filtrosDeSesion.ts';

const datos = new Map();
globalThis.__datosSesionPrueba = datos;
globalThis.localStorage = {
  getItem: (clave) => datos.get(clave) ?? null,
  setItem: (clave, valor) => datos.set(clave, valor),
  removeItem: (clave) => datos.delete(clave),
};
const secureStore =
  'data:text/javascript,' +
  encodeURIComponent(`
  export async function getItemAsync(clave) { return globalThis.__datosSesionPrueba.get(clave) ?? null; }
  export async function setItemAsync(clave, valor) { await new Promise(resolve => setTimeout(resolve, 0)); globalThis.__datosSesionPrueba.set(clave, valor); }
  export async function deleteItemAsync(clave) { await new Promise(resolve => setTimeout(resolve, 0)); globalThis.__datosSesionPrueba.delete(clave); }
`);
registerHooks({
  resolve(specifier, contexto, siguiente) {
    if (specifier === 'expo-secure-store') return { url: secureStore, shortCircuit: true };
    try {
      return siguiente(specifier, contexto);
    } catch (error) {
      if (specifier.startsWith('.') && error.code === 'ERR_MODULE_NOT_FOUND') return siguiente(specifier + '.ts', contexto);
      throw error;
    }
  },
});
const { almacenSesion } = await import('../src/sesion/almacenSesion.ts');
const usuario = { id: 'usuario-1', nombre: 'Ana', email: 'ana@test.invalid', fotoUrl: null };
const sesion = { token: 'token-prueba-1', usuario };
const filtros = { ...FILTROS_INICIALES, deportes: [1, 3], departamentos: ['Rocha'], desde: '2026-12-01', hasta: '2026-12-20' };

afterEach(async () => {
  await almacenSesion.cerrar();
  datos.clear();
});

describe('CU08 dashboard: filtros durante la sesión', () => {
  it('la primera visita queda pendiente del perfil y los filtros aplicados sobreviven a una recarga', async () => {
    await almacenSesion.abrir(sesion);
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
    const { almacenSesion: restaurado } = await import('../src/sesion/almacenSesion.ts?recarga=1');
    if (restaurado.cargar) await restaurado.cargar();
    assert.deepEqual(restaurado.filtrosDeBusqueda(), filtros);
  });
  it('quitar todos los deportes es una selección válida y actualizar el usuario no la reemplaza', async () => {
    await almacenSesion.abrir(sesion);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, FILTROS_INICIALES);
    await almacenSesion.abrir({ ...sesion, usuario: { ...usuario, nombre: 'Ana actualizada' } });
    assert.deepEqual(almacenSesion.filtrosDeBusqueda(), FILTROS_INICIALES);
  });
  it('una sesión nueva del mismo usuario y otra cuenta no heredan filtros anteriores', async () => {
    await almacenSesion.abrir(sesion);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
    await almacenSesion.abrir({ ...sesion, token: 'token-nuevo' });
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
    await almacenSesion.guardarFiltrosDeBusqueda('token-nuevo', filtros);
    await almacenSesion.abrir({ token: 'token-otro', usuario: { ...usuario, id: 'usuario-2' } });
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
  });
  it('cerrar sesión durante un guardado no restaura datos en el almacenamiento', async () => {
    await almacenSesion.abrir(sesion);
    const guardado = almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
    const cierre = almacenSesion.cerrar();
    await Promise.all([guardado, cierre]);
    assert.equal(almacenSesion.actual(), null);
    assert.equal(datos.get('faltauno.sesion'), undefined);
  });
  it('actualizar el usuario durante un guardado conserva filtros y notifica el usuario vigente', async () => {
    await almacenSesion.abrir(sesion);
    let notificada;
    const desuscribir = almacenSesion.cambios.suscribir((valor) => {
      notificada = valor;
    });
    try {
      const actualizacion = almacenSesion.abrir({ ...sesion, usuario: { ...usuario, nombre: 'Nombre actualizado' } });
      const guardado = almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
      await Promise.all([actualizacion, guardado]);
      assert.equal(notificada.usuario.nombre, 'Nombre actualizado');
      assert.deepEqual(almacenSesion.filtrosDeBusqueda(), filtros);
    } finally {
      desuscribir();
    }
  });
  it('el vencimiento elimina los filtros junto con la sesión', async () => {
    await almacenSesion.abrir(sesion);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, filtros);
    await almacenSesion.cerrarPorVencimiento();
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
    assert.equal(datos.get('faltauno.sesion'), undefined);
  });
  it('descarta filtros corruptos o inválidos antes de volver a consultar la API', async () => {
    for (const valor of [
      null,
      {},
      { ...filtros, deportes: 'surf' },
      { ...filtros, niveles: ['experto'] },
      { ...filtros, cupoMaximo: -1 },
      { ...filtros, hasta: '2026-11-01' },
    ])
      assert.equal(sonFiltrosValidos(valor), false);
    await almacenSesion.abrir(sesion);
    await almacenSesion.guardarFiltrosDeBusqueda(sesion.token, { ...filtros, cupoMaximo: -1 });
    assert.equal(almacenSesion.filtrosDeBusqueda(), null);
  });
});
