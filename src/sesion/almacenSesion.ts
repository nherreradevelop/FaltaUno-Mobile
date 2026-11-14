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
 * Por qué se cerró la última sesión, para avisarlo en el login:
 * - vencida: la API rechazó el token (CU08 ER3).
 * - sinConfirmarEnServidor: el usuario cerró sesión pero la API no lo confirmó (CU37 ER1).
 * - limpiezaIncompleta: no se pudo borrar la sesión guardada en el dispositivo (CU37 ER2).
 */
export type MotivoDeCierre = 'vencida' | 'sinConfirmarEnServidor' | 'limpiezaIncompleta';

/**
 * Única fuente de la sesión en la app. El token se guarda cifrado con expo-secure-store.
 * El cliente HTTP lee el token de acá y, ante un 401, la cierra. Quien necesite enterarse de los cambios se suscribe a `cambios`.
 */
class AlmacenSesion {
  private sesion: Sesion | null = null;
  private motivo: MotivoDeCierre | null = null;
  /** CU37: se recuerda para el aviso que corresponde después de reintentar la limpieza (ER2 → ER1). */
  private cierreConfirmadoEnServidor = true;
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
    this.motivo = null;
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

  /** CU37 ER2: devuelve false si el dispositivo no permitió borrar la sesión guardada. Pasa por la cola de escrituras. */
  private async borrarSesionGuardada(): Promise<boolean> {
    try {
      await this.persistir(null);
      return true;
    } catch {
      return false;
    }
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
      this.motivo = 'vencida';
      await this.cerrar();
    }
  }

  /** Por qué se cerró la última sesión, o null si se cerró sin nada que avisar. */
  motivoDeCierre(): MotivoDeCierre | null {
    return this.motivo;
  }

  /**
   * CU37 FP pasos 7 y 8: borra la sesión del dispositivo y avisa a los observadores; el layout pasa al login.
   * La sesión se deja de usar antes de borrarla, así un guardado de filtros en curso no la vuelve a escribir.
   * Aunque no se pueda borrar de SecureStore, la sesión deja de usarse en la app (ER2: sin acceso a pantallas privadas).
   */
  async cerrarPorElUsuario(confirmadoEnServidor: boolean): Promise<void> {
    this.cierreConfirmadoEnServidor = confirmadoEnServidor;
    this.sesion = null;
    const seBorro = await this.borrarSesionGuardada();
    this.motivo = this.motivoDespuesDeLimpiar(seBorro);
    this.cambios.notificar(null);
  }

  /** CU37 ER2: vuelve a intentar borrar la sesión guardada. Devuelve true si ahora se pudo. */
  async reintentarLimpieza(): Promise<boolean> {
    const seBorro = await this.borrarSesionGuardada();
    this.motivo = this.motivoDespuesDeLimpiar(seBorro);
    return seBorro;
  }

  private motivoDespuesDeLimpiar(seBorro: boolean): MotivoDeCierre | null {
    if (!seBorro) {
      return 'limpiezaIncompleta';
    }
    if (!this.cierreConfirmadoEnServidor) {
      return 'sinConfirmarEnServidor';
    }
    return null;
  }
}

export const almacenSesion = new AlmacenSesion();
