import { registerHooks } from 'node:module';
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
const { esHoyEnUruguay } = await import('../src/comun/formato.ts');
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { esResultadoDeIniciadas, unirActividadesIniciadas } from '../src/comun/actividadesIniciadas.ts';

const actividad = {
  id: 'a1',
  nombre: 'Surf',
  deporte: { id: 1, nombre: 'Surf' },
  estado: 'iniciada',
  fechaHoraInicio: '2026-11-20T15:00:00Z',
  fechaLimiteGastos: '2026-12-04T15:00:00Z',
  departamento: 'Rocha',
  esOrganizador: true,
};
const resultado = (actividades = [actividad]) => ({ actividades, pagina: 1, hayMas: false });

describe('CU42 – Actividades iniciadas', () => {
  it('FP y E1: acepta actividades válidas y una lista vacía', () => {
    assert.equal(esResultadoDeIniciadas(resultado(), 1), true);
    assert.equal(esResultadoDeIniciadas(resultado([]), 1), true);
  });
  it('ER3: rechaza fechas, estado, página y datos incompletos', () => {
    for (const cambio of [
      { fechaHoraInicio: 'no-fecha' },
      { fechaLimiteGastos: null },
      { estado: 'programada' },
      { deporte: null },
      { esOrganizador: undefined },
    ]) {
      assert.equal(esResultadoDeIniciadas(resultado([{ ...actividad, ...cambio }]), 1), false);
    }
    for (const respuesta of [null, {}, { ...resultado(), pagina: 2 }, { ...resultado(), hayMas: undefined }]) {
      assert.equal(esResultadoDeIniciadas(respuesta, 1), false);
    }
  });
  it('ER3: rechaza duplicados y páginas de más de diez registros', () => {
    assert.equal(esResultadoDeIniciadas(resultado([actividad, actividad]), 1), false);
    assert.equal(
      esResultadoDeIniciadas(resultado(Array.from({ length: 11 }, (_, i) => ({ ...actividad, id: String(i) }))), 1),
      false,
    );
  });
  it('A1: agrega páginas sin duplicar registros y conserva actualizaciones recibidas', () => {
    const otra = { ...actividad, id: 'a2' };
    const actualizada = { ...actividad, nombre: 'Nombre actualizado' };
    assert.deepEqual(unirActividadesIniciadas([actividad], [actualizada, otra]), [actualizada, otra]);
    assert.deepEqual(unirActividadesIniciadas([actividad], []), [actividad]);
  });
});

describe('CU42 – etiqueta es hoy!', () => {
  const ahora = new Date('2026-11-27T02:00:00Z');
  it('usa el día de Uruguay y sus dos límites, aunque UTC ya cambió de día', () => {
    assert.equal(esHoyEnUruguay('2026-11-26T02:59:59.999Z', ahora), false);
    assert.equal(esHoyEnUruguay('2026-11-26T03:00:00Z', ahora), true);
    assert.equal(esHoyEnUruguay('2026-11-27T02:59:59.999Z', ahora), true);
    assert.equal(esHoyEnUruguay('2026-11-27T03:00:00Z', ahora), false);
  });
  it('no marca fechas inválidas, de ayer o de mañana', () => {
    for (const inicio of ['invalida', '2026-11-25T15:00:00Z', '2026-11-28T15:00:00Z']) {
      assert.equal(esHoyEnUruguay(inicio, ahora), false);
    }
  });
});
