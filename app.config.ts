import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de Expo. Las variables EXPO_PUBLIC_* salen de mobile/.env (ver .env.example).
 * El login con Google necesita un development build (npx expo run:ios / run:android): no funciona en Expo Go.
 */
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

/** iOS recibe la respuesta de Google en un esquema de URL que es el Client ID de iOS invertido. */
function esquemaUrlDeGoogleParaIos(clientIdIos: string): string {
  const sufijo = '.apps.googleusercontent.com';
  const prefijo = clientIdIos.replace(sufijo, '');
  return `com.googleusercontent.apps.${prefijo}`;
}

const plugins: ExpoConfig['plugins'] = ['expo-router', 'expo-secure-store', 'expo-font'];
if (GOOGLE_IOS_CLIENT_ID) {
  plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: esquemaUrlDeGoogleParaIos(GOOGLE_IOS_CLIENT_ID) }]);
}

const config: ExpoConfig = {
  name: 'FaltaUno',
  slug: 'faltauno',
  scheme: 'faltauno',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'uy.faltauno.app',
  },
  android: {
    package: 'uy.faltauno.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins,
};

export default config;
