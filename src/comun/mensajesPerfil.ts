import { ErrorApi } from '../api/cliente';
import type { EstadoActividad } from '../api/tipos';

/** CU04 ER1: no se pudo recuperar el perfil; se sugiere reintentar más tarde. */
const MENSAJE_FALLA_PERFIL = 'No fue posible cargar el perfil en este momento. Probá de nuevo más tarde.';
/** CU04 ER1 aplicado al historial (FP paso 2). */
export const MENSAJE_FALLA_HISTORIAL = 'No fue posible cargar tus actividades en este momento. Probá de nuevo más tarde.';

export type ResultadoDeError = { tipo: 'noDisponible'; mensaje: string } | { tipo: 'falla'; mensaje: string };

/** Distingue E1 (el perfil no existe) de ER1 (falla técnica), que es el único caso en que tiene sentido reintentar. */
export function clasificarErrorDePerfil(error: unknown): ResultadoDeError {
  if (error instanceof ErrorApi && error.codigo === 'PERFIL_NO_DISPONIBLE') {
    return { tipo: 'noDisponible', mensaje: error.message }; // CU04 E1: el texto lo define la API
  }
  return { tipo: 'falla', mensaje: MENSAJE_FALLA_PERFIL };
}

export const ETIQUETA_ESTADO: Record<EstadoActividad, string> = {
  programada: 'Programada',
  iniciada: 'Iniciada',
  archivada: 'Archivada',
  cancelada: 'Cancelada',
};
