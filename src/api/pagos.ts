import { pedir } from './cliente';
import type { OpcionesGasto, Balance } from './gastos';
export interface Pago {
  id: string;
  actividadId: string;
  pagadorId: string;
  receptorId: string;
  registradoPorId: string;
  montoCentesimos: number;
  version: number;
  fechaRegistro: string;
  eliminado: boolean;
  maximoCentesimos?: number;
}
export interface DatosPago {
  montoCentesimos: number;
  pagadorId?: string;
  receptorId?: string;
}
export interface OpcionesPago extends OpcionesGasto {
  deudas: Balance[];
  historialVencido: boolean;
  historialHasta: string | null;
}
export interface PaginaPagos {
  pagos: Pago[];
  siguienteCursor: string | null;
  opciones: OpcionesPago;
}
export interface ResultadoPago {
  pago: Pago;
  sinCambios: boolean;
}
export interface IntentoPago {
  clave: string;
  accion: 'registrar' | 'editar' | 'eliminar';
  datos: DatosPago | null;
  pago: Pago | null;
}
export type EstadoOperacionPago = { estado: 'confirmada'; resultado: ResultadoPago } | { estado: 'noRegistrada' };
const base = (id: string) => `/api/actividades/${encodeURIComponent(id)}`;
export const listarPagos = (id: string, cursor?: string): Promise<PaginaPagos> =>
  pedir(`${base(id)}/pagos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
export const obtenerPago = (id: string, pagoId: string): Promise<Pago> =>
  pedir(`${base(id)}/pagos/${encodeURIComponent(pagoId)}`);
export const consultarOperacionPago = (id: string, clave: string): Promise<EstadoOperacionPago> =>
  pedir(`${base(id)}/operaciones-pagos/${encodeURIComponent(clave)}`);
/** RNF-23: conserva la clave y la versión exactas durante verificación y reenvío. */
export function enviarPago(id: string, intento: IntentoPago): Promise<ResultadoPago> {
  const ruta = `${base(id)}/pagos${intento.pago ? `/${intento.pago.id}` : ''}`;
  let cuerpo: Record<string, unknown>;
  if (intento.accion === 'eliminar') cuerpo = { version: intento.pago!.version };
  else if (intento.pago) cuerpo = { montoCentesimos: intento.datos!.montoCentesimos, version: intento.pago.version };
  else cuerpo = { ...intento.datos };
  return pedir(ruta, {
    metodo: { registrar: 'POST', editar: 'PUT', eliminar: 'DELETE' }[intento.accion],
    cuerpo,
    claveIdempotencia: intento.clave,
  });
}
