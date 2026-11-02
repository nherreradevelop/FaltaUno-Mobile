import { pedir } from './cliente';
import type { Historial, Perfil, PerfilPropio, UsuarioSesion } from './tipos';

/** Usuario de la sesión actual; se usa al abrir la app para confirmar que la sesión guardada sigue vigente. */
export function obtenerUsuarioActual(): Promise<UsuarioSesion> {
  return pedir<UsuarioSesion>('/api/usuarios/yo');
}

/** CU04 FP. */
export function obtenerMiPerfil(): Promise<PerfilPropio> {
  return pedir<PerfilPropio>('/api/usuarios/yo/perfil');
}

/** CU04 FP paso 2: historial de actividades, de a 10. */
export function obtenerMiHistorial(pagina: number): Promise<Historial> {
  return pedir<Historial>(`/api/usuarios/yo/actividades?pagina=${pagina}`);
}

/** CU04 A1. */
export function obtenerPerfilDeUsuario(usuarioId: string): Promise<Perfil> {
  return pedir<Perfil>(`/api/usuarios/${encodeURIComponent(usuarioId)}/perfil`);
}
