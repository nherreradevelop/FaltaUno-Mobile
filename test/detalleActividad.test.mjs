import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { registerHooks } from 'node:module';

const cliente =
  'data:text/javascript,' +
  encodeURIComponent(`
  export class ErrorApi extends Error {
    constructor(estado, codigo, mensaje) { super(mensaje); this.estado=estado; this.codigo=codigo; }
  }
  export async function pedir(ruta) { globalThis.__ultimaRutaDetalle=ruta; return globalThis.__respuestaDetalle; }
`);
registerHooks({
  resolve(specifier, contexto, siguiente) {
    if (specifier === './cliente' && contexto.parentURL?.endsWith('/api/actividades.ts'))
      return { url: cliente, shortCircuit: true };
    try {
      return siguiente(specifier, contexto);
    } catch (error) {
      if (specifier.startsWith('.') && error.code === 'ERR_MODULE_NOT_FOUND') return siguiente(specifier + '.ts', contexto);
      throw error;
    }
  },
});
const { obtenerDetalleDeActividad } = await import('../src/api/actividades.ts');
const detalle = {
  id: 'actividad-1',
  nombre: 'Surf',
  deporte: { id: 1, nombre: 'Surf' },
  estado: 'programada',
  fechaHoraInicio: '2026-12-01T00:22:00Z',
  fechaLimiteGastos: null,
  nivel: 'intermedio',
  descripcion: null,
  origen: null,
  destino: { direccion: 'La Aguada', lat: -34.65, lng: -54.15 },
  cupoMaximo: 5,
  cuposOcupados: 2,
  organizador: null,
  costoEstimadoCentesimos: null,
  pronostico: null,
  miRol: 'ninguno',
  opciones: ['verMapa'],
};
describe('CU09 H01 contrato del detalle', () => {
  for (const [nombre, valor] of [
    ['objeto vacío', {}],
    ['null', null],
    ['arreglo', []],
    ['texto', 'error'],
    ['opciones ausentes', { ...detalle, opciones: undefined }],
    ['opción desconocida', { ...detalle, opciones: ['__proto__'] }],
    ['opciones inválidas', { ...detalle, opciones: {} }],
    ['deporte incompleto', { ...detalle, deporte: {} }],
    ['fecha inválida', { ...detalle, fechaHoraInicio: 'mañana' }],
    ['plazo inválido', { ...detalle, fechaLimiteGastos: 'no-es-fecha' }],
    ['destino incompleto', { ...detalle, destino: {} }],
    ['coordenadas inválidas', { ...detalle, destino: { ...detalle.destino, lat: null } }],
    ['organizador incompleto', { ...detalle, organizador: { id: '1' } }],
    ['pronóstico incompleto', { ...detalle, pronostico: { resumen: 'Bueno' } }],
    ['rol desconocido', { ...detalle, miRol: 'admin' }],
    ['estado desconocido', { ...detalle, estado: 'finalizada' }],
    ['cupo inválido', { ...detalle, cupoMaximo: '5' }],
    ['costo inválido', { ...detalle, costoEstimadoCentesimos: 1.2 }],
  ]) {
    it('ER1: controla ' + nombre + ' aunque el HTTP sea 200', async () => {
      globalThis.__respuestaDetalle = valor;
      await assert.rejects(obtenerDetalleDeActividad('actividad-1'), (e) => e.codigo === 'RESPUESTA_INVALIDA');
    });
  }
  it('FP: conserva los nulos permitidos y el contrato válido', async () => {
    globalThis.__respuestaDetalle = detalle;
    assert.strictEqual(await obtenerDetalleDeActividad('actividad-1'), detalle);
  });
  it('ER1: permite recuperar el detalle con un reintento válido', async () => {
    globalThis.__respuestaDetalle = {};
    await assert.rejects(obtenerDetalleDeActividad('actividad-1'));
    globalThis.__respuestaDetalle = {
      ...detalle,
      organizador: { id: 'u', nombre: 'Ana', fotoUrl: null },
      origen: detalle.destino,
      fechaLimiteGastos: '2026-12-04T12:00:00Z',
      pronostico: {
        resumen: 'Apto',
        nivelRecomendado: null,
        interpretacionDisponible: false,
        fechaGeneracion: '2026-11-14T12:00:00Z',
      },
    };
    assert.equal((await obtenerDetalleDeActividad('actividad-1')).nombre, 'Surf');
  });
});
