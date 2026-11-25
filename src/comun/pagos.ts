import type { Balance } from '../api/gastos';
import type { Pago } from '../api/pagos';

/** CU26 FP4 / CU24: sugerencia exacta; no se modifica el registro original. */
export function montoEditablePago(monto: number): string {
  return `${Math.trunc(monto / 100)},${String(monto % 100).padStart(2, '0')}`;
}
/** El detalle devuelve el máximo excluyendo el pago anterior, incluso si se invirtió la deuda. */
export function maximoParaPago(pago: Pago | null, balance: Balance | null): number {
  if (pago) return pago.maximoCentesimos ?? 0;
  return balance?.montoCentesimos ?? 0;
}
/** E1: tanto el formulario como el servidor informan el máximo permitido. */
export function validarMontoPago(monto: number | null, maximo: number): string | null {
  if (monto === null || !Number.isSafeInteger(monto) || monto <= 0 || monto > maximo)
    return `Ingresá un monto mayor que cero y de hasta $ ${montoEditablePago(maximo)}.`;
  return null;
}
