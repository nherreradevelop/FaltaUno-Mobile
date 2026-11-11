import * as Location from 'expo-location';
import { obtenerUbicacionActual, type FuenteUbicacion } from '../comun/ubicacionDispositivo';

const fuente: FuenteUbicacion = {
  pedirPermiso: async () => (await Location.requestForegroundPermissionsAsync()).granted,
  serviciosActivos: () => Location.hasServicesEnabledAsync(),
  obtenerPosicion: async () => {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: false,
    });
    return { lat: coords.latitude, lng: coords.longitude, precisionMetros: coords.accuracy };
  },
};

/** Se invoca al pulsar «Usar mi ubicación», sin suscripciones ni permisos en segundo plano. */
export function ubicarDispositivo(signal: AbortSignal) {
  return obtenerUbicacionActual(fuente, signal);
}
