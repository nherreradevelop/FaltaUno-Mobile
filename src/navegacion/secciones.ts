import { textoDelIndicador } from '../comun/indicador';

/** Nombre de cada sección. Coincide con el grupo de rutas de app/(app)/(tabs) sin los paréntesis. */
export type ClaveSeccion = 'explorar' | 'mis-actividades' | 'mensajes' | 'amigos' | 'perfil';

export interface Seccion {
  clave: ClaveSeccion;
  titulo: string;
  /** Nombre del ícono de Ionicons; la sección activa usa la versión rellena y las demás la de contorno (RN7). */
  icono: 'compass' | 'calendar' | 'chatbubbles' | 'people' | 'person';
  /** Cómo se lee el indicador en la etiqueta accesible (RN7); null si la sección no tiene indicador. */
  describirIndicador: ((cantidad: number) => string) | null;
}

/** CU39 RN2: opciones de la barra y su orden, fijos. */
export const SECCIONES: readonly Seccion[] = [
  { clave: 'explorar', titulo: 'Explorar', icono: 'compass', describirIndicador: null },
  {
    clave: 'mis-actividades',
    titulo: 'Mis actividades',
    icono: 'calendar',
    describirIndicador: (cantidad) => (cantidad === 1 ? '1 invitación pendiente' : `${cantidad} invitaciones pendientes`),
  },
  { clave: 'mensajes', titulo: 'Mensajes', icono: 'chatbubbles', describirIndicador: (cantidad) => `${cantidad} sin leer` },
  {
    clave: 'amigos',
    titulo: 'Amigos',
    icono: 'people',
    describirIndicador: (cantidad) => (cantidad === 1 ? '1 solicitud de amistad' : `${cantidad} solicitudes de amistad`),
  },
  { clave: 'perfil', titulo: 'Perfil', icono: 'person', describirIndicador: null },
];

/** CU39 RN7: etiqueta accesible de una opción, con su indicador si tiene novedades (por ejemplo, "Mensajes, 3 sin leer"). */
export function etiquetaDeSeccion(seccion: Seccion, cantidad: number): string {
  if (seccion.describirIndicador === null || cantidad <= 0) return seccion.titulo;
  return `${seccion.titulo}, ${seccion.describirIndicador(cantidad)}`;
}

/** CU39 RN5: texto del indicador de una opción; undefined si no corresponde mostrarlo. */
export function indicadorDeSeccion(seccion: Seccion, cantidad: number): string | undefined {
  if (seccion.describirIndicador === null) return undefined;
  return textoDelIndicador(cantidad) ?? undefined;
}

/** Cantidad de novedades de cada sección (FP paso 4). */
export type NovedadesPorSeccion = Record<ClaveSeccion, number>;

/**
 * CU39 FP paso 4 y RN5: novedades pendientes de cada sección. Todavía no hay de dónde obtenerlas:
 * Pendiente: CU18 (invitaciones pendientes y vigentes, en "Mis actividades").
 * Pendiente: CU07 y CU16 (conversaciones con mensajes sin leer, en "Mensajes"), sin contar actividades silenciadas (CU20, RN6).
 * Pendiente: CU06 (solicitudes de amistad recibidas, en "Amigos").
 * Al implementarlas: ER1 (no bloquear la navegación si fallan y volver a consultar al reconectar o al volver a primer plano).
 */
export const SIN_NOVEDADES: NovedadesPorSeccion = {
  explorar: 0,
  'mis-actividades': 0,
  mensajes: 0,
  amigos: 0,
  perfil: 0,
};
