import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { buscarActividades } from '../api/actividades';
import type { ActividadEncontrada, FiltrosDeBusqueda, UbicacionDelUsuario } from '../api/tipos';
import { MENSAJE_SIN_ACTIVIDADES, mensajeDeErrorDeBusqueda } from '../comun/mensajesExplorar';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';
import { TarjetaActividad } from './TarjetaActividad';

interface PropsResultados {
  filtros: FiltrosDeBusqueda;
  ubicacion: UbicacionDelUsuario | null;
}

/**
 * CU08 FP paso 2: lista de actividades disponibles para los filtros, de a 10.
 * La pantalla la monta con una key por filtros: al aplicar filtros nuevos, la lista arranca de cero desde la página 1.
 */
export function ResultadosDeBusqueda({ filtros, ubicacion }: PropsResultados) {
  const [actividades, setActividades] = useState<ActividadEncontrada[]>([]);
  const [paginaCargada, setPaginaCargada] = useState(0);
  const [paginaPedida, setPaginaPedida] = useState(1);
  /** Se incrementa al tocar "Reintentar" para volver a pedir la misma página (RNF-10). */
  const [intento, setIntento] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    // Si se sale de la pantalla antes de que llegue la respuesta, se descarta
    let vigente = true;
    setCargando(true);
    setMensajeError(null);

    buscarActividades(filtros, paginaPedida, ubicacion)
      .then((resultado) => {
        if (!vigente) return;
        setActividades((anteriores) => [...anteriores, ...resultado.actividades]);
        setPaginaCargada(resultado.pagina);
        setHayMas(resultado.hayMas);
      })
      .catch((error: unknown) => {
        if (vigente) setMensajeError(mensajeDeErrorDeBusqueda(error)); // ER1 y ER4
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [filtros, ubicacion, paginaPedida, intento]);

  const sinActividades = !cargando && !mensajeError && actividades.length === 0;

  return (
    <FlatList
      data={actividades}
      keyExtractor={(actividad) => actividad.id}
      renderItem={({ item }) => <TarjetaActividad actividad={item} />}
      contentContainerStyle={estilos.contenido}
      ListEmptyComponent={sinActividades ? <SinActividades /> : undefined}
      ListFooterComponent={
        <View style={estilos.pie}>
          {cargando ? <ActivityIndicator color={colores.primario} style={estilos.cargando} /> : null}
          {mensajeError ? (
            <View style={estilos.aviso} accessibilityRole="alert">
              <Text style={estilos.textoAviso}>{mensajeError}</Text>
              <Boton texto="Reintentar" variante="secundario" alPresionar={() => setIntento((anterior) => anterior + 1)} />
            </View>
          ) : null}
          {hayMas && !cargando && !mensajeError ? (
            <Boton texto="Ver más" variante="secundario" alPresionar={() => setPaginaPedida(paginaCargada + 1)} />
          ) : null}
        </View>
      }
    />
  );
}

/** CU08 E1: no hay actividades para los filtros; se sugiere crear una. */
function SinActividades() {
  return (
    <View style={estilos.vacio}>
      <Text style={estilos.textoVacio}>{MENSAJE_SIN_ACTIVIDADES}</Text>
      {/* Pendiente: CU10 – Crear actividad */}
      <Boton texto="+ Crear actividad" alPresionar={() => undefined} deshabilitado />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  pie: { gap: 12 },
  cargando: { marginVertical: 24 },
  vacio: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 14,
  },
  textoVacio: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.texto },
  aviso: { backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14, gap: 12 },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
});
