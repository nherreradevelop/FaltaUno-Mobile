import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Ubicacion } from '../api/tipos';
import { esElMismoLugar, urlDeMapaEmbebido, urlDeRecorridoEnGoogleMaps } from '../comun/formato';
import { colores, fuentes } from '../comun/tema';

const ALTO_DEL_MAPA = 220;

/** CU09 A2: "Cómo llegar": salida y destino juntos con el mismo mapa embebido de Google Maps que usa la web. */
export function MapaDelRecorrido({ origen, destino }: { origen: Ubicacion; destino: Ubicacion }) {
  const urlDelRecorrido = urlDeRecorridoEnGoogleMaps(origen, destino);
  const unSoloLugar = esElMismoLugar(origen, destino);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Cómo llegar</Text>
      {unSoloLugar ? (
        <PuntoDelRecorrido tipo="destino" titulo="Lugar" direccion={destino.direccion} />
      ) : (
        <View style={estilos.recorrido}>
          <PuntoDelRecorrido tipo="origen" titulo="Salida" direccion={origen.direccion} />
          <PuntoDelRecorrido tipo="destino" titulo="Destino" direccion={destino.direccion} />
        </View>
      )}
      <View style={estilos.marco}>
        <WebView
          // Google solo sirve el mapa embebido dentro de un iframe: cargado directo en la WebView muestra un error
          source={{ html: paginaConElMapa(urlDeMapaEmbebido(origen, destino)), baseUrl: 'https://www.google.com' }}
          originWhitelist={['*']}
          accessibilityLabel={
            unSoloLugar ? `Mapa de ${destino.direccion}` : `Recorrido de ${origen.direccion} a ${destino.direccion}`
          }
          scrollEnabled={false}
        />
      </View>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(urlDelRecorrido)} hitSlop={8}>
        <Text style={estilos.enlace}>Abrir en Google Maps</Text>
      </Pressable>
    </View>
  );
}

/** Página mínima con el mapa en un iframe que ocupa toda la WebView. */
function paginaConElMapa(urlDelMapa: string): string {
  const urlEnAtributo = urlDelMapa.replace(/&/g, '&amp;');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe src="${urlEnAtributo}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`;
}

interface PropsPunto {
  tipo: 'origen' | 'destino';
  titulo: string;
  direccion: string;
}

function PuntoDelRecorrido({ tipo, titulo, direccion }: PropsPunto) {
  return (
    <View style={estilos.punto}>
      <View style={[estilos.marca, tipo === 'origen' ? estilos.marcaOrigen : estilos.marcaDestino]} />
      <View style={estilos.textoPunto}>
        <Text style={estilos.tituloPunto}>{titulo}</Text>
        <Text style={estilos.direccion}>{direccion}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  recorrido: { gap: 12 },
  punto: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  marca: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  marcaOrigen: { borderWidth: 2, borderColor: colores.primario, backgroundColor: colores.blanco },
  marcaDestino: { backgroundColor: colores.acento },
  textoPunto: { flex: 1 },
  tituloPunto: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  direccion: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 12,
  },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 17, color: colores.texto },
  marco: { height: ALTO_DEL_MAPA, borderRadius: 14, overflow: 'hidden' },
  enlace: { fontFamily: fuentes.texto, fontWeight: '600', fontSize: 15, color: colores.primario },
});
