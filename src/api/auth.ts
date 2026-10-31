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
