import type { DestinoNotificacion, Notificacion } from '../api/notificaciones';
import { formatearFecha } from '../comun/formato';

/** Eventos del canal en tiempo real; los mismos nombres que usa la API (notificaciones.servicio.ts). */
export const EVENTOS_EN_VIVO = {
  nueva: 'notificaciones:nueva',
  noLeidas: 'notificaciones:no-leidas',
} as const;

/** Lo que manda la API con cada notificación nueva (A3). */
export interface AvisoDeNotificacionNueva {
  notificacion: Notificacion;
  noLeidas: number;
}

const MAXIMO_EN_EL_INDICADOR = 9;

/** CU40 RN4: el indicador muestra la cantidad hasta 9 y "9+" desde 10; con cero no se muestra (null). */
export function textoDelIndicador(cantidad: number): string | null {
  if (cantidad <= 0) return null;
  if (cantidad > MAXIMO_EN_EL_INDICADOR) return `${MAXIMO_EN_EL_INDICADOR}+`;
  return String(cantidad);
}

/** CU40 RN9: texto alternativo del ícono, con la cantidad sin leer. */
export function etiquetaDelIcono(cantidad: number): string {
  if (cantidad <= 0) return 'Notificaciones';
  return `Notificaciones, ${cantidad} sin leer`;
}

/** CU40 FP paso 7: ruta de la pantalla relacionada, o null si la notificación no lleva a ninguna. */
export function rutaDeDestino(destino: DestinoNotificacion | null): string | null {
  if (destino === null) return null;
  if (destino.tipo === 'actividad') return `/actividades/${destino.id}`;
  return `/perfil/${destino.id}`;
}

/** FP paso 6 y A5: deja como leída una notificación de la lista, sin cambiar el orden ni las demás. */
export function marcarLeidaEnLaLista(lista: Notificacion[], id: string): Notificacion[] {
  return lista.map((notificacion) => (notificacion.id === id ? { ...notificacion, leida: true } : notificacion));
}

/** A3: agrega una notificación nueva al principio de la lista, sin duplicarla si ya estaba. */
export function agregarAlPrincipio(lista: Notificacion[], nueva: Notificacion): Notificacion[] {
  if (lista.some((notificacion) => notificacion.id === nueva.id)) return lista;
  return [nueva, ...lista];
}

const MINUTO_MS = 60 * 1000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

/** CU40 FP paso 4: "hace cuánto" llegó la notificación. Pasada una semana, se muestra la fecha. */
export function haceCuanto(fechaIso: string, ahora: Date = new Date()): string {
  const transcurrido = ahora.getTime() - new Date(fechaIso).getTime();
  if (transcurrido < MINUTO_MS) return 'Recién';
  if (transcurrido < HORA_MS) return `Hace ${Math.floor(transcurrido / MINUTO_MS)} min`;
  if (transcurrido < DIA_MS) return `Hace ${Math.floor(transcurrido / HORA_MS)} h`;
  if (transcurrido < 2 * DIA_MS) return 'Ayer';
  if (transcurrido < 7 * DIA_MS) return `Hace ${Math.floor(transcurrido / DIA_MS)} días`;
  return formatearFecha(fechaIso);
}

/** Mensajes al usuario (CU40). */
export const MENSAJES_NOTIFICACIONES = {
  vacio: 'No tenés notificaciones por ahora.', // E1
  errorAlCargar: 'No pudimos cargar las notificaciones.', // ER1
  errorAlMarcarUna: 'No pudimos marcar la notificación como leída.', // ER2 (A5)
  errorAlMarcarTodas: 'No pudimos marcar las notificaciones como leídas.', // ER2 (A1)
} as const;
