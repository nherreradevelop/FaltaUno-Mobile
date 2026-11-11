import Constants from 'expo-constants';
import { almacenSesion } from '../sesion/almacenSesion';

const PUERTO_API_DESARROLLO = 3000;

/**
 * URL de la API: EXPO_PUBLIC_URL_API si está definida; si no, en desarrollo se usa la IP
 * de la máquina donde corre Expo (así funciona desde el celular en la misma red).
 */
function urlDeLaApi(): string {
  const urlConfigurada = process.env.EXPO_PUBLIC_URL_API;
  if (urlConfigurada) {
    return urlConfigurada;
  }
  const hostDeExpo = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${hostDeExpo}:${PUERTO_API_DESARROLLO}`;
}

const URL_API = urlDeLaApi();

// RNF-08: si la API no responde en este tiempo, se corta la espera y se informa el error
const TIEMPO_ESPERA_MS = 15_000;

/** Error que devolvió la API, o falla de red (estado 0). */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly campos?: Record<string, string>,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  /** CU01 ER1: la API no respondió, no se pudo conectar o falló de forma inesperada. */
  esFallaTecnica(): boolean {
    return this.estado === 0 || this.estado >= 500;
  }
}

interface CuerpoDeError {
  error?: { codigo?: string; mensaje?: string; campos?: Record<string, string> };
}

const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos. Revisá tu conexión y probá más tarde.';

async function leerError(respuesta: Response): Promise<ErrorApi> {
  const cuerpo = (await respuesta.json().catch(() => ({}))) as CuerpoDeError;
  const codigo = cuerpo.error?.codigo ?? 'ERROR_DESCONOCIDO';
  const mensaje = cuerpo.error?.mensaje ?? 'No pudimos completar la operación en este momento. Probá más tarde.';
  return new ErrorApi(respuesta.status, codigo, mensaje, cuerpo.error?.campos);
}

/**
 * Única forma de llamar a la API desde la app: agrega el token, corta por tiempo de espera
 * y convierte cualquier error en ErrorApi.
 */
export async function pedir<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; claveIdempotencia?: string } = {},
): Promise<T> {
  const token = almacenSesion.token();
  const encabezados: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    encabezados.Authorization = `Bearer ${token}`;
  }

  // AbortSignal.timeout no está disponible en todos los motores de React Native
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS);

  if (opciones.claveIdempotencia) {
    encabezados['Idempotency-Key'] = opciones.claveIdempotencia;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: encabezados,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      signal: controlador.signal,
    });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', MENSAJE_SIN_CONEXION);
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    // La sesión venció o se cerró desde otro lado: se cierra la local, el layout lleva al login y ahí se avisa (CU08 ER3)
    if (respuesta.status === 401 && token) {
      await almacenSesion.cerrarPorVencimiento();
    }
    throw await leerError(respuesta);
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (await respuesta.json()) as T;
}
