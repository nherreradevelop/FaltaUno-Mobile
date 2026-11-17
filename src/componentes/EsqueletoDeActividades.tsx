import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { colores } from '../comun/tema';

/**
 * Carga con la forma de las tarjetas de actividad, en lugar de un spinner suelto (lineamientos: Respuesta a cada acción).
 * Late suave; si el sistema pide reducir el movimiento, queda quieto.
 */
export function EsqueletoDeActividades({ cantidad = 2 }: { cantidad?: number }) {
  const opacidad = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const latido = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    let vigente = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (vigente && !reducir) latido.start();
    });
    return () => {
      vigente = false;
      latido.stop();
    };
  }, [opacidad]);

  return (
    <View style={estilos.contenedor} accessibilityRole="progressbar" accessibilityLabel="Cargando actividades">
      {Array.from({ length: cantidad }, (_, indice) => (
        <Animated.View key={indice} style={[estilos.tarjeta, { opacity: opacidad }]} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 12 },
  tarjeta: { height: 190, borderRadius: 20, backgroundColor: colores.superficieSutil },
});
