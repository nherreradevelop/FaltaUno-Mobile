import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, fuentes } from '../../../src/comun/tema';
import { etiquetaDeSeccion, indicadorDeSeccion, SECCIONES, SIN_NOVEDADES, type Seccion } from '../../../src/navegacion/secciones';

type NombreIcono = ComponentProps<typeof Ionicons>['name'];

/** Mismos colores que tabBarActiveTintColor y tabBarInactiveTintColor, para el ícono. */
function colorDeLaOpcion(activa: boolean): string {
  return activa ? colores.primario : colores.textoSuave;
}

/** Alto de la barra sin contar el margen seguro inferior: ícono, texto y el área táctil de 44 puntos (RN7). */
const ALTO_BARRA = 64;

/** RN7: la sección activa se distingue por el ícono relleno y el texto en negrita, además del color. */
function nombreDelIcono(seccion: Seccion, activa: boolean): NombreIcono {
  return activa ? seccion.icono : `${seccion.icono}-outline`;
}

/**
 * M – CU39 Menú de navegabilidad: barra inferior con las secciones principales (FP pasos 2 a 7).
 * Cada sección tiene su propio stack (ver el _layout compartido), así conserva lo que el usuario tenía abierto (RN4).
 * Solo existe dentro de (app), con sesión (RN1, E1). "Crear actividad" queda fuera de la barra (RN9) y las
 * notificaciones se abren desde la campana de Explorar (RN10).
 */
export default function LayoutBarraDeNavegacion() {
  const novedades = SIN_NOVEDADES;
  // La barra se apoya arriba de la barra del sistema (botones o gestos de Android, indicador de inicio en iPhone)
  const margenInferior = useSafeAreaInsets().bottom;

  return (
    <Tabs
      // A3: con "Atrás" en la pantalla principal de otra sección se vuelve a Explorar; en Explorar se cierra la app
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        // A2: la barra se oculta mientras el teclado está abierto
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: [estilos.barra, { height: ALTO_BARRA + margenInferior, paddingBottom: margenInferior }],
        tabBarItemStyle: estilos.opcion,
        tabBarBadgeStyle: estilos.indicador,
      }}
    >
      {SECCIONES.map((seccion) => {
        const cantidad = novedades[seccion.clave];
        return (
          <Tabs.Screen
            key={seccion.clave}
            name={`(${seccion.clave})`}
            options={{
              title: seccion.titulo,
              tabBarAccessibilityLabel: etiquetaDeSeccion(seccion, cantidad),
              tabBarBadge: indicadorDeSeccion(seccion, cantidad),
              tabBarIcon: ({ focused, size }) => (
                <Ionicons name={nombreDelIcono(seccion, focused)} size={size} color={colorDeLaOpcion(focused)} />
              ),
              tabBarLabel: ({ focused, color }) => (
                // En pantallas angostas o con letra grande, el texto se achica para entrar en una línea ("Mis actividades")
                <Text
                  style={[estilos.texto, { color }, focused ? estilos.textoActivo : null]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {seccion.titulo}
                </Text>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  barra: { backgroundColor: colores.superficie, borderTopColor: colores.borde, paddingTop: 6 },
  // RN7: área táctil de al menos 44x44 puntos; sin margen a los costados para que entren los cinco textos
  opcion: { minHeight: 44, paddingHorizontal: 0 },
  texto: { fontFamily: fuentes.texto, fontSize: 11 },
  textoActivo: { fontWeight: '700' },
  indicador: {
    backgroundColor: colores.primario,
    color: colores.sobrePrimario,
    fontFamily: fuentes.texto,
    fontSize: 11,
    fontWeight: '700',
  },
});
