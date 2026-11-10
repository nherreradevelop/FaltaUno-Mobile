import { pedir } from './cliente';
import type { Deporte } from './tipos';

/** CU08 A1: deportes activos, para el filtro por deporte. */
export function listarDeportes(): Promise<Deporte[]> {
  return pedir<Deporte[]>('/api/deportes');
}
