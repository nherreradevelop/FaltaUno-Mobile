import { Stack } from 'expo-router';
import { ProveedorNotificaciones } from '../../src/notificaciones/ProveedorNotificaciones';

/**
 * Pantallas con sesión. Las notificaciones (CU40) viven mientras haya sesión y cierran su conexión al salir.
 * (tabs) tiene la barra de navegación (CU39); las pantallas de una sola tarea, como crear una actividad,
 * van fuera de (tabs) para que la tapen (CU39 A2 paso 2).
 */
export default function LayoutApp() {
  return (
    <ProveedorNotificaciones>
      <Stack screenOptions={{ headerShown: false }} />
    </ProveedorNotificaciones>
  );
}
