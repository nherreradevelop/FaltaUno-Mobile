import { ErrorApi, pedir } from './cliente';
import type {
  ActividadEncontrada,
  DetalleActividad,
  FiltrosDeBusqueda,
  OrganizadorEncontrado,
  PaginaDeParticipantes,
  ResultadoDeBusqueda,
  UbicacionDelUsuario,
} from './tipos';

/** CU08 ER4: la respuesta llegó, pero no tiene la forma esperada. */
const MENSAJE_RESPUESTA_INVALIDA = 'Ocurrió un error al cargar las actividades. Probá de nuevo más tarde.';

/** Arma el query string: los filtros con varios valores van separados por coma y los vacíos no se envían. */
function aParametrosDeBusqueda(
  filtros: FiltrosDeBusqueda,
  pagina: number,
  ubicacion: UbicacionDelUsuario | null,
): URLSearchParams {
  const parametros = new URLSearchParams();
  if (filtros.deportes.length > 0) parametros.set('deportes', filtros.deportes.join(','));
  if (filtros.departamentos.length > 0) parametros.set('departamentos', filtros.departamentos.join(','));
  if (filtros.niveles.length > 0) parametros.set('niveles', filtros.niveles.join(','));
  if (filtros.franjas.length > 0) parametros.set('franjas', filtros.franjas.join(','));
  if (filtros.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.cupoMaximo !== null) parametros.set('cupoMaximo', String(filtros.cupoMaximo));
  // RN1: la ubicación solo se usa para ordenar por cercanía; sin permiso, se ordena solo por fecha
  if (ubicacion) {
    parametros.set('lat', String(ubicacion.lat));
    parametros.set('lng', String(ubicacion.lng));
  }
  parametros.set('pagina', String(pagina));
  return parametros;
}

function esOrganizadorValido(valor: unknown): boolean {
  if (valor === null) {
    return true; // el organizador cerró su cuenta
  }
  const organizador = valor as Partial<OrganizadorEncontrado> | undefined;
  const valoracion = organizador?.valoracionPromedio;
  return (
    typeof organizador?.id === 'string' &&
    typeof organizador.nombre === 'string' &&
    (valoracion === null || typeof valoracion === 'number')
  );
}

function esActividadEncontrada(valor: unknown): valor is ActividadEncontrada {
  const actividad = valor as Partial<ActividadEncontrada> | null;
  return (
    typeof actividad?.id === 'string' &&
    typeof actividad.nombre === 'string' &&
    typeof actividad.deporte?.nombre === 'string' &&
    typeof actividad.fechaHoraInicio === 'string' &&
    !Number.isNaN(Date.parse(actividad.fechaHoraInicio)) &&
    typeof actividad.departamento === 'string' &&
    typeof actividad.nivel === 'string' &&
    typeof actividad.cuposLibres === 'number' &&
    esOrganizadorValido(actividad.organizador) &&
    typeof actividad.esOrganizador === 'boolean'
  );
}

/** CU08 ER4: valida la forma de la respuesta antes de mostrarla. */
function validarResultado(valor: unknown): ResultadoDeBusqueda {
  const resultado = valor as Partial<ResultadoDeBusqueda> | null;
  const esValido =
    Array.isArray(resultado?.actividades) &&
    resultado.actividades.every(esActividadEncontrada) &&
    typeof resultado.pagina === 'number' &&
    typeof resultado.hayMas === 'boolean';
  if (!esValido) {
    throw new ErrorApi(0, 'RESPUESTA_INVALIDA', MENSAJE_RESPUESTA_INVALIDA);
  }
  return resultado as ResultadoDeBusqueda;
}

/** CU08 FP y A1 a A6: actividades disponibles, de a 10. */
export async function buscarActividades(
  filtros: FiltrosDeBusqueda,
  pagina: number,
  ubicacion: UbicacionDelUsuario | null,
): Promise<ResultadoDeBusqueda> {
  const parametros = aParametrosDeBusqueda(filtros, pagina, ubicacion);
  const respuesta = await pedir<unknown>(`/api/actividades?${parametros.toString()}`);
  return validarResultado(respuesta);
}

/** CU08 A5: opciones del filtro de departamento. */
export function listarDepartamentos(): Promise<string[]> {
  return pedir<string[]>('/api/actividades/departamentos');
}

/** CU09 FP. */
export function obtenerDetalleDeActividad(actividadId: string): Promise<DetalleActividad> {
  return pedir<DetalleActividad>(`/api/actividades/${encodeURIComponent(actividadId)}`);
}

/** CU09 A1: participantes de a 20. */
export function obtenerParticipantes(actividadId: string, pagina: number): Promise<PaginaDeParticipantes> {
  return pedir<PaginaDeParticipantes>(`/api/actividades/${encodeURIComponent(actividadId)}/participantes?pagina=${pagina}`);
}
