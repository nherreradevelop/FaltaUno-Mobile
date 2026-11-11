import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/componentes/Avatar';
import { colores, fuentes } from '../../src/comun/tema';
import { useSesion } from '../../src/sesion/SesionContexto';

/**
 * Pantalla principal provisoria: destino del CU01 FP paso 8. El avatar lleva a "Mi perfil" (CU04 FP paso 1).
 * También muestra el aviso con el que vuelve otra pantalla (CU09 E2: la actividad no está disponible).
 * Pendiente: CU08 – Buscar actividades (M02 Explorar).
 */
export default function PantallaInicio() {
  const { sesion } = useSesion();
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  if (!sesion) {
    return null;
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.barra}>
        <Text style={estilos.marca}>FaltaUno</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/perfil')} hitSlop={8}>
          <Avatar nombre={sesion.usuario.nombre} fotoUrl={sesion.usuario.fotoUrl} tamano={40} />
        </Pressable>
      </View>
      <View style={estilos.contenido}>
        {aviso ? (
          <Text style={estilos.aviso} accessibilityRole="alert">
            {aviso}
          </Text>
        ) : null}
        <Text style={estilos.titulo}>¡Hola, {sesion.usuario.nombre}!</Text>
        <Text style={estilos.texto}>Iniciaste sesión correctamente.</Text>
      </View>
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
  marca: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 22, color: colores.primarioOscuro },
  contenido: { padding: 28, gap: 8 },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 28, color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.textoSuave },
  aviso: {
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
    fontFamily: fuentes.texto,
    fontSize: 14,
    marginBottom: 8,
  },
});
