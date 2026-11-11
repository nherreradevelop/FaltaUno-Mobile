import { Image, StyleSheet, Text, View } from 'react-native';
import { colorDeAvatar, iniciales, urlDeFotoAlTamano } from '../comun/formato';
import { colores, fuentes } from '../comun/tema';

interface PropsAvatar {
  nombre: string;
  fotoUrl: string | null;
  /** Lado en puntos. */
  tamano: number;
}

/** Foto de perfil redonda; sin foto, muestra las iniciales (como en los mockups). */
export function Avatar({ nombre, fotoUrl, tamano }: PropsAvatar) {
  const estiloTamano = { width: tamano, height: tamano, borderRadius: tamano / 2 };

  if (fotoUrl) {
    return (
      <Image source={{ uri: urlDeFotoAlTamano(fotoUrl, tamano) }} style={estiloTamano} accessibilityLabel={`Foto de ${nombre}`} />
    );
  }
  return (
    <View
      style={[estilos.iniciales, estiloTamano, { backgroundColor: colorDeAvatar(nombre) }]}
      accessibilityLabel={nombre}
      accessibilityRole="image"
    >
      <Text style={[estilos.texto, { fontSize: Math.round(tamano * 0.4) }]}>{iniciales(nombre)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  iniciales: { alignItems: 'center', justifyContent: 'center' },
  texto: { color: colores.blanco, fontFamily: fuentes.texto, fontWeight: '700' },
});
