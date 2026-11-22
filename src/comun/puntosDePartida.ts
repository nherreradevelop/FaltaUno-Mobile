import type { ParticipanteDeActividad } from '../api/tipos';

// Mismo archivo en web/src/comun y mobile/src/comun: qué se marca en el mapa no depende de la plataforma.

/** CU09 A2: un punto de partida de un participante, para marcarlo en el mapa de "Cómo llegar". */
export interface PuntoDePartidaEnMapa {
  /** Id del usuario: identifica el marcador. */
  clave: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

/** Textos de la leyenda del mapa: cada tipo de punto tiene su nombre, no solo su color. */
export const LEYENDA_DEL_MAPA = {
  salida: 'Salida del organizador',
  destino: 'Destino',
  participantes: 'Punto de partida de un participante',
} as const;

/**
 * CU09 A2 y CU11 paso 5: los puntos de partida que se marcan en el mapa, además de la salida y el destino.
 * - El organizador no lleva marcador propio: su punto de partida es la salida de la actividad (CU10).
 * - Las cuentas cerradas no se muestran (CU33).
 * - Si quien mira no forma parte de la actividad, la API ya manda los puntos en null y la lista queda vacía.
 */
export function puntosDePartidaEnMapa(participantes: ParticipanteDeActividad[]): PuntoDePartidaEnMapa[] {
  const puntos: PuntoDePartidaEnMapa[] = [];
  for (const participante of participantes) {
    const { usuario, puntoPartida } = participante;
    if (participante.esOrganizador || usuario === null || puntoPartida === null) {
      continue;
    }
    puntos.push({
      clave: usuario.id,
      nombre: usuario.nombre,
      direccion: puntoPartida.direccion,
      lat: puntoPartida.lat,
      lng: puntoPartida.lng,
    });
  }
  return puntos;
}

/** Texto del marcador al tocarlo o pasar el mouse: "Juan Pérez sale desde Tres Cruces". */
export function tituloDelPuntoDePartida(punto: PuntoDePartidaEnMapa): string {
  return `${punto.nombre} sale desde ${punto.direccion}`;
}

/** Inicial del nombre que va dentro del marcador. */
export function inicialDelParticipante(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase();
}
