import { ErrorApi } from '../api/cliente';
import type { FranjaHoraria, NivelActividad } from '../api/tipos';

/** CU08 ER1: no se pudieron recuperar las actividades. */
const MENSAJE_FALLA_BUSQUEDA = 'No fue posible cargar las actividades en este momento. Probá de nuevo más tarde.';

/** CU08 E1: no hay actividades para los filtros aplicados; se sugiere crear una. */
export const MENSAJE_SIN_ACTIVIDADES = 'No encontramos actividades disponibles. ¿Por qué no creás una?';

/** CU08 ER2: qué filtros no pudieron cargarse. */
export function mensajeFallaDeFiltros(filtrosQueFallaron: string[]): string {
  return `No pudimos cargar los filtros de ${filtrosQueFallaron.join(' y ')}. Podés seguir buscando sin ellos o probar de nuevo más tarde.`;
}

/**
 * CU08 ER1 y ER4. El ER4 lo arma api/actividades con su propio texto; cualquier otra falla es ER1.
 * El ER3 (sesión vencida) no llega acá como mensaje: el cliente HTTP cierra la sesión y el layout lleva al login.
 */
export function mensajeDeErrorDeBusqueda(error: unknown): string {
  if (error instanceof ErrorApi && error.codigo === 'RESPUESTA_INVALIDA') {
    return error.message;
  }
  return MENSAJE_FALLA_BUSQUEDA;
}

export const ETIQUETA_NIVEL: Record<NivelActividad, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const ETIQUETA_FRANJA: Record<FranjaHoraria, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
};
