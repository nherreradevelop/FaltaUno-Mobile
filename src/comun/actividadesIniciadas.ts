import type { ActividadIniciada, ResultadoDeIniciadas } from '../api/tipos';

export const MENSAJE_FALLA_INICIADAS = 'No pudimos cargar tus actividades iniciadas. Probá de nuevo.';
export const MENSAJE_SIN_INICIADAS = 'Todavía no participás en ninguna actividad iniciada.';

function esFecha(valor: unknown): valor is string {
  return typeof valor === 'string' && !Number.isNaN(Date.parse(valor));
}

function esActividadIniciada(valor: unknown): valor is ActividadIniciada {
  const actividad = valor as Partial<ActividadIniciada> | null;
  return (
    typeof actividad?.id === 'string' &&
    typeof actividad.nombre === 'string' &&
    typeof actividad.deporte?.id === 'number' &&
    typeof actividad.deporte.nombre === 'string' &&
    actividad.estado === 'iniciada' &&
    esFecha(actividad.fechaHoraInicio) &&
    esFecha(actividad.fechaLimiteGastos) &&
    typeof actividad.departamento === 'string' &&
    typeof actividad.esOrganizador === 'boolean'
  );
}

/** CU42 ER3: no mostrar como vacío un resultado incompleto o de otra página. */
export function esResultadoDeIniciadas(valor: unknown, pagina: number): valor is ResultadoDeIniciadas {
  const resultado = valor as Partial<ResultadoDeIniciadas> | null;
  return (
    Array.isArray(resultado?.actividades) &&
    resultado.actividades.length <= 10 &&
    resultado.actividades.every(esActividadIniciada) &&
    new Set(resultado.actividades.map((actividad) => actividad.id)).size === resultado.actividades.length &&
    resultado.pagina === pagina &&
    typeof resultado.hayMas === 'boolean'
  );
}

/** CU42 A1: conserva los resultados y evita duplicados si cambió la lista entre páginas. */
export function unirActividadesIniciadas(anteriores: ActividadIniciada[], nuevas: ActividadIniciada[]): ActividadIniciada[] {
  const porId = new Map(anteriores.map((actividad) => [actividad.id, actividad]));
  for (const actividad of nuevas) porId.set(actividad.id, actividad);
  return [...porId.values()];
}
