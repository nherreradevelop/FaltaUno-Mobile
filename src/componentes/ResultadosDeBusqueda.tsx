import { router, useFocusEffect, useNavigation, useScrollToTop } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import type { FiltrosDeBusqueda, UbicacionDelUsuario } from '../api/tipos';
import { FILTROS_INICIALES } from '../comun/filtrosDeSesion';
import { MENSAJE_SIN_ACTIVIDADES } from '../comun/mensajesExplorar';
import { colores, fuentes } from '../comun/tema';
import { terminoLaPrimeraCarga, useActividadesPorGrupo } from '../comun/useActividadesPorGrupo';
import { Boton } from './Boton';
import { BannerActividadesHoy } from './BannerActividadesHoy';
import { EsqueletoDeActividades } from './EsqueletoDeActividades';
import { TarjetaActividad } from './TarjetaActividad';

interface PropsResultados {
  filtros: FiltrosDeBusqueda | null;
  ubicacion: UbicacionDelUsuario | null;
}

/**
 * Cuenta las veces que hay que volver a pedir las actividades: al entrar y al volver a la pantalla desde otra
 * pantalla de Explorar (por ejemplo, el detalle de una actividad), para mostrar los cambios que hubo.
 * CU39 FP paso 7: al volver desde otra sección de la barra no se recarga, así se conserva la lista y su posición.
 */
function useActualizacionAlVolver(): number {
  const navigation = useNavigation();
  const [actualizacion, setActualizacion] = useState(0);
  const volvioDeOtraSeccion = useRef(false);

  useEffect(() => {
    const desuscribir = navigation.addListener('blur', () => {
      // Si la sección (Explorar) también dejó de estar activa, el usuario se fue a otra sección de la barra
      const seccion = navigation.getParent();
      volvioDeOtraSeccion.current = seccion !== undefined && !seccion.isFocused();
    });
    return desuscribir;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (volvioDeOtraSeccion.current) {
        volvioDeOtraSeccion.current = false;
        return;
      }
      setActualizacion((anterior) => anterior + 1);
    }, []),
  );

  return actualizacion;
}

/**
 * Dashboard con paginación independiente por sección y una sola lista virtualizada.
 * Hasta que respondan las dos secciones propias se muestra un esqueleto, así no aparecen después
 * y empujan hacia abajo la lista que el usuario ya estaba mirando.
 */
export function ResultadosDeBusqueda({ filtros, ubicacion }: PropsResultados) {
  const lista = useRef<SectionList>(null);
  // CU39 A1 paso 2: tocar "Explorar" en la barra estando en esta pantalla sube la lista al inicio.
  // SectionList no tiene scrollTo: se sube con su ScrollView interno.
  const subirAlInicio = useRef({ scrollToTop: () => lista.current?.getScrollResponder()?.scrollTo({ y: 0, animated: true }) });
  useScrollToTop(subirAlInicio);
  const actualizacion = useActualizacionAlVolver();
  const gestionando = useActividadesPorGrupo('gestionando', FILTROS_INICIALES, ubicacion, actualizacion);
  const unido = useActividadesPorGrupo('unido', FILTROS_INICIALES, ubicacion, actualizacion);
  const otras = useActividadesPorGrupo('otras', filtros, ubicacion, actualizacion);
  const propiasListas = terminoLaPrimeraCarga(gestionando) && terminoLaPrimeraCarga(unido);
  if (!propiasListas) {
    return (
      <View style={estilos.esqueleto}>
        <EsqueletoDeActividades cantidad={3} />
      </View>
    );
  }

  const todasLasSecciones = [
    {
      key: 'gestionando',
      titulo: 'Actividades que estás organizando',
      data: gestionando.actividades,
      resultado: gestionando,
    },
    {
      key: 'unido',
      titulo: 'Actividades a las que te uniste',
      data: unido.actividades,
      resultado: unido,
    },
    {
      key: 'otras',
      titulo: 'Actividades que podrían interesarte',
      data: otras.actividades,
      resultado: otras,
    },
  ];
  // Las secciones propias solo se muestran si tienen actividades (o un error para reintentar)
  const secciones = todasLasSecciones.filter(
    (seccion) => seccion.key === 'otras' || seccion.data.length > 0 || seccion.resultado.error !== null,
  );

  return (
    <SectionList
      ref={lista}
      sections={secciones}
      keyExtractor={(actividad) => actividad.id}
      renderItem={({ item }) => (
        <View style={estilos.item}>
          <TarjetaActividad actividad={item} />
        </View>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={estilos.contenido}
      ListHeaderComponent={otras.hayIniciadasHoy ? <BannerActividadesHoy /> : undefined}
      renderSectionHeader={({ section }) => (
        <Text accessibilityRole="header" style={estilos.titulo}>
          {section.titulo}
        </Text>
      )}
      renderSectionFooter={({ section }) => (
        <View style={estilos.pie}>
          {section.resultado.cargando && section.data.length === 0 ? <EsqueletoDeActividades /> : null}
          {section.resultado.cargando && section.data.length > 0 ? (
            <ActivityIndicator color={colores.primario} style={estilos.cargando} />
          ) : null}
          {!section.resultado.cargando && !section.resultado.error && section.data.length === 0 ? (
            <View style={estilos.vacio}>
              <Text style={estilos.textoVacio}>{MENSAJE_SIN_ACTIVIDADES}</Text>
              {section.key === 'otras' ? (
                <Boton texto="+ Crear actividad" variante="secundario" alPresionar={() => router.push('/actividades/crear')} />
              ) : null}
            </View>
          ) : null}
          {section.resultado.error ? (
            <View style={estilos.aviso} accessibilityRole="alert">
              <Text style={estilos.textoAviso}>{section.resultado.error}</Text>
              <Boton texto="Reintentar" variante="secundario" alPresionar={section.resultado.reintentar} />
            </View>
          ) : null}
          {section.resultado.hayMas && !section.resultado.cargando && !section.resultado.error ? (
            <Boton texto="Ver más" variante="secundario" alPresionar={section.resultado.verMas} />
          ) : null}
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: 20, paddingBottom: 32 },
  esqueleto: { paddingHorizontal: 20, paddingTop: 16 },
  titulo: {
    fontFamily: fuentes.titulos,
    fontWeight: '700',
    fontSize: 22,
    color: colores.texto,
    paddingTop: 16,
    paddingBottom: 12,
  },
  item: { marginBottom: 12 },
  pie: { gap: 12, paddingBottom: 12 },
  cargando: { marginVertical: 24 },
  vacio: {
    backgroundColor: colores.superficie,
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
