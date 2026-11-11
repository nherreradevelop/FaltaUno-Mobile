import type { FiltrosDeBusqueda } from '../api/tipos';

/**
 * Lo que el usuario elige en el panel de filtros (CU08 A1 a A6). La cantidad se guarda como texto
 * mientras se escribe y se convierte recién al aplicar.
 */
export interface FiltrosEnEdicion {
  deportes: number[];
  departamentos: string[];
  niveles: FiltrosDeBusqueda['niveles'];
  franjas: FiltrosDeBusqueda['franjas'];
  /** AAAA-MM-DD, o '' sin fecha. La elige el selector de fecha, así que siempre es una fecha válida. */
  desde: string;
  /** AAAA-MM-DD, o '' sin fecha. */
  hasta: string;
  cupoMaximo: string;
}

export interface ErroresDeFiltros {
  hasta?: string;
  cupoMaximo?: string;
}

export const FILTROS_VACIOS: FiltrosEnEdicion = {
  deportes: [],
  departamentos: [],
  niveles: [],
  franjas: [],
  desde: '',
  hasta: '',
  cupoMaximo: '',
};

/** Fecha local del dispositivo → "2026-11-07". Se usa el día del calendario del usuario, no el de UTC. */
export function aFechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "2026-11-07" → la fecha 7/11/2026 a las 00:00 en la hora del dispositivo (para el selector de fecha). */
export function aFechaLocal(fechaIso: string): Date {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** "2026-11-07" → "07/11/2026". */
export function formatearFechaCorta(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Validación de forma, para no llamar a la API con filtros que va a rechazar. */
export function validarFiltros(filtros: FiltrosEnEdicion): ErroresDeFiltros {
  const errores: ErroresDeFiltros = {};
  // Las fechas AAAA-MM-DD se pueden comparar como texto
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta)
    errores.hasta = 'La fecha "hasta" no puede ser anterior a "desde".';

  const cupo = Number(filtros.cupoMaximo);
  if (filtros.cupoMaximo.trim() !== '' && (!Number.isInteger(cupo) || cupo < 1)) {
    errores.cupoMaximo = 'Ingresá un número entero mayor o igual a 1.';
  }
  return errores;
}

export function hayErrores(errores: ErroresDeFiltros): boolean {
  return Object.keys(errores).length > 0;
}

/** Convierte los filtros ya validados al formato de la API. */
export function aFiltrosDeBusqueda(filtros: FiltrosEnEdicion): FiltrosDeBusqueda {
  return {
    deportes: filtros.deportes,
    departamentos: filtros.departamentos,
    niveles: filtros.niveles,
    franjas: filtros.franjas,
    desde: filtros.desde,
    hasta: filtros.hasta,
    cupoMaximo: filtros.cupoMaximo.trim() === '' ? null : Number(filtros.cupoMaximo),
  };
}

/** Cuántos tipos de filtro hay aplicados, para mostrarlo en el botón "Filtros". */
export function cantidadDeFiltrosAplicados(filtros: FiltrosEnEdicion): number {
  const aplicados = [
    filtros.deportes.length > 0,
    filtros.departamentos.length > 0,
    filtros.niveles.length > 0,
    filtros.franjas.length > 0,
    filtros.desde !== '' || filtros.hasta !== '',
    filtros.cupoMaximo.trim() !== '',
  ];
  return aplicados.filter(Boolean).length;
}

/** Agrega el valor si no estaba o lo quita si estaba (filtros con varios valores, CU08 RN5). */
export function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((elemento) => elemento !== valor) : [...lista, valor];
}
