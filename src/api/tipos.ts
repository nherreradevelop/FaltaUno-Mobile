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

export type NivelActividad = 'principiante' | 'intermedio' | 'avanzado';

/** CU09 FP paso 3: relación del usuario con la actividad. */
export type RolEnActividad = 'organizador' | 'participante' | 'ninguno';

/** CU09 FP paso 4: opciones que la API habilita según el rol y el estado (RN2). */
export type OpcionDeActividad =
  | 'verParticipantes'
  | 'verMapa'
  | 'unirse'
  | 'abandonar'
  | 'verChat'
  | 'verGastos'
  | 'invitarAmigos'
  | 'modificarParticipacion'
  | 'silenciar'
  | 'valorar'
  | 'compartir'
  | 'editar'
  | 'removerParticipantes'
  | 'cancelar'
  | 'archivar';

export interface Ubicacion {
  direccion: string;
  lat: number;
  lng: number;
}

export interface PronosticoDeActividad {
  resumen: string;
  nivelRecomendado: NivelActividad | null;
  interpretacionDisponible: boolean;
  fechaGeneracion: string;
}

/** CU09 FP: detalle de la actividad. */
export interface DetalleActividad {
  id: string;
  nombre: string;
  deporte: Deporte;
  estado: EstadoActividad;
  fechaHoraInicio: string;
  /** RN4: solo en estado Iniciada. */
  fechaLimiteGastos: string | null;
  nivel: NivelActividad;
  descripcion: string | null;
  origen: Ubicacion;
  destino: Ubicacion;
  cupoMaximo: number;
  /** Participantes más invitados externos. */
  cuposOcupados: number;
  /** null si el organizador cerró su cuenta. */
  organizador: { id: string; nombre: string; fotoUrl: string | null } | null;
  costoEstimadoCentesimos: number | null;
  /** null si no hay información ambiental disponible. */
  pronostico: PronosticoDeActividad | null;
  miRol: RolEnActividad;
  opciones: OpcionDeActividad[];
}

/** CU09 A1. */
export interface ParticipanteDeActividad {
  /** null si el usuario cerró su cuenta. */
  usuario: { id: string; nombre: string; fotoUrl: string | null } | null;
  esOrganizador: boolean;
  invitadosExternos: string[];
}

export interface PaginaDeParticipantes {
  participantes: ParticipanteDeActividad[];
  pagina: number;
  hayMas: boolean;
}
