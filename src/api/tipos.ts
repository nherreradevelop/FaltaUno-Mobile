/** Tipos de las respuestas de la API (ver Swagger en /api/docs). */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  fotoUrl: string | null;
}

export interface RespuestaLogin {
  token: string;
  venceEn: string;
  usuario: UsuarioSesion;
}

export interface Deporte {
  id: number;
  nombre: string;
}

/** CU04 A1 / RN1: información pública del perfil de otro usuario. */
export interface PerfilPublico {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  biografia: string | null;
  deportes: Deporte[];
  valoracionPromedio: number | null;
  /** Cantidad de actividades archivadas o canceladas en las que participó. */
  cantidadActividades: number;
  esPropio: false;
}

/** CU04 FP: el perfil propio agrega el correo y la cantidad de valoraciones; en lugar de la cantidad de actividades, muestra el historial. */
export interface PerfilPropio extends Omit<PerfilPublico, 'esPropio' | 'cantidadActividades'> {
  email: string;
  cantidadValoraciones: number;
  esPropio: true;
}

export type Perfil = PerfilPublico | PerfilPropio;

export type EstadoActividad = 'programada' | 'iniciada' | 'archivada' | 'cancelada';

export interface ActividadDelHistorial {
  id: string;
  nombre: string;
  deporte: string;
  fechaHoraInicio: string;
  estado: EstadoActividad;
}

export interface Historial {
  actividades: ActividadDelHistorial[];
  pagina: number;
  hayMas: boolean;
}
