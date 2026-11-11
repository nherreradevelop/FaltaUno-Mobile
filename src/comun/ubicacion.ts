import * as Location from 'expo-location';
import type { UbicacionDelUsuario } from '../api/tipos';

// Si el GPS tarda más que esto, se busca sin ubicación para no demorar la lista
const TIEMPO_ESPERA_UBICACION_MS = 8_000;

/** Resuelve null si la promesa no termina a tiempo. */
function conTiempoLimite<T>(promesa: Promise<T>, milisegundos: number): Promise<T | null> {
  return new Promise((resolver) => {
    const temporizador = setTimeout(() => resolver(null), milisegundos);
    promesa
      .then((valor) => resolver(valor))
      .catch(() => resolver(null))
      .finally(() => clearTimeout(temporizador));
  });
}

async function leerPosicion(): Promise<UbicacionDelUsuario | null> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== Location.PermissionStatus.GRANTED) {
    return null;
  }
  // Primero la última posición conocida (es inmediata); si no hay, se pide una nueva con precisión baja, que alcanza para ordenar
  const ultimaConocida = await Location.getLastKnownPositionAsync();
  const posicion = ultimaConocida ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
}

/**
 * CU08 RN1: ubicación del GPS para ordenar por cercanía.
 * Devuelve null si el usuario no dio permiso o no se pudo obtener: en ese caso se ordena solo por fecha.
 */
export function obtenerUbicacion(): Promise<UbicacionDelUsuario | null> {
  return conTiempoLimite(leerPosicion(), TIEMPO_ESPERA_UBICACION_MS);
}
