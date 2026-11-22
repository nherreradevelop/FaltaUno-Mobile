import { Platform } from 'react-native';

/** true si hay key de Google Maps para el SDK nativo de esta plataforma (sin key, el mapa nativo queda en blanco). */
export function hayClaveDeMapasNativos(): boolean {
  const clave =
    Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY : process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY;
  return Boolean(clave);
}
