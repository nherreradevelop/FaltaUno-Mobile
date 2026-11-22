import { Stack } from 'expo-router';

/**
 * CU39 RN4: cada sección de la barra tiene su propio stack. El detalle de una actividad y el perfil de otro usuario
 * (rutas de esta carpeta) se abren dentro de la sección en la que está el usuario, con la barra visible (A2).
 * Tocar la sección activa vuelve a su pantalla principal (A1 paso 1): lo hace el stack al recibir el toque de la barra.
 *
 * Ojo al navegar a estas rutas desde fuera de la barra (por ejemplo, desde crear una actividad o un enlace): hay que
 * nombrar la sección, como "/(explorar)/actividades/<id>". Sin ella, Expo Router elige la primera sección en orden
 * alfabético. Desde dentro de una sección no hace falta: se queda en la sección actual.
 */
export const unstable_settings = {
  explorar: { anchor: 'index' },
  'mis-actividades': { anchor: 'mis-actividades' },
  mensajes: { anchor: 'mensajes' },
  amigos: { anchor: 'amigos' },
  perfil: { anchor: 'perfil/index' },
};

export default function LayoutSeccion() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
