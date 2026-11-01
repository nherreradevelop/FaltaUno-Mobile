import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colores, fuentes } from '../../src/comun/tema';
import { useSesion } from '../../src/sesion/SesionContexto';

/** Pantalla principal provisoria: destino del CU01 FP paso 8. Pendiente: CU08 – Buscar actividades (M02 Explorar). */
export default function PantallaInicio() {
  const { sesion } = useSesion();
  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>¡Hola, {sesion?.usuario.nombre}!</Text>
        <Text style={estilos.texto}>Iniciaste sesión correctamente.</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 28, gap: 8 },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 28, color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.textoSuave },
});
