import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colores, fuentes } from '../comun/tema';

export const MENSAJE_SECCION_NO_DISPONIBLE = 'Esta sección va a estar disponible próximamente.';

/**
 * CU39: pantalla principal de una sección de la barra cuyo caso de uso todavía no está implementado.
 * El equipo decidió mostrar las cinco opciones desde ahora (difiere de E2 de la ficha, que las oculta).
 */
export function SeccionNoDisponible({ titulo }: { titulo: string }) {
  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <View style={estilos.contenido}>
        <Text style={estilos.mensaje}>{MENSAJE_SECCION_NO_DISPONIBLE}</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  titulo: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    fontFamily: fuentes.titulos,
    fontWeight: '800',
    fontSize: 26,
    color: colores.texto,
  },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  mensaje: { textAlign: 'center', fontFamily: fuentes.texto, fontSize: 16, lineHeight: 22, color: colores.textoSuave },
});
