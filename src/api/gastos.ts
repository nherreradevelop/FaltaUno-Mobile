import { pedir } from './cliente';

export interface PersonaGasto {
  id: string;
  participacionId: string;
  invitadoId: string | null;
  usuarioId: string | null;
  nombre: string;
  responsable: string;
}
export interface ParteGasto {
  personaId: string;
  participacionId: string;
  montoCentesimos: number;
}
export interface DatosGasto {
  concepto: string;
  montoCentesimos: number;
  pagadorId: string;
  participantes: string[];
}
export interface Gasto {
  id: string;
  actividadId: string;
  registradoPorId: string;
  concepto: string;
  montoCentesimos: number;
  pagadorId: string;
  version: number;
  fechaRegistro: string;
  eliminado: boolean;
  partes: ParteGasto[];
}
export interface Balance {
  deudorId: string;
  acreedorId: string;
  montoCentesimos: number;
}
export interface OpcionesGasto {
  personas: PersonaGasto[];
  puedeEscribir: boolean;
  motivo: string | null;
  participacionActualId: string;
}
export interface PaginaGastos {
  gastos: Gasto[];
  siguienteCursor: string | null;
  opciones: OpcionesGasto;
}
export interface ResultadoGasto {
  gasto: Gasto;
  sinCambios: boolean;
}
export interface IntentoGasto {
  clave: string;
  accion: 'registrar' | 'editar' | 'eliminar';
  datos: DatosGasto | null;
  gasto: Gasto | null;
}
export type EstadoOperacion = { estado: 'confirmada'; resultado: ResultadoGasto } | { estado: 'noRegistrada' };
const base = (id: string) => `/api/actividades/${encodeURIComponent(id)}`;

export const listarGastos = (id: string, cursor?: string): Promise<PaginaGastos> =>
  pedir(`${base(id)}/gastos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
export const obtenerBalances = (id: string): Promise<Balance[]> => pedir(`${base(id)}/balances`);
export const obtenerGasto = (id: string, gastoId: string): Promise<Gasto> =>
  pedir(`${base(id)}/gastos/${encodeURIComponent(gastoId)}`);
export const consultarOperacionGasto = (id: string, clave: string): Promise<EstadoOperacion> =>
  pedir(`${base(id)}/operaciones-gastos/${encodeURIComponent(clave)}`);

/** El intento conserva exactamente la misma clave, versión y datos durante la verificación y el reenvío. */
export function enviarGasto(id: string, intento: IntentoGasto): Promise<ResultadoGasto> {
  const ruta = `${base(id)}/gastos${intento.gasto ? `/${intento.gasto.id}` : ''}`;
  const cuerpo =
    intento.accion === 'eliminar'
      ? { version: intento.gasto!.version }
      : { ...intento.datos, ...(intento.gasto ? { version: intento.gasto.version } : {}) };
  return pedir(ruta, {
    metodo: { registrar: 'POST', editar: 'PUT', eliminar: 'DELETE' }[intento.accion],
    cuerpo,
    claveIdempotencia: intento.clave,
  });
}
