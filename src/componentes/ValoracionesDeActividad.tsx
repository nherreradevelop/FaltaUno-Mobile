import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { obtenerMisValoraciones, type MiValoracion } from '../api/valoraciones';
import { colores, fuentes } from '../comun/tema';
import { MENSAJES_VALORACION, textoDePendientes } from '../comun/valoraciones';
import { Boton } from './Boton';

export interface EstadoMisValoraciones {
  /** Valoración que el usuario le dio a cada participante (por id de usuario); null si está pendiente. */
  porUsuario: Map<string, MiValoracion | null>;
  pendientes: number;
  cargando: boolean;
  hayFalla: boolean;
  reintentar: () => void;
  /** FP paso 10: refleja en la lista la valoración que se acaba de guardar, sin volver a pedirla. */
  registrar: (usuarioId: string, valoracion: MiValoracion) => void;
}

/**
 * CU21 FP pasos 1 y 2: las valoraciones que el usuario ya dio en la actividad. Se pide una sola vez por pantalla,
 * desde el detalle, y solo si la API ofrece valorar (actividad Iniciada o Archivada y el usuario forma parte).
 */
export function useMisValoraciones(actividadId: string, habilitado: boolean): EstadoMisValoraciones {
  const [porUsuario, setPorUsuario] = useState<Map<string, MiValoracion | null>>(new Map());
  const [cargando, setCargando] = useState(false);
  const [hayFalla, setHayFalla] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    let vigente = true;
    setCargando(true);
    setHayFalla(false);
    obtenerMisValoraciones(actividadId)
      .then((participantes) => {
        if (!vigente) return;
        setPorUsuario(new Map(participantes.map((participante) => [participante.usuario.id, participante.miValoracion])));
      })
      .catch(() => {
        if (vigente) setHayFalla(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [actividadId, habilitado, intento]);

  const registrar = useCallback((usuarioId: string, valoracion: MiValoracion) => {
    setPorUsuario((anterior) => new Map(anterior).set(usuarioId, valoracion));
  }, []);

  const pendientes = [...porUsuario.values()].filter((valoracion) => valoracion === null).length;
  return {
    porUsuario,
    pendientes,
    cargando,
    hayFalla,
    reintentar: () => setIntento((anterior) => anterior + 1),
    registrar,
  };
}

/** CU21 FP paso 2 y A1: cuántos participantes faltan valorar, o el error al cargar las valoraciones con "Reintentar". */
export function ResumenDeValoraciones({ valoraciones, aviso }: { valoraciones: EstadoMisValoraciones; aviso: string | null }) {
  if (valoraciones.hayFalla) {
    return (
      <View style={[estilos.aviso, estilos.error]} accessibilityRole="alert">
        <Text style={estilos.textoError}>{MENSAJES_VALORACION.errorAlCargar}</Text>
        <Boton texto="Reintentar" variante="secundario" alPresionar={valoraciones.reintentar} />
      </View>
    );
  }
  if (valoraciones.cargando) {
    return null;
  }
  return (
    <View style={estilos.resumen}>
      {/* FP paso 10: aviso de que la valoración quedó registrada */}
      {aviso ? (
        <Text style={[estilos.aviso, estilos.textoInfo]} accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}
      <Text style={estilos.pendientes}>{textoDePendientes(valoraciones.pendientes)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  resumen: { gap: 8, marginBottom: 8 },
  aviso: { borderRadius: 14, padding: 14, overflow: 'hidden' },
  error: { backgroundColor: colores.errorFondo, gap: 12, marginBottom: 8 },
  textoError: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
  textoInfo: {
    backgroundColor: colores.primarioClaro,
    fontFamily: fuentes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: colores.primarioOscuro,
  },
  pendientes: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
});
