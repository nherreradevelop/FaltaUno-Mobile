import { ErrorApi } from '../api/cliente';
import type { NivelActividad, OpcionDeActividad, ParticipanteDeActividad, RolEnActividad } from '../api/tipos';

/** CU09 ER1: no se pudo recuperar la actividad; se sugiere reintentar más tarde. */
const MENSAJE_FALLA_DETALLE = 'No fue posible cargar el detalle de la actividad. Probá de nuevo más tarde.';
/** CU09 ER1 aplicado a la lista de participantes (A1). */
export const MENSAJE_FALLA_PARTICIPANTES = 'No fue posible cargar los participantes. Probá de nuevo más tarde.';

export type ErrorDeActividad = { tipo: 'noDisponible'; mensaje: string } | { tipo: 'falla'; mensaje: string };

/** Distingue E2 (la actividad no existe) de ER1 (falla técnica), que es el único caso en que tiene sentido reintentar. */
export function clasificarErrorDeActividad(error: unknown): ErrorDeActividad {
  if (error instanceof ErrorApi && error.codigo === 'ACTIVIDAD_NO_DISPONIBLE') {
    return { tipo: 'noDisponible', mensaje: error.message }; // CU09 E2: el texto lo define la API
  }
  return { tipo: 'falla', mensaje: MENSAJE_FALLA_DETALLE };
}

export const ETIQUETA_NIVEL: Record<NivelActividad, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export interface OpcionPendiente {
  opcion: OpcionDeActividad;
  etiqueta: string;
  casoDeUso: string;
  /** Saca al usuario de la actividad o la termina: se muestra en rojo. */
  esPeligrosa?: boolean;
}

/**
 * CU09 FP paso 4: las acciones se reparten en tres lugares, de más a menos usadas. Todas pertenecen a otro caso de
 * uso: se muestran deshabilitadas hasta que exista. La API decide cuáles corresponden a cada usuario (RN2).
 * "Modificar mi participación" (CU28) no se muestra por decisión del equipo, aunque la API la siga ofreciendo.
 * "Valorar" (CU21) no es un botón: son estrellas junto a cada participante, en la pestaña Participantes.
 */

/**
 * La acción principal, siempre visible: la primera de esta lista que la API ofrezca.
 * El chat grupal no va acá: ya es una pestaña del detalle (decisión del equipo, para no tener dos accesos).
 */
const CANDIDATAS_A_ACCION_PRINCIPAL: OpcionPendiente[] = [
  { opcion: 'unirse', etiqueta: 'Unirme a la actividad', casoDeUso: 'CU11' }, // Pendiente: CU11
];

/** Acciones de un toque, como íconos junto al título. */
export const ACCIONES_RAPIDAS: OpcionPendiente[] = [
  { opcion: 'compartir', etiqueta: 'Compartir', casoDeUso: 'CU19' }, // Pendiente: CU19
  { opcion: 'silenciar', etiqueta: 'Silenciar', casoDeUso: 'CU20' }, // Pendiente: CU20
];

/** El resto, dentro del menú "Más opciones" (⋯). Las peligrosas al final, para no tocarlas por error. */
export const ACCIONES_DEL_MENU: OpcionPendiente[] = [
  { opcion: 'invitarAmigos', etiqueta: 'Invitar amigos', casoDeUso: 'CU17' }, // Pendiente: CU17
  { opcion: 'editar', etiqueta: 'Editar actividad', casoDeUso: 'CU29' }, // Pendiente: CU29
  { opcion: 'archivar', etiqueta: 'Archivar', casoDeUso: 'CU32' }, // Pendiente: CU32
  { opcion: 'cancelar', etiqueta: 'Cancelar actividad', casoDeUso: 'CU13', esPeligrosa: true }, // Pendiente: CU13
  { opcion: 'abandonar', etiqueta: 'Abandonar actividad', casoDeUso: 'CU12', esPeligrosa: true }, // Pendiente: CU12
];

/** La acción principal según las opciones de la API (unirse, si no participa y hay lugar), o null. */
export function accionPrincipal(opciones: OpcionDeActividad[]): OpcionPendiente | null {
  return CANDIDATAS_A_ACCION_PRINCIPAL.find(({ opcion }) => opciones.includes(opcion)) ?? null;
}

/** Las acciones de la lista que la API ofrece. */
export function accionesOfrecidas(acciones: OpcionPendiente[], opciones: OpcionDeActividad[]): OpcionPendiente[] {
  return acciones.filter(({ opcion }) => opciones.includes(opcion));
}

/** CU09 FP paso 3: etiqueta con la relación del usuario con la actividad (sin etiqueta si no forma parte). */
export const ETIQUETA_ROL: Record<RolEnActividad, string | null> = {
  organizador: 'Sos el organizador',
  participante: 'Ya estás anotado',
  ninguno: null,
};

/**
 * Resumen de quién va, para mostrar junto a los avatares: "Carla, Diego y 1 más".
 * Usa los participantes ya cargados para los nombres y los cupos ocupados para el total (incluye invitados externos).
 */
export function resumenDeQuienesVan(participantes: ParticipanteDeActividad[], cuposOcupados: number): string {
  const nombres = participantes
    .map(({ usuario }) => usuario?.nombre.split(' ')[0])
    .filter((nombre): nombre is string => Boolean(nombre))
    .slice(0, 2);
  const resto = cuposOcupados - nombres.length;
  if (nombres.length === 0) {
    return resto === 1 ? '1 persona' : `${resto} personas`;
  }
  if (resto <= 0) {
    return nombres.join(' y ');
  }
  return `${nombres.join(', ')} y ${resto} más`;
}

/**
 * Pestañas al pie del detalle (los datos, el pronóstico y el mapa quedan siempre visibles arriba).
 * Chat y Gastos aparecen solo si la API ofrece esa opción (RN2, RN5).
 */
export type PestanaDeActividad = 'participantes' | 'chat' | 'gastos';

export interface DefinicionDePestana {
  pestana: PestanaDeActividad;
  etiqueta: string;
  /** Opción que la API tiene que ofrecer para mostrar la pestaña. */
  opcion: OpcionDeActividad;
  /** Caso de uso que todavía falta para mostrar el contenido; null si ya está implementada. */
  casoDeUsoPendiente: string | null;
}

export const PESTANAS: DefinicionDePestana[] = [
  { pestana: 'participantes', etiqueta: 'Participantes', opcion: 'verParticipantes', casoDeUsoPendiente: null }, // A1
  { pestana: 'chat', etiqueta: 'Chat', opcion: 'verChat', casoDeUsoPendiente: 'CU16' }, // Pendiente: CU16
  { pestana: 'gastos', etiqueta: 'Gastos', opcion: 'verGastos', casoDeUsoPendiente: 'CU34' }, // Pendiente: CU34
];

/** Las pestañas que corresponden según las opciones que ofreció la API. */
export function pestanasDisponibles(opciones: OpcionDeActividad[]): DefinicionDePestana[] {
  return PESTANAS.filter(({ opcion }) => opciones.includes(opcion));
}

/** CU09 A1: una fila de la lista de participantes. Los invitados externos tienen fila propia, debajo de quien los trae. */
export type FilaDeParticipantes =
  | { tipo: 'usuario'; clave: string; participante: ParticipanteDeActividad }
  | { tipo: 'invitado'; clave: string; nombre: string; invitadoPor: string | null };

/**
 * CU09 A1 paso 2: la lista incluye a los usuarios registrados y a los invitados externos. Así la cantidad de filas
 * coincide con la de la pestaña, que cuenta lugares ocupados (los invitados también ocupan lugar).
 */
export function filasDeParticipantes(participantes: ParticipanteDeActividad[]): FilaDeParticipantes[] {
  const filas: FilaDeParticipantes[] = [];
  participantes.forEach((participante, indice) => {
    // Las cuentas cerradas no tienen id: se usa la posición, que no cambia al agregar páginas
    const clave = participante.usuario?.id ?? `eliminado-${indice}`;
    filas.push({ tipo: 'usuario', clave, participante });
    const invitadoPor = participante.usuario?.nombre.split(' ')[0] ?? null;
    participante.invitadosExternos.forEach((nombre, posicion) => {
      filas.push({ tipo: 'invitado', clave: `${clave}-invitado-${posicion}`, nombre, invitadoPor });
    });
  });
  return filas;
}
