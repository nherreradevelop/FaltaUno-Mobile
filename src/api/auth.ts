import { pedir } from './cliente';
import type { RespuestaLogin } from './tipos';

/** CU01 FP. */
export function iniciarSesion(email: string, password: string): Promise<RespuestaLogin> {
  return pedir<RespuestaLogin>('/api/auth/login', { metodo: 'POST', cuerpo: { email, password } });
}

/** CU01 A1: idToken es el que entrega el botón de Google. */
export function iniciarSesionConGoogle(idToken: string): Promise<RespuestaLogin> {
  return pedir<RespuestaLogin>('/api/auth/google', { metodo: 'POST', cuerpo: { idToken } });
}

/** CU37 ER1 / RNF-08: para salir no se hace esperar al usuario tanto como en el resto de las operaciones. */
const TIEMPO_ESPERA_CIERRE_MS = 5_000;

/** CU37 FP pasos 4 a 6: invalida en el servidor la sesión actual. La API responde 204 aunque ya no estuviera activa (E1). */
export function cerrarSesionEnServidor(): Promise<void> {
  return pedir<void>('/api/auth/cerrar-sesion', { metodo: 'POST', tiempoDeEsperaMs: TIEMPO_ESPERA_CIERRE_MS });
}
