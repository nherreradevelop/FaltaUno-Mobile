import { pedir } from './cliente';
import type { DetalleActividad, PaginaDeParticipantes } from './tipos';

/** CU09 FP. */
export function obtenerDetalleDeActividad(actividadId: string): Promise<DetalleActividad> {
  return pedir<DetalleActividad>(`/api/actividades/${encodeURIComponent(actividadId)}`);
}

/** CU09 A1: participantes de a 20. */
export function obtenerParticipantes(actividadId: string, pagina: number): Promise<PaginaDeParticipantes> {
  return pedir<PaginaDeParticipantes>(`/api/actividades/${encodeURIComponent(actividadId)}/participantes?pagina=${pagina}`);
}
