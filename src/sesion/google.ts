import Constants, { ExecutionEnvironment } from 'expo-constants';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

/**
 * El login con Google usa código nativo: solo existe en un development build, no en Expo Go.
 * Tampoco se muestra si faltan los Client ID en mobile/.env.
 */
export function googleDisponible(): boolean {
  const esExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  return Boolean(GOOGLE_WEB_CLIENT_ID) && !esExpoGo;
}

let configurado = false;

/**
 * CU01 A1 pasos 2 a 4: abre el inicio de sesión de Google y devuelve el ID token.
 * Lanza un error si el usuario cancela o Google falla (CU01 ER2).
 */
export async function obtenerIdTokenDeGoogle(): Promise<string> {
  // Import dinámico: si se importara arriba, la app se rompería al abrirla en Expo Go
  const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');

  if (!configurado) {
    // webClientId define la audiencia del ID token: tiene que estar en GOOGLE_CLIENT_IDS de la API
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID || undefined });
    configurado = true;
  }

  await GoogleSignin.hasPlayServices();
  const respuesta = await GoogleSignin.signIn();
  if (!isSuccessResponse(respuesta) || !respuesta.data.idToken) {
    throw new Error('El usuario canceló el inicio de sesión con Google o Google no devolvió el ID token');
  }
  return respuesta.data.idToken;
}
