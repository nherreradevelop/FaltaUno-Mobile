import { ErrorApi } from '../api/cliente';

/** CU01 ER1. */
const MENSAJE_FALLA_LOGIN = 'No fue posible iniciar sesión en este momento. Probá más tarde.';
/** CU01 ER2. */
export const MENSAJE_FALLA_GOOGLE =
  'No fue posible iniciar sesión con Google en este momento. Reintentá o ingresá con tu correo y contraseña.';

/** Mensaje a mostrar cuando falla el inicio de sesión con correo y contraseña. */
export function mensajeDeErrorDeLogin(error: unknown): string {
  if (error instanceof ErrorApi && !error.esFallaTecnica()) {
    return error.message; // E1, E3, E4: el texto lo define la API
  }
  return MENSAJE_FALLA_LOGIN;
}

/** Mensaje a mostrar cuando falla el inicio de sesión con Google. */
export function mensajeDeErrorDeGoogle(error: unknown): string {
  if (error instanceof ErrorApi && !error.esFallaTecnica()) {
    return error.message; // E2 y token rechazado
  }
  return MENSAJE_FALLA_GOOGLE;
}

/** CU08 ER3: la sesión venció mientras se usaba la app. */
export const MENSAJE_SESION_VENCIDA = 'Tu sesión expiró. Volvé a iniciar sesión para continuar.';

/** CU37 ER1: se cerró en el dispositivo pero la API no lo confirmó. */
export const MENSAJE_CIERRE_SIN_CONFIRMAR =
  'Cerramos tu sesión en este dispositivo, pero no pudimos confirmarlo con el servidor. Si usás un dispositivo compartido, volvé a cerrar sesión cuando tengas conexión.';

/** CU37 ER2: no se pudo borrar la sesión guardada en el dispositivo. */
export const MENSAJE_LIMPIEZA_INCOMPLETA = 'No pudimos terminar de cerrar tu sesión en este dispositivo.';
