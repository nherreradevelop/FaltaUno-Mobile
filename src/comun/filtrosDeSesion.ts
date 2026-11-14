import type { FiltrosDeBusqueda } from '../api/tipos';

export const FILTROS_INICIALES: FiltrosDeBusqueda = {
  deportes: [],
  departamentos: [],
  niveles: [],
  franjas: [],
  desde: '',
  hasta: '',
  cupoMaximo: null,
};

/** Valida los datos locales antes de recuperar una selección de la sesión. */
export function sonFiltrosValidos(valor: unknown): valor is FiltrosDeBusqueda {
  if (!valor || typeof valor !== 'object') return false;
  const filtros = valor as Partial<FiltrosDeBusqueda>;
  const fechaValida = (fecha: unknown): fecha is string =>
    typeof fecha === 'string' &&
    (fecha === '' || (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha + 'T00:00:00Z'))));
  return (
    Array.isArray(filtros.deportes) &&
    filtros.deportes.every((id) => Number.isInteger(id) && id > 0) &&
    Array.isArray(filtros.departamentos) &&
    filtros.departamentos.every((valor) => typeof valor === 'string') &&
    Array.isArray(filtros.niveles) &&
    filtros.niveles.every((valor) => ['principiante', 'intermedio', 'avanzado'].includes(valor)) &&
    Array.isArray(filtros.franjas) &&
    filtros.franjas.every((valor) => ['manana', 'tarde', 'noche'].includes(valor)) &&
    fechaValida(filtros.desde) &&
    fechaValida(filtros.hasta) &&
    (!filtros.desde || !filtros.hasta || filtros.desde <= filtros.hasta) &&
    (filtros.cupoMaximo === null ||
      (typeof filtros.cupoMaximo === 'number' && Number.isInteger(filtros.cupoMaximo) && filtros.cupoMaximo > 0))
  );
}

interface SesionConFiltros {
  token: string;
  usuario: { id: string };
  filtrosBusqueda?: FiltrosDeBusqueda;
}

/** Actualizar el usuario conserva filtros; un login nuevo nunca hereda los de otra sesión. */
export function conservarFiltrosDeSesion<T extends SesionConFiltros>(anterior: T | null, nueva: T): T {
  const { filtrosBusqueda: _filtrosDescartados, ...sinFiltros } = nueva;
  if (
    anterior?.token === nueva.token &&
    anterior.usuario.id === nueva.usuario.id &&
    sonFiltrosValidos(anterior.filtrosBusqueda)
  ) {
    return { ...sinFiltros, filtrosBusqueda: anterior.filtrosBusqueda } as T;
  }
  return sinFiltros as T;
}
