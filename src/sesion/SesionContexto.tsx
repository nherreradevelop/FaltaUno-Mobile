import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RespuestaLogin } from '../api/tipos';
import { obtenerUsuarioActual } from '../api/usuarios';
import { almacenSesion, type Sesion } from './almacenSesion';

interface ValorSesion {
  sesion: Sesion | null;
  /** true mientras se lee la sesión guardada en el dispositivo. */
  cargando: boolean;
  abrirSesion: (respuesta: RespuestaLogin) => Promise<void>;
}

const SesionContexto = createContext<ValorSesion | null>(null);

/** Expone la sesión a las pantallas y la mantiene sincronizada con almacenSesion. */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Observer: cualquier cambio (login, o un 401 que la cierra) llega acá y el layout cambia de grupo de pantallas
  useEffect(() => {
    const desuscribir = almacenSesion.cambios.suscribir(setSesion);
    return desuscribir;
  }, []);

  // Al abrir la app se lee la sesión guardada y se confirma que siga vigente (CU01 RN4).
  // Si venció, el cliente HTTP recibe 401 y la cierra. Si la API no responde, se conserva (RNF-15).
  useEffect(() => {
    async function restaurarSesion() {
      const sesionGuardada = await almacenSesion.cargar();
      setSesion(sesionGuardada);
      setCargando(false);
      if (!sesionGuardada) {
        return;
      }
      const usuario = await obtenerUsuarioActual();
      if (almacenSesion.token() === sesionGuardada.token) await almacenSesion.abrir({ token: sesionGuardada.token, usuario });
    }
    restaurarSesion().catch(() => setCargando(false));
  }, []);

  const abrirSesion = useCallback(async (respuesta: RespuestaLogin) => {
    await almacenSesion.abrir({ token: respuesta.token, usuario: respuesta.usuario });
  }, []);

  const valor = useMemo(() => ({ sesion, cargando, abrirSesion }), [sesion, cargando, abrirSesion]);
  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(SesionContexto);
  if (!valor) {
    throw new Error('useSesion se usó fuera de <ProveedorSesion>');
  }
  return valor;
}
