import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  datosDelFormulario,
  formularioDeGasto,
  leerMontoGasto,
  nombrePersona,
  previsualizarReparto,
  validarFormularioGasto,
} from '../src/comun/gastos.ts';

describe('CU23–CU25 – formulario y reparto de gastos', () => {
  it('CU23 FP/RN6: previsualiza reparto exacto, estable y con invitados', () => {
    const personas = [
      { id: 'p:b', participacionId: 'b' },
      { id: 'i:a', participacionId: 'b' },
      { id: 'p:c', participacionId: 'c' },
    ];
    const partes = previsualizarReparto(100, ['p:c', 'p:b', 'i:a'], personas);
    assert.deepEqual(
      partes.map((p) => p.montoCentesimos),
      [34, 33, 33],
    );
    assert.equal(
      partes.reduce((s, p) => s + p.montoCentesimos, 0),
      100,
    );
    assert.equal(partes[0].participacionId, 'b');
  });
  it('CU23 E1: valida campos y montos sin coma flotante', () => {
    assert.equal(leerMontoGasto('0,01'), 1);
    assert.equal(leerMontoGasto('450.50'), 45050);
    assert.equal(leerMontoGasto('9999999999,99'), 999999999999);
    for (const texto of ['0', '-1', 'NaN', '1e3', '1,123', '1.200,50', '10000000000', ''])
      assert.equal(leerMontoGasto(texto), null);
    const errores = validarFormularioGasto(formularioDeGasto(null));
    assert.deepEqual(Object.keys(errores), ['concepto', 'montoCentesimos', 'pagadorId', 'participantes']);
  });
  it('CU23 E2: al quitar todas las personas, no permite guardar', () => {
    const formulario = { concepto: 'Agua', monto: '50', pagadorId: 'p:a', participantes: [] };
    assert.equal(validarFormularioGasto(formulario).participantes, 'Seleccioná al menos un participante.');
    assert.deepEqual(previsualizarReparto(5000, [], []), []);
  });
  it('CU24 FP/A1: carga los datos vigentes sin modificar el registro original', () => {
    const gasto = { concepto: 'Agua', montoCentesimos: 1234, pagadorId: 'p:a', partes: [{ personaId: 'p:b' }] };
    const formulario = formularioDeGasto(gasto);
    assert.equal(formulario.monto, '12,34');
    formulario.concepto = 'Edición descartada';
    assert.equal(gasto.concepto, 'Agua');
    assert.deepEqual(datosDelFormulario({ ...formulario, concepto: ' Agua ' }), {
      concepto: 'Agua',
      montoCentesimos: 1234,
      pagadorId: 'p:a',
      participantes: ['p:b'],
    });
  });
  it('CU23 RN4: identifica explícitamente al invitado y su responsable', () => {
    assert.equal(
      nombrePersona([{ id: 'i:a', nombre: 'Ana', invitadoId: 'a', responsable: 'Bruno' }], 'i:a'),
      'Ana (invitado de Bruno)',
    );
    assert.equal(nombrePersona([], 'p:a'), 'Participante');
  });
});
