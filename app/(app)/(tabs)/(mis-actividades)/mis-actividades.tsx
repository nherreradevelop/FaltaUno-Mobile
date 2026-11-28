import { router, useFocusEffect } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../../../src/componentes/Boton';
import { EsqueletoDeActividades } from '../../../../src/componentes/EsqueletoDeActividades';
import { MENSAJE_SIN_INICIADAS } from '../../../../src/comun/actividadesIniciadas';
import { esHoyEnUruguay, formatearFechaHoraCorta } from '../../../../src/comun/formato';
import { colores, fuentes } from '../../../../src/comun/tema';
import { useActividadesIniciadas } from '../../../../src/comun/useActividadesIniciadas';

/** CU42: revalida al volver a la pestaña; FlatList conserva la posición y virtualiza las tarjetas. */
export default function PantallaMisActividades() {
  const lista = useActividadesIniciadas(false);
  useFocusEffect(lista.actualizar);
  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Mis actividades
        </Text>
        <Text style={estilos.subtitulo}>Actividades iniciadas en las que participás.</Text>
      </View>
      <FlatList
        data={lista.actividades}
        keyExtractor={(actividad) => actividad.id}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.seccion} accessibilityRole="header">
              Actividades iniciadas
            </Text>
            <Boton texto="Actualizar" variante="secundario" cargando={lista.cargando} alPresionar={lista.actualizar} />
          </View>
        }
        ListEmptyComponent={
          !lista.cargando && !lista.error ? (
            <View style={estilos.tarjeta}>
              <Text style={estilos.texto}>{MENSAJE_SIN_INICIADAS}</Text>
              <Boton texto="Explorar actividades" alPresionar={() => router.navigate('/')} />
            </View>
          ) : undefined
        }
        renderItem={({ item: actividad }) => (
          <View style={estilos.tarjeta}>
            <View style={estilos.etiquetas}>
              <Text style={estilos.etiqueta}>Iniciada</Text>
              {esHoyEnUruguay(actividad.fechaHoraInicio) && <Text style={[estilos.etiqueta, estilos.hoy]}>es hoy!</Text>}
              {actividad.esOrganizador && <Text style={estilos.etiqueta}>Organizada por vos</Text>}
            </View>
            <Text style={estilos.nombre} accessibilityRole="header">
              {actividad.nombre}
            </Text>
            <Text style={estilos.subtitulo}>
              {actividad.deporte.nombre} · {actividad.departamento}
            </Text>
            <Text style={estilos.texto}>Inicio: {formatearFechaHoraCorta(actividad.fechaHoraInicio)}</Text>
            <Text style={estilos.texto}>
              Fecha límite para gastos y pagos: {formatearFechaHoraCorta(actividad.fechaLimiteGastos)}
            </Text>
            <Boton texto="Ver detalle" variante="secundario" alPresionar={() => router.push(`/actividades/${actividad.id}`)} />
          </View>
        )}
        ListFooterComponent={
          <View style={estilos.pie}>
            {lista.cargando && <EsqueletoDeActividades />}
            {lista.error && (
              <View style={estilos.error} accessibilityRole="alert">
                <Text style={estilos.textoError}>{lista.error}</Text>
                <Boton texto="Reintentar" variante="secundario" alPresionar={lista.reintentar} />
              </View>
            )}
            {lista.hayMas && !lista.cargando && !lista.error && (
              <Boton texto="Ver más" variante="secundario" alPresionar={lista.verMas} />
            )}
          </View>
        }
      />
      {/* Pendiente: CU14 (programadas, historial, canceladas e invitaciones). */}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { padding: 20, gap: 8 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 26, fontWeight: '800', color: colores.texto },
  seccion: { fontFamily: fuentes.titulos, fontSize: 22, fontWeight: '700', color: colores.texto },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSuave },
  lista: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  cabeceraLista: { gap: 12, marginBottom: 8 },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 12,
  },
  nombre: { fontFamily: fuentes.titulos, fontSize: 22, fontWeight: '800', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, lineHeight: 23, color: colores.texto },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  etiqueta: {
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontFamily: fuentes.texto,
    fontWeight: '600',
  },
  hoy: { backgroundColor: colores.exitoSuave, color: colores.exito },
  pie: { gap: 16 },
  error: { backgroundColor: colores.errorFondo, borderRadius: 16, padding: 18, gap: 12 },
  textoError: { fontFamily: fuentes.texto, fontSize: 16, color: colores.error },
});
