import { pedir } from './cliente';

/** CU40: a dónde lleva una notificación al seleccionarla. */
export type DestinoNotificacion = { tipo: 'actividad'; id: string } | { tipo: 'usuario'; id: string };

export interface Notificacion {
  id: string;
  tipo: string;
  texto: string;
  destino: DestinoNotificacion | null;
  leida: boolean;
  /** ISO 8601 */
  creadaEn: string;
}

export interface PaginaNotificaciones {
  notificaciones: Notificacion[];
  hayMas: boolean;
}

interface CantidadNoLeidas {
  cantidad: number;
}

/** CU40 FP paso 3 y A2: de a 20; "antesDe" es el id de la última ya mostrada. */
export function listarNotificaciones(antesDe: string | null): Promise<PaginaNotificaciones> {
  const consulta = antesDe ? `?antesDe=${encodeURIComponent(antesDe)}` : '';
  return pedir<PaginaNotificaciones>(`/api/notificaciones${consulta}`);
}

/** CU40 FP paso 1: cantidad sin leer, para el indicador. */
export async function contarNotificacionesNoLeidas(): Promise<number> {
  const { cantidad } = await pedir<CantidadNoLeidas>('/api/notificaciones/no-leidas');
  return cantidad;
}

/** CU40 FP paso 6: devuelve la cantidad sin leer confirmada por la API. */
export async function marcarNotificacionLeida(id: string): Promise<number> {
  const { cantidad } = await pedir<CantidadNoLeidas>(`/api/notificaciones/${encodeURIComponent(id)}/leida`, {
    metodo: 'PATCH',
  });
  return cantidad;
}

/** CU40 A5: descarta (elimina) una notificación; devuelve la cantidad sin leer que queda. */
export async function descartarNotificacion(id: string): Promise<number> {
  const { cantidad } = await pedir<CantidadNoLeidas>(`/api/notificaciones/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
  return cantidad;
}

/** CU40 A1: marca las recibidas hasta "hasta"; devuelve la cantidad sin leer que queda. */
export async function marcarTodasLasNotificacionesLeidas(hasta: Date): Promise<number> {
  const { cantidad } = await pedir<CantidadNoLeidas>('/api/notificaciones/marcar-todas-leidas', {
    metodo: 'POST',
    cuerpo: { hasta: hasta.toISOString() },
  });
  return cantidad;
}
