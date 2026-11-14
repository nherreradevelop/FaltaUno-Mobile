import * as SecureStore from 'expo-secure-store';
import { conservarFiltrosDeSesion, sonFiltrosValidos } from '../comun/filtrosDeSesion';
import type { FiltrosDeBusqueda, UsuarioSesion } from '../api/tipos';
import { Observable } from '../comun/observable';

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
  filtrosBusqueda?: FiltrosDeBusqueda;
}

const CLAVE_ALMACENAMIENTO = 'faltauno.sesion';

/**
 * Única fuente de la sesión en la app. El token se guarda cifrado con expo-secure-store.
 * El cliente HTTP lee el token de acá y, ante un 401, la cierra. Quien necesite enterarse de los cambios se suscribe a `cambios`.
 */
class AlmacenSesion {
  private sesion: Sesion | null = null;
  /** CU08 ER3 (y cualquier pantalla con sesión): la API rechazó el token, para avisar en el login que la sesión expiró. */
  private vencida = false;
  private escrituraPendiente: Promise<void> = Promise.resolve();

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
    this.vencida = false;
    const nueva = conservarFiltrosDeSesion(this.sesion, sesion);
    this.sesion = nueva;
    await this.persistir(nueva);
    if (this.sesion?.token === nueva.token && this.sesion.usuario.id === nueva.usuario.id) {
      this.cambios.notificar(this.sesion);
    }
  }

  /** null significa que aún se deben inicializar los deportes del perfil. */
  filtrosDeBusqueda(): FiltrosDeBusqueda | null {
    const filtros = this.sesion?.filtrosBusqueda;
    return sonFiltrosValidos(filtros) ? filtros : null;
  }

  /** Mantiene la selección en memoria y en el almacenamiento de la sesión. */
  async guardarFiltrosDeBusqueda(token: string, filtros: FiltrosDeBusqueda): Promise<void> {
    if (this.sesion?.token !== token || !sonFiltrosValidos(filtros)) return;
    this.sesion = { ...this.sesion, filtrosBusqueda: filtros };
    await this.persistir(this.sesion);
  }

  /** Serializa escrituras para que un guardado anterior no restaure filtros después del logout. */
  private persistir(sesion: Sesion | null): Promise<void> {
    const escribir = () =>
      sesion
        ? SecureStore.setItemAsync(CLAVE_ALMACENAMIENTO, JSON.stringify(sesion))
        : SecureStore.deleteItemAsync(CLAVE_ALMACENAMIENTO);
    this.escrituraPendiente = this.escrituraPendiente.catch(() => undefined).then(escribir);
    return this.escrituraPendiente;
  }

  async cerrar(): Promise<void> {
    if (this.sesion === null) {
      return;
    }
    this.sesion = null;
    await this.persistir(null);
    if (this.sesion === null) this.cambios.notificar(null);
  }

  /** La API respondió 401 con un token guardado: la sesión venció o se cerró desde otro lado. */
  async cerrarPorVencimiento(): Promise<void> {
    if (this.sesion !== null) {
      this.vencida = true;
      await this.cerrar();
    }
  }

  /** true si la última sesión se cerró porque venció (no porque el usuario salió). */
  sesionVencio(): boolean {
    return this.vencida;
  }
}

export const almacenSesion = new AlmacenSesion();
