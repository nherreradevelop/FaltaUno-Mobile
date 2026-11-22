import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../../../../../src/componentes/Boton';
import { LimiteDeError } from '../../../../../../src/componentes/LimiteDeError';
import { colores, fuentes } from '../../../../../../src/comun/tema';
import { PantallaDetalleActividad } from '../../../../../../src/componentes/PantallaDetalleActividad';

/**
 * M – CU09 Detalle de actividad. También se abre con el enlace faltauno://actividades/<id> (A3), dentro de Explorar (CU39 A4).
 * Se abre dentro de la sección de la barra en la que está el usuario (CU39 A2).
 * Pendiente: CU08 (búsqueda), CU14 (mis actividades) y CU18 (invitaciones) navegan acá con router.push(`/actividades/${id}`).
 */
export default function PantallaActividad() {
  // creada/destinoProvisional: los agrega CU10 al terminar el alta para confirmar la creación
  const { id, creada, destinoProvisional } = useLocalSearchParams<{ id: string; creada?: string; destinoProvisional?: string }>();
  const actividadCreada = creada === 'si' ? { destinoProvisional: destinoProvisional === 'si' } : null;
  // key: al pasar de una actividad a otra, la pantalla arranca de cero
  return (
    <LimiteDeError
      key={id}
      alternativa={(reintentar) => (
        <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
          <View style={estilos.contenido}>
            <Text accessibilityRole="alert" style={estilos.mensaje}>
              No fue posible cargar el detalle de la actividad. Probá de nuevo más tarde.
            </Text>
            <Boton texto="Reintentar" alPresionar={reintentar} />
            <Boton texto="Volver al inicio" variante="secundario" alPresionar={() => router.replace('/')} />
          </View>
        </SafeAreaView>
      )}
    >
      <PantallaDetalleActividad actividadId={id} actividadCreada={actividadCreada} />
    </LimiteDeError>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 16 },
  mensaje: { fontFamily: fuentes.texto, color: colores.texto, fontSize: 16 },
});
