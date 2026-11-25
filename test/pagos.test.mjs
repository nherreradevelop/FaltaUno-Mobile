import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { montoEditablePago, maximoParaPago, validarMontoPago } from '../src/comun/pagos.ts';
describe('CU26 – importes sugeridos y validación de pagos', () => {
  it('FP4: propone el total exacto, incluido un centésimo', () => {
    assert.equal(montoEditablePago(1), '0,01');
    assert.equal(montoEditablePago(12345), '123,45');
    assert.equal(maximoParaPago(null, { montoCentesimos: 12345 }), 12345);
  });
  it('RN3: permite total y parcial', () => {
    assert.equal(validarMontoPago(1, 300), null);
    assert.equal(validarMontoPago(300, 300), null);
  });
  it('E1: explica el máximo para monto vacío, cero, negativo, fraccionario o superior', () => {
    for (const valor of [null, NaN, Infinity, 0, -1, 1.5, 301]) assert.match(validarMontoPago(valor, 300), /3,00/);
  });
  it('E2: no habilita un pago si desaparece la deuda', () => {
    assert.match(validarMontoPago(1, 0), /0,00/);
    assert.equal(maximoParaPago(null, null), 0);
  });
  it('CU24: usa el máximo del servidor sin inferirlo del balance neto', () => {
    const pago = { montoCentesimos: 100, maximoCentesimos: 300 };
    assert.equal(maximoParaPago(pago, { montoCentesimos: 200 }), 300);
    assert.equal(maximoParaPago({ ...pago, maximoCentesimos: 0 }, { montoCentesimos: 500 }), 0);
    assert.equal(pago.montoCentesimos, 100);
  });
});
