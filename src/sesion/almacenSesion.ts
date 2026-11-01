import * as SecureStore from 'expo-secure-store';
import type { UsuarioSesion } from '../api/tipos';
import { Observable } from '../comun/observable';

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

const CLAVE_ALMACENAMIENTO = 'faltauno.sesion';

/**
 * Única fuente de la sesión en la app. El token se guarda cifrado con expo-secure-store.
 * El cliente HTTP lee el token de acá y, ante un 401, la cierra. Quien necesite enterarse de los cambios se suscribe a `cambios`.
 */
class AlmacenSesion {
  private sesion: Sesion | null = null;

  readonly cambios = new Observable<Sesion | null>((error) => console.error('Falló un observador de la sesión', error));

  /** Lee la sesión guardada en el dispositivo. Se llama una vez al abrir la app. */
  async cargar(): Promise<Sesion | null> {
    try {
      const texto = await SecureStore.getItemAsync(CLAVE_ALMACENAMIENTO);
      this.sesion = texto ? (JSON.parse(texto) as Sesion) : null;
    } catch {
      this.sesion = null; // dato corrupto o inaccesible: se arranca sin sesión
    }
    return this.sesion;
  }

  actual(): Sesion | null {
    return this.sesion;
  }

  token(): string | null {
    return this.sesion?.token ?? null;
  }

  async abrir(sesion: Sesion): Promise<void> {
    this.sesion = sesion;
    await SecureStore.setItemAsync(CLAVE_ALMACENAMIENTO, JSON.stringify(sesion));
    this.cambios.notificar(sesion);
  }

  async cerrar(): Promise<void> {
    if (this.sesion === null) {
      return;
    }
    this.sesion = null;
    await SecureStore.deleteItemAsync(CLAVE_ALMACENAMIENTO);
    this.cambios.notificar(null);
  }
}

export const almacenSesion = new AlmacenSesion();
