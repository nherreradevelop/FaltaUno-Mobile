/** Formatos de presentación compartidos por las pantallas (la misma copia existe en web/src/comun). */

/** CU04 RN3: valoración promedio con 2 decimales y coma decimal (4,33). */
export function formatearValoracion(valoracion: number): string {
  return valoracion.toFixed(2).replace('.', ',');
}

/** CU04 A1: "1 actividad", "12 actividades". */
export function formatearCantidadActividades(cantidad: number): string {
  return cantidad === 1 ? '1 actividad' : `${cantidad} actividades`;
}

/** CU04 FP: "1 valoración", "3 valoraciones". */
export function formatearCantidadValoraciones(cantidad: number): string {
  return cantidad === 1 ? '1 valoración' : `${cantidad} valoraciones`;
}

/** Fecha corta en español de Uruguay: "7 nov 2026". */
export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Iniciales para el avatar cuando el usuario no tiene foto: "Martina Rodríguez" → "MR". */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = palabras[0]?.[0] ?? '';
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] : '';
  return (primera + ultima).toUpperCase();
}

/**
 * Pide a Cloudinary la foto al tamaño en que se muestra, no en tamaño original.
 * Se pide al doble para que se vea nítida en pantallas de alta densidad.
 */
export function urlDeFotoAlTamano(fotoUrl: string, tamanoEnPixeles: number): string {
  const marcador = '/upload/';
  if (!fotoUrl.includes(marcador)) {
    return fotoUrl;
  }
  const lado = tamanoEnPixeles * 2;
  return fotoUrl.replace(marcador, `${marcador}c_fill,g_face,w_${lado},h_${lado}/`);
}

// Las actividades se desarrollan en Uruguay: la fecha y la hora se muestran siempre en hora de Montevideo
const ZONA_HORARIA = 'America/Montevideo';

/** CU08: fecha y hora de inicio de una actividad: "mié 11 nov · 07:30". */
export function formatearFechaHora(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const dia = fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA_HORARIA });
  const hora = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA_HORARIA });
  return `${dia.replace(/\./g, '').replace(',', '')} · ${hora}`;
}

/** CU08: valoración del organizador en la tarjeta: "★ 4,33", o "Sin valoraciones" si todavía no tiene. */
export function formatearValoracionDelOrganizador(valoracionPromedio: number | null): string {
  return valoracionPromedio === null ? 'Sin valoraciones' : `★ ${formatearValoracion(valoracionPromedio)}`;
}

/** CU08: "1 lugar libre", "4 lugares libres". */
export function formatearCuposLibres(cuposLibres: number): string {
  return cuposLibres === 1 ? '1 lugar libre' : `${cuposLibres} lugares libres`;
}
