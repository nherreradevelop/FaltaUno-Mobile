import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import fuenteBricolage from '../assets/fonts/BricolageGrotesque.ttf';
import fuenteFigtree from '../assets/fonts/Figtree.ttf';
import { ProveedorSesion, useSesion } from '../src/sesion/SesionContexto';
import { useRetomarEnlaceTrasLogin } from '../src/sesion/enlacePendiente';

/**
 * Elige el grupo de pantallas según haya sesión o no. Cuando la sesión cambia (login, 401),
 * Expo Router cambia de grupo solo: no hace falta navegar a mano.
 */
function PantallasSegunSesion() {
  const { sesion, cargando } = useSesion();
  useVolverAExplorarTrasLogin(sesion !== null, cargando);
  // CU09 A3: un enlace a una actividad abierto sin sesión se retoma después del login
  useRetomarEnlaceTrasLogin(sesion !== null, cargando);

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
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

/**
 * Al iniciar sesión después de haberla cerrado (CU37), las pantallas privadas arrancan en Explorar
 * y no en la última que estaba abierta (por ejemplo el perfil, desde donde se cierra sesión).
 * Va antes que useRetomarEnlaceTrasLogin, así un enlace pendiente (CU09 A3) se abre encima de Explorar.
 */
function useVolverAExplorarTrasLogin(haySesion: boolean, cargandoSesion: boolean): void {
  const habiaSesion = useRef<boolean | null>(null);
  useEffect(() => {
    if (cargandoSesion) return;
    const esUnLogin = habiaSesion.current === false && haySesion;
    habiaSesion.current = haySesion;
    if (esUnLogin && router.canDismiss()) {
      router.dismissAll();
    }
  }, [haySesion, cargandoSesion]);
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
