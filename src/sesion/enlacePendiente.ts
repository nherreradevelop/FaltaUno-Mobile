import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

/** Rutas a las que se puede volver después del login. Por ahora, el detalle de una actividad (CU09 A3, CU19). */
const PREFIJO_ACTIVIDAD = 'actividades/';

/** De "faltauno://actividades/<id>" devuelve "/actividades/<id>"; de cualquier otro enlace, null. */
export function rutaDeEnlace(url: string): string | null {
  const { path } = Linking.parse(url);
  if (!path || !path.startsWith(PREFIJO_ACTIVIDAD)) {
    return null;
  }
  return `/${path}`;
}

/**
 * CU09 A3: si se abre un enlace a una actividad sin sesión, el layout muestra el login (Stack.Protected) y el
 * destino se pierde. Este hook lo recuerda y, apenas se inicia sesión, navega a esa actividad (A3 paso 3).
 * Con sesión no hace nada: Expo Router abre el enlace solo.
 */
export function useRetomarEnlaceTrasLogin(haySesion: boolean, cargandoSesion: boolean): void {
  const url = Linking.useURL();
  const [rutaPendiente, setRutaPendiente] = useState<string | null>(null);
  // Cada enlace se considera una sola vez: si la sesión se cierra más tarde, no se vuelve a abrir un enlace viejo
  const ultimaUrlConsiderada = useRef<string | null>(null);

  useEffect(() => {
    if (url === null || cargandoSesion || url === ultimaUrlConsiderada.current) {
      return;
    }
    ultimaUrlConsiderada.current = url;
    if (!haySesion) {
      setRutaPendiente(rutaDeEnlace(url));
    }
  }, [url, haySesion, cargandoSesion]);

  useEffect(() => {
    if (!haySesion || rutaPendiente === null) {
      return;
    }
    setRutaPendiente(null);
    router.push(rutaPendiente);
  }, [haySesion, rutaPendiente]);
}
