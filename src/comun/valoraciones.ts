import type { MiValoracion } from '../api/valoraciones';

/** CU21 FP paso 5: de 1 a 5 estrellas. */
export const PUNTAJES = [1, 2, 3, 4, 5] as const;
/** Largo máximo del comentario (columna valoracion.comentario). */
export const LARGO_MAXIMO_COMENTARIO = 500;

/** Mensajes al usuario (CU21). */
export const MENSAJES_VALORACION = {
  guardada: 'Guardamos tu valoración.', // FP paso 10
  sinPuntaje: 'Elegí un puntaje de 1 a 5 estrellas.', // E1
  errorAlGuardar: 'No pudimos guardar la valoración. Probá de nuevo.', // ER1
  errorAlCargar: 'No pudimos cargar tus valoraciones.',
  todosValorados: 'Ya valoraste a todos los participantes.',
} as const;

/** CU21 FP paso 2 y A1: cuántos participantes quedan por valorar. */
export function textoDePendientes(cantidad: number): string {
  if (cantidad <= 0) return MENSAJES_VALORACION.todosValorados;
  if (cantidad === 1) return 'Te falta valorar a 1 participante.';
  return `Te falta valorar a ${cantidad} participantes.`;
}

/** Etiqueta accesible del botón de valorar: dice si está pendiente o con cuántas estrellas lo valoraste (A2). */
export function etiquetaDelBotonDeValorar(nombre: string, valoracion: MiValoracion | null): string {
  if (valoracion === null) return `Valorar a ${nombre}`;
  return `Valoraste a ${nombre} con ${valoracion.puntaje} de 5 estrellas. Cambiar valoración`;
}

/** CU21 E1 y RN6: el puntaje es obligatorio; el comentario vacío se envía como null. */
export function armarValoracion(puntaje: number | null, comentario: string): MiValoracion | null {
  if (puntaje === null) return null;
  const comentarioLimpio = comentario.trim();
  return { puntaje, comentario: comentarioLimpio === '' ? null : comentarioLimpio };
}
