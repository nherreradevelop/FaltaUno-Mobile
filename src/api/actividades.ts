import { pedir } from './cliente';

export interface Coordenadas {
  lat: number;
  lng: number;
}
export interface UbicacionResuelta extends Coordenadas {
  direccion: string;
  departamento: string;
}

export type NivelActividad = 'principiante' | 'intermedio' | 'avanzado';
export interface LugarActividad {
  placeId: string | null;
  tipo?: 'pin';
  descripcion: string;
  lat?: number;
  lng?: number;
  provisional?: boolean;
}
export interface OpcionesActividad {
  deportes: { id: number; nombre: string }[];
  niveles: NivelActividad[];
  maximoParticipantes: number;
  mapasDisponibles: boolean;
  destinoPorDefecto: LugarActividad & Coordenadas;
  pronostico: { disponible: false; mensaje: string };
}
export interface DatosCrearActividad {
  nombre: string;
  descripcion: string;
  deporteId: number;
  fechaHoraInicio: string;
  cupoMaximo: number;
  nivel: NivelActividad;
  origenPlaceId: string | null;
  destinoPlaceId: string | null;
  origenCoordenadas?: Coordenadas;
  destinoCoordenadas?: Coordenadas;
  tieneVehiculo: boolean;
  lugaresVehiculo: number | null;
  requiereVehiculo: boolean;
  invitados: string[];
  costoEstimadoCentavos: number | null;
}
export interface ActividadCreada {
  id: string;
  nombre: string;
  estado: 'programada';
  cantidadParticipantes: number;
  cuposDisponibles: number;
  costoEstimadoCentavos: number | null;
  costoPorPersonaCentavos: number | null;
  destinoProvisional: boolean;
}

/** CU10: catálogo y configuración del mismo servidor para web/mobile. */
export function opcionesActividad(): Promise<OpcionesActividad> {
  return pedir('/api/actividades/opciones');
}
/** El token de búsqueda agrupa las predicciones; nunca es una credencial de acceso. */
export function buscarUbicaciones(texto: string, sesion: string): Promise<LugarActividad[]> {
  return pedir(`/api/actividades/ubicaciones?${new URLSearchParams({ texto, sesion }).toString()}`);
}
/** Valida un pin por geocodificación inversa sin sustituir sus coordenadas. */
export function resolverPunto(punto: Coordenadas): Promise<UbicacionResuelta> {
  return pedir('/api/actividades/ubicaciones/punto?' + new URLSearchParams({ lat: String(punto.lat), lng: String(punto.lng) }));
}
/** Consulta solo al abrir el mapa sobre un lugar ya seleccionado. */
export function detalleUbicacion(placeId: string): Promise<UbicacionResuelta> {
  return pedir('/api/actividades/ubicaciones/detalle?' + new URLSearchParams({ placeId }));
}
/** Reusar la misma clave si se perdió la confirmación de este intento. */
export function crearActividad(datos: DatosCrearActividad, clave: string): Promise<ActividadCreada> {
  return pedir('/api/actividades', { metodo: 'POST', cuerpo: datos, claveIdempotencia: clave });
}
