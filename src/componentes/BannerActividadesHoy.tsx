import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';

/** CU42 A4: la condición se recibe desde la misma consulta de actividades de Explorar. */
export function BannerActividadesHoy() {
  return (
    <View style={estilos.banner}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Tenes actividades que comienzan hoy!
      </Text>
      <Text style={estilos.texto}>
        hace click aca para ver tus actividades iniciadas y entra a la actividad para ver los detalles.
      </Text>
      <Boton texto="Ver mis actividades" variante="secundario" alPresionar={() => router.navigate('/mis-actividades')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  banner: {
    backgroundColor: colores.primarioClaro,
    borderColor: colores.primario,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  titulo: { fontFamily: fuentes.titulos, fontSize: 20, fontWeight: '700', color: colores.primarioOscuro },
  texto: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.primarioOscuro },
});
