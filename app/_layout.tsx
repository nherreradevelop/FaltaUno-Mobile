import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import fuenteBricolage from '../assets/fonts/BricolageGrotesque.ttf';
import fuenteFigtree from '../assets/fonts/Figtree.ttf';
import { ProveedorSesion, useSesion } from '../src/sesion/SesionContexto';

/**
 * Elige el grupo de pantallas según haya sesión o no. Cuando la sesión cambia (login, 401),
 * Expo Router cambia de grupo solo: no hace falta navegar a mano.
 */
function PantallasSegunSesion() {
  const { sesion, cargando } = useSesion();
  if (cargando) {
    return null; // se sigue viendo la pantalla de carga nativa
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={sesion !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* CU01 precondición: el login solo se ve sin sesión activa */}
      <Stack.Protected guard={sesion === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function LayoutRaiz() {
  const [fuentesCargadas] = useFonts({
    Figtree: fuenteFigtree,
    BricolageGrotesque: fuenteBricolage,
  });
  if (!fuentesCargadas) {
    return null;
  }

  return (
    <ProveedorSesion>
      <StatusBar style="dark" />
      <PantallasSegunSesion />
    </ProveedorSesion>
  );
}
