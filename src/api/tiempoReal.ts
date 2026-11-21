import { io, type Socket } from 'socket.io-client';
import { URL_API } from './cliente';

/**
 * Canal en tiempo real con la API (Socket.IO, CU40 A3). Se autentica con el token de la sesión (RNF-13).
 * En React Native se usa solo WebSocket. Socket.IO reconecta solo si se corta la conexión.
 */
export function conectarTiempoReal(token: string): Socket {
  return io(URL_API, { auth: { token }, transports: ['websocket'] });
}
