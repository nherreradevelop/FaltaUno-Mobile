import { Stack } from 'expo-router';
import { ProveedorNotificaciones } from '../../src/notificaciones/ProveedorNotificaciones';

/** Pantallas con sesión. Las notificaciones (CU40) viven mientras haya sesión y cierran su conexión al salir. */
export default function LayoutApp() {
  return (
    <ProveedorNotificaciones>
      <Stack screenOptions={{ headerShown: false }} />
    </ProveedorNotificaciones>
  );
}
