import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../comun/tema';

const PUNTAJES = [1, 2, 3, 4, 5];

/**
 * CU09 FP paso 4: valorar a un participante con 1 a 5 estrellas (puntaje de la tabla valoracion).
 * Pendiente: CU21 – Sistema de valoración de usuarios. Por ahora se muestran pero no se pueden seleccionar.
 */
export function EstrellasDeValoracion({ nombre }: { nombre: string }) {
  return (
    <View
      style={estilos.estrellas}
      accessibilityLabel={`Valorar a ${nombre} (disponible con el CU21)`}
      accessibilityState={{ disabled: true }}
    >
      {PUNTAJES.map((puntaje) => (
        <Text key={puntaje} style={estilos.estrella}>
          ☆
        </Text>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  estrellas: { flexDirection: 'row', gap: 2, opacity: 0.6 },
  estrella: { fontSize: 16, lineHeight: 18, color: colores.acento },
});
