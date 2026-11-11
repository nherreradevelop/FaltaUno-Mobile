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
 * Color de fondo del avatar con iniciales: siempre el mismo para el mismo nombre, para distinguir personas en las listas.
 * Todos tienen contraste de al menos 4.5:1 con las iniciales en blanco.
 */
const COLORES_DE_AVATAR = ['#B45309', '#1D6FB8', '#2E7D4F', '#6D4AA3', '#0F766E', '#13507F'];

export function colorDeAvatar(nombre: string): string {
  let suma = 0;
  for (const caracter of nombre) {
    suma = (suma * 31 + caracter.charCodeAt(0)) % 997;
  }
  return COLORES_DE_AVATAR[suma % COLORES_DE_AVATAR.length];
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

/** CU08: fecha y hora de inicio en la tarjeta de la búsqueda, abreviadas: "mié 11 nov · 07:30". */
export function formatearFechaHoraCorta(fechaIso: string): string {
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

/** CU09: fecha y hora con el mismo formato en toda la pantalla: "sábado 14 de noviembre · 07:30". */
export function formatearFechaHora(fechaIso: string): string {
  return `${formatearDia(fechaIso)} · ${formatearHora(fechaIso)}`;
}

/** CU09: monto en centésimos → "$ 1.200" o "$ 450,50". No pasa por decimales de punto flotante. */
export function formatearMonto(centesimos: number): string {
  const pesos = Math.trunc(centesimos / 100);
  const resto = centesimos % 100;
  const pesosConPuntos = pesos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (resto === 0) {
    return `$ ${pesosConPuntos}`;
  }
  return `$ ${pesosConPuntos},${resto.toString().padStart(2, '0')}`;
}

/** CU09: día de la actividad, sin abreviar (se lee más fácil que "sáb 14 nov."): "sábado 14 de noviembre". */
export function formatearDia(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
}

/** CU09: hora de la actividad: "07:30". */
export function formatearHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Si todavía queda algún lugar. Los invitados externos también ocupan lugar. */
export function hayLugaresLibres(cuposOcupados: number, cupoMaximo: number): boolean {
  return cuposOcupados < cupoMaximo;
}

/**
 * CU09 FP paso 2: lugares de la actividad. Con lugar: los que quedan ("Quedan 3", "Queda 1"); sin lugar: "2 de 2".
 * Los invitados externos también ocupan lugar.
 */
export function formatearLugaresLibres(cuposOcupados: number, cupoMaximo: number): string {
  if (!hayLugaresLibres(cuposOcupados, cupoMaximo)) return `${cupoMaximo} de ${cupoMaximo}`;
  const libres = cupoMaximo - cuposOcupados;
  if (libres === 1) return 'Queda 1';
  return `Quedan ${libres}`;
}

/** Proporción de lugares ocupados, entre 0 y 1, para la barra de cupo. */
export function proporcionOcupada(cuposOcupados: number, cupoMaximo: number): number {
  if (cupoMaximo <= 0) return 0;
  return Math.min(1, cuposOcupados / cupoMaximo);
}

/** Punto en el mapa. */
interface Coordenadas {
  lat: number;
  lng: number;
}

/** Zoom del mapa cuando la actividad tiene un solo punto (nivel de calles). */
const ZOOM_DE_UN_PUNTO = 15;

function aTexto(punto: Coordenadas): string {
  return encodeURIComponent(`${punto.lat},${punto.lng}`);
}

/** Si origen y destino son el mismo lugar no hay recorrido: se muestra un solo punto. */
export function esElMismoLugar(origen: Coordenadas, destino: Coordenadas): boolean {
  return origen.lat === destino.lat && origen.lng === destino.lng;
}

/** CU09 A2: recorrido de origen a destino en Google Maps (se abre fuera de la app), o el lugar si es uno solo. */
export function urlDeRecorridoEnGoogleMaps(origen: Coordenadas, destino: Coordenadas): string {
  if (esElMismoLugar(origen, destino)) {
    return `https://www.google.com/maps/search/?api=1&query=${aTexto(destino)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${aTexto(origen)}&destination=${aTexto(destino)}`;
}

/**
 * CU09 A2: mapa embebido de Google Maps (no necesita API key). Con dos lugares muestra el recorrido; con uno solo,
 * un marcador en ese punto (un recorrido de largo cero haría que Google muestre el mapa del mundo).
 */
export function urlDeMapaEmbebido(origen: Coordenadas, destino: Coordenadas): string {
  if (esElMismoLugar(origen, destino)) {
    return `https://maps.google.com/maps?q=${aTexto(destino)}&z=${ZOOM_DE_UN_PUNTO}&output=embed`;
  }
  return `https://maps.google.com/maps?saddr=${aTexto(origen)}&daddr=${aTexto(destino)}&output=embed`;
}
