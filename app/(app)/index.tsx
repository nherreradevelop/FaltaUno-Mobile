import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listarDepartamentos } from '../../src/api/actividades';
import { listarDeportes } from '../../src/api/deportes';
import type { Deporte, UbicacionDelUsuario } from '../../src/api/tipos';
import { Avatar } from '../../src/componentes/Avatar';
import { Boton } from '../../src/componentes/Boton';
import { PanelDeFiltros } from '../../src/componentes/PanelDeFiltros';
import { ResultadosDeBusqueda } from '../../src/componentes/ResultadosDeBusqueda';
import {
  aFiltrosDeBusqueda,
  cantidadDeFiltrosAplicados,
  FILTROS_VACIOS,
  type FiltrosEnEdicion,
} from '../../src/comun/filtrosDeBusqueda';
import { mensajeFallaDeFiltros } from '../../src/comun/mensajesExplorar';
import { colores, fuentes } from '../../src/comun/tema';
import { obtenerUbicacion } from '../../src/comun/ubicacion';
import { useSesion } from '../../src/sesion/SesionContexto';

interface OpcionesDeFiltros {
  deportes: Deporte[] | null;
  departamentos: string[] | null;
  /** CU08 ER2: nombres de los filtros que no se pudieron cargar. */
  fallaron: string[];
  reintentar: () => void;
}

/** CU08 ER2: carga las opciones de los filtros de deporte y departamento; si una falla, la otra se muestra igual. */
function useOpcionesDeFiltros(): OpcionesDeFiltros {
  const [deportes, setDeportes] = useState<Deporte[] | null>(null);
  const [departamentos, setDepartamentos] = useState<string[] | null>(null);
  const [fallaron, setFallaron] = useState<string[]>([]);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.allSettled([listarDeportes(), listarDepartamentos()]).then(([resultadoDeportes, resultadoDepartamentos]) => {
      if (!vigente) return;
      const filtrosQueFallaron: string[] = [];
      if (resultadoDeportes.status === 'fulfilled') setDeportes(resultadoDeportes.value);
      else filtrosQueFallaron.push('deporte');
      if (resultadoDepartamentos.status === 'fulfilled') setDepartamentos(resultadoDepartamentos.value);
      else filtrosQueFallaron.push('departamento');
      setFallaron(filtrosQueFallaron);
    });
    return () => {
      vigente = false;
    };
  }, [intento]);

  return { deportes, departamentos, fallaron, reintentar: () => setIntento((anterior) => anterior + 1) };
}

/** CU08 RN1: se pide la ubicación una sola vez al entrar. undefined mientras se pide; null sin permiso. */
function useUbicacion(): UbicacionDelUsuario | null | undefined {
  const [ubicacion, setUbicacion] = useState<UbicacionDelUsuario | null | undefined>(undefined);
  useEffect(() => {
    let vigente = true;
    obtenerUbicacion().then((ubicacionObtenida) => {
      if (vigente) setUbicacion(ubicacionObtenida);
    });
    return () => {
      vigente = false;
    };
  }, []);
  return ubicacion;
}

/**
 * M02 – CU08 Buscar actividades (Explorar). Es la pantalla principal con sesión; el avatar lleva a "Mi perfil" (CU04 FP paso 1).
 * Sin permiso de ubicación, se ordena solo por fecha (RN1).
 * También muestra el aviso con el que vuelve otra pantalla (CU09 E2: la actividad no está disponible).
 */
export default function PantallaExplorar() {
  const { sesion } = useSesion();
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const opciones = useOpcionesDeFiltros();
  const ubicacion = useUbicacion();
  const [filtros, setFiltros] = useState<FiltrosEnEdicion>(FILTROS_VACIOS);
  const [panelVisible, setPanelVisible] = useState(false);

  // Mismo objeto mientras no cambien los filtros, para que la lista no vuelva a pedir lo mismo
  const filtrosDeBusqueda = useMemo(() => aFiltrosDeBusqueda(filtros), [filtros]);

  if (!sesion) {
    return null;
  }

  function aplicarFiltros(filtrosNuevos: FiltrosEnEdicion) {
    setPanelVisible(false);
    if (JSON.stringify(filtrosNuevos) !== JSON.stringify(filtros)) {
      setFiltros(filtrosNuevos);
    }
  }

  const cantidadAplicados = cantidadDeFiltrosAplicados(filtros);
  const textoFiltros = cantidadAplicados > 0 ? `Filtros (${cantidadAplicados})` : 'Filtros';
  const orden = ubicacion
    ? 'Actividades disponibles · ordenadas por fecha y cercanía'
    : 'Actividades disponibles · ordenadas por fecha';

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <View style={estilos.barra}>
        <Text style={estilos.titulo}>Explorar actividades</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/perfil')} hitSlop={8}>
          <Avatar nombre={sesion.usuario.nombre} fotoUrl={sesion.usuario.fotoUrl} tamano={40} />
        </Pressable>
      </View>

      <View style={estilos.acciones}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPanelVisible(true)}
          style={[estilos.botonFiltros, cantidadAplicados > 0 ? estilos.botonFiltrosActivo : null]}
        >
          <Text style={estilos.textoBotonFiltros}>{textoFiltros}</Text>
        </Pressable>
        {ubicacion !== undefined ? <Text style={estilos.orden}>{orden}</Text> : null}
      </View>

      {aviso ? (
        <Text style={estilos.avisoInfo} accessibilityRole="alert">
          {aviso}
        </Text>
      ) : null}

      {/* ER2 */}
      {opciones.fallaron.length > 0 ? (
        <View style={estilos.aviso} accessibilityRole="alert">
          <Text style={estilos.textoAviso}>{mensajeFallaDeFiltros(opciones.fallaron)}</Text>
          <Boton texto="Reintentar" variante="secundario" alPresionar={opciones.reintentar} />
        </View>
      ) : null}

      {ubicacion === undefined ? (
        <ActivityIndicator color={colores.primario} style={estilos.cargando} />
      ) : (
        <ResultadosDeBusqueda key={JSON.stringify(filtrosDeBusqueda)} filtros={filtrosDeBusqueda} ubicacion={ubicacion} />
      )}

      <PanelDeFiltros
        visible={panelVisible}
        filtrosAplicados={filtros}
        deportes={opciones.deportes}
        departamentos={opciones.departamentos}
        alAplicar={aplicarFiltros}
        alCerrar={() => setPanelVisible(false)}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titulo: { flex: 1, fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 26, color: colores.texto },
  acciones: { paddingHorizontal: 20, paddingBottom: 12, gap: 10, alignItems: 'flex-start' },
  botonFiltros: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colores.primarioOscuro,
  },
  botonFiltrosActivo: { backgroundColor: colores.primario },
  textoBotonFiltros: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700', color: colores.blanco },
  orden: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  cargando: { marginVertical: 24 },
  aviso: { marginHorizontal: 20, marginBottom: 12, backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14, gap: 12 },
  avisoInfo: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    fontFamily: fuentes.texto,
    fontSize: 14,
  },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
});
