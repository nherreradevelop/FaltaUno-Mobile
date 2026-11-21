import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import campana from '../../assets/iconos/campana.png';
import { colores, fuentes } from '../comun/tema';
import { etiquetaDelIcono, textoDelIndicador } from '../notificaciones/notificaciones';
import { useNotificaciones } from '../notificaciones/ProveedorNotificaciones';

/** CU40 FP pasos 1 y 2: campana con el indicador de no leídas, en la barra superior. Abre la pantalla de notificaciones. */
export function CampanaNotificaciones() {
  const { noLeidas } = useNotificaciones();
  const indicador = textoDelIndicador(noLeidas);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaDelIcono(noLeidas)}
      onPress={() => router.push('/notificaciones')}
      hitSlop={6}
      style={({ pressed }) => [estilos.boton, pressed ? estilos.presionado : null]}
    >
      <Image source={campana} style={estilos.icono} accessible={false} />
      {indicador ? (
        <View style={estilos.indicador} accessible={false}>
          <Text style={estilos.textoIndicador}>{indicador}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  presionado: { backgroundColor: colores.primarioClaro },
  icono: { width: 24, height: 24, tintColor: colores.texto },
  indicador: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoIndicador: { fontFamily: fuentes.texto, fontSize: 12, fontWeight: '700', color: colores.sobrePrimario },
});
