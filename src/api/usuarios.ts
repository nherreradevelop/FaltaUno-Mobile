import { pedir } from './cliente';
import type { UsuarioSesion } from './tipos';

/** Usuario de la sesión actual; se usa al abrir la web para confirmar que la sesión guardada sigue vigente. */
export function obtenerUsuarioActual(): Promise<UsuarioSesion> {
  return pedir<UsuarioSesion>('/api/usuarios/yo');
}
