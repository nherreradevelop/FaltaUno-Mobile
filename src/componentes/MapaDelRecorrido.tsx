import { useCallback, useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import type { Ubicacion } from '../api/tipos';
import { colorDeAvatar, esElMismoLugar, urlDeMapaEmbebido, urlDeRecorridoEnGoogleMaps } from '../comun/formato';
import { hayClaveDeMapasNativos } from '../comun/mapasNativos';
import {
  inicialDelParticipante,
  LEYENDA_DEL_MAPA,
  tituloDelPuntoDePartida,
  type PuntoDePartidaEnMapa,
} from '../comun/puntosDePartida';
import { colores, fuentes } from '../comun/tema';

const ALTO_DEL_MAPA = 220;
const ZOOM_DE_UN_LUGAR = 0.02;
const RELLENO_ALREDEDOR_DE_LOS_PUNTOS = { top: 48, right: 48, bottom: 48, left: 48 };

interface Props {
  /** null si la actividad no tiene punto de partida (CU10: el origen es opcional). */
  origen: Ubicacion | null;
  destino: Ubicacion;
  /** CU11 paso 5: puntos de partida de los participantes. Vacío si no hay o si quien mira no forma parte. */
  puntosDePartida: PuntoDePartidaEnMapa[];
}

/**
 * CU09 A2: "Cómo llegar": salida y destino juntos en un mapa de Google Maps.
 * Con key nativa se usa el mapa nativo, que además marca los puntos de partida de los participantes. Sin key, el mapa
 * embebido (igual al de la web), que no admite marcadores propios.
 */
export function MapaDelRecorrido({ origen: origenIndicado, destino, puntosDePartida }: Props) {
  // Sin punto de partida, el recorrido es un solo lugar: el destino
  const origen = origenIndicado ?? destino;
  const urlDelRecorrido = urlDeRecorridoEnGoogleMaps(origen, destino);
  const unSoloLugar = esElMismoLugar(origen, destino);
  const descripcion = unSoloLugar ? `Mapa de ${destino.direccion}` : `Recorrido de ${origen.direccion} a ${destino.direccion}`;
  const usaMapaNativo = hayClaveDeMapasNativos();
  const mostrarPuntosDePartida = usaMapaNativo && puntosDePartida.length > 0;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Cómo llegar</Text>
      {unSoloLugar ? (
        <PuntoDelRecorrido tipo="destino" titulo="Lugar" direccion={destino.direccion} />
      ) : (
        <View style={estilos.recorrido}>
          <PuntoDelRecorrido tipo="origen" titulo={LEYENDA_DEL_MAPA.salida} direccion={origen.direccion} />
          <PuntoDelRecorrido tipo="destino" titulo={LEYENDA_DEL_MAPA.destino} direccion={destino.direccion} />
        </View>
      )}
      <View style={estilos.marco}>
        {usaMapaNativo ? (
          <MapaNativo origen={origen} destino={destino} puntosDePartida={puntosDePartida} descripcion={descripcion} />
        ) : (
          <WebView
            // Google solo sirve el mapa embebido dentro de un iframe: cargado directo en la WebView muestra un error
            source={{ html: paginaConElMapa(urlDeMapaEmbebido(origen, destino)), baseUrl: 'https://www.google.com' }}
            originWhitelist={['*']}
            accessibilityLabel={descripcion}
            scrollEnabled={false}
          />
        )}
      </View>
      {mostrarPuntosDePartida ? (
        <View style={estilos.leyenda}>
          <View style={[estilos.marca, estilos.marcaParticipante]} />
          <Text style={estilos.textoLeyenda}>
            {LEYENDA_DEL_MAPA.participantes} ({puntosDePartida.length})
          </Text>
        </View>
      ) : null}
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(urlDelRecorrido)} hitSlop={8}>
        <Text style={estilos.enlace}>Abrir en Google Maps</Text>
      </Pressable>
    </View>
  );
}

interface PropsMapaNativo {
  origen: Ubicacion;
  destino: Ubicacion;
  puntosDePartida: PuntoDePartidaEnMapa[];
  descripcion: string;
}

/** Mapa nativo con la salida, el destino y un marcador circular con la inicial de cada participante. */
function MapaNativo({ origen, destino, puntosDePartida, descripcion }: PropsMapaNativo) {
  const mapa = useRef<MapView>(null);
  const mapaListo = useRef(false);
  const unSoloLugar = esElMismoLugar(origen, destino);

  /** Encuadra todos los puntos. Con uno solo no hace falta: el mapa ya arranca centrado en el destino. */
  const encuadrar = useCallback(() => {
    if (!mapaListo.current || (unSoloLugar && puntosDePartida.length === 0)) {
      return;
    }
    const puntos = [origen, destino, ...puntosDePartida];
    mapa.current?.fitToCoordinates(
      puntos.map((punto) => ({ latitude: punto.lat, longitude: punto.lng })),
      { edgePadding: RELLENO_ALREDEDOR_DE_LOS_PUNTOS, animated: false },
    );
  }, [origen, destino, puntosDePartida, unSoloLugar]);

  // Los participantes llegan después que el mapa: cuando cambian, se vuelve a encuadrar
  useEffect(encuadrar, [encuadrar]);

  return (
    <MapView
      ref={mapa}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      accessibilityLabel={descripcion}
      initialRegion={{
        latitude: destino.lat,
        longitude: destino.lng,
        latitudeDelta: ZOOM_DE_UN_LUGAR,
        longitudeDelta: ZOOM_DE_UN_LUGAR,
      }}
      onMapReady={() => {
        mapaListo.current = true;
        encuadrar();
      }}
      toolbarEnabled={false}
      scrollEnabled={false}
      zoomEnabled
    >
      <Marker
        coordinate={{ latitude: destino.lat, longitude: destino.lng }}
        pinColor={colores.acento}
        title={LEYENDA_DEL_MAPA.destino}
        description={destino.direccion}
      />
      {unSoloLugar ? null : (
        <Marker
          coordinate={{ latitude: origen.lat, longitude: origen.lng }}
          pinColor={colores.primario}
          title={LEYENDA_DEL_MAPA.salida}
          description={origen.direccion}
        />
      )}
      {puntosDePartida.map((punto) => (
        <Marker
          key={punto.clave}
          coordinate={{ latitude: punto.lat, longitude: punto.lng }}
          title={tituloDelPuntoDePartida(punto)}
          // Vista fija: no hace falta que el mapa la vuelva a dibujar en cada cuadro
          tracksViewChanges={false}
        >
          <View style={[estilos.pinParticipante, { backgroundColor: colorDeAvatar(punto.nombre) }]}>
            <Text style={estilos.inicialParticipante}>{inicialDelParticipante(punto.nombre)}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
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
  marcaOrigen: { borderWidth: 2, borderColor: colores.primario, backgroundColor: colores.superficie },
  marcaDestino: { backgroundColor: colores.acento },
  marcaParticipante: { marginTop: 0, backgroundColor: colores.primario, borderWidth: 2, borderColor: colores.superficie },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textoLeyenda: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  pinParticipante: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicialParticipante: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 13, color: colores.sobrePrimario },
  textoPunto: { flex: 1 },
  tituloPunto: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  direccion: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  tarjeta: {
    backgroundColor: colores.superficie,
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
