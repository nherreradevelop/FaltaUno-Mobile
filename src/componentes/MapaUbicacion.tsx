import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detalleUbicacion, resolverPunto, type Coordenadas, type LugarActividad } from '../api/actividades';
import { colores, fuentes } from '../comun/tema';
import { ubicarDispositivo } from '../infra/geolocalizacion';
import { Boton } from './Boton';

interface Props {
  etiqueta: string;
  centroInicial: Coordenadas;
  valor: LugarActividad | null;
  alConfirmar: (lugar: LugarActividad) => void;
  alCancelar: () => void;
}

function regionDe(punto: Coordenadas): Region {
  return { latitude: punto.lat, longitude: punto.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 };
}

/** CU10: mapa nativo en una vista propia; solo la confirmación consulta a la API por el pin. */
export function MapaUbicacion({ etiqueta, centroInicial, valor, alConfirmar, alCancelar }: Props) {
  const mapa = useRef<MapView>(null);
  const montado = useRef(false);
  const puntoActual = useRef<Coordenadas | null>(null);
  const centroActual = useRef(centroInicial);
  const localizacion = useRef<AbortController | null>(null);
  const validacion = useRef(false);
  const [centro, setCentro] = useState(centroInicial);
  const [punto, setPunto] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [listo, setListo] = useState(false);
  const [validando, setValidando] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [precision, setPrecision] = useState<number | null>(null);
  const [error, setError] = useState('');
  const tieneClave = Boolean(
    Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY : process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY,
  );
  const { lat: centroLat, lng: centroLng } = centroInicial;

  useEffect(() => {
    montado.current = true;
    let vigente = true;
    async function iniciar() {
      try {
        const ubicacion = valor?.placeId && !valor.provisional ? await detalleUbicacion(valor.placeId) : valor;
        if (!vigente) return;
        const inicial =
          ubicacion?.lat !== undefined && ubicacion.lng !== undefined
            ? { lat: ubicacion.lat, lng: ubicacion.lng }
            : { lat: centroLat, lng: centroLng };
        setCentro(inicial);
        centroActual.current = inicial;
        if (valor?.tipo === 'pin') {
          puntoActual.current = inicial;
          setPunto(inicial);
        }
      } catch {
        if (vigente) setError('No pudimos centrar el lugar anterior. Podés marcar otro punto.');
      } finally {
        if (vigente) setCargando(false);
      }
    }
    if (tieneClave) void iniciar();
    else setCargando(false);
    return () => {
      vigente = false;
      montado.current = false;
      localizacion.current?.abort();
      localizacion.current = null;
    };
  }, [centroLat, centroLng, valor, tieneClave]);

  function marcar(nuevo: Coordenadas) {
    localizacion.current?.abort();
    localizacion.current = null;
    setLocalizando(false);
    setPrecision(null);
    setError('');
    puntoActual.current = nuevo;
    setPunto(nuevo);
  }

  async function usarMiUbicacion() {
    if (localizacion.current || validacion.current || !listo) return;
    const controlador = new AbortController();
    localizacion.current = controlador;
    setLocalizando(true);
    setError('');
    try {
      const ubicacion = await ubicarDispositivo(controlador.signal);
      if (!montado.current || controlador.signal.aborted) return;
      const nuevo = { lat: ubicacion.lat, lng: ubicacion.lng };
      localizacion.current = null;
      marcar(nuevo);
      centroActual.current = nuevo;
      mapa.current?.animateToRegion(regionDe(nuevo));
      setPrecision(ubicacion.precisionMetros);
    } catch (fallo) {
      if (montado.current && !controlador.signal.aborted)
        setError(fallo instanceof Error ? fallo.message : 'No pudimos obtener tu ubicación.');
    } finally {
      if (localizacion.current === controlador) {
        localizacion.current = null;
        if (montado.current) setLocalizando(false);
      }
    }
  }

  async function confirmar() {
    const elegido = puntoActual.current;
    if (!elegido || validacion.current || localizacion.current) return;
    validacion.current = true;
    setValidando(true);
    setError('');
    try {
      const ubicacion = await resolverPunto(elegido);
      if (!montado.current) return;
      if (puntoActual.current?.lat !== elegido.lat || puntoActual.current?.lng !== elegido.lng) {
        setError('El punto cambió mientras se validaba. Confirmá el nuevo punto.');
        return;
      }
      alConfirmar({ placeId: null, tipo: 'pin', descripcion: ubicacion.direccion, ...elegido });
    } catch (fallo) {
      if (montado.current) setError(fallo instanceof Error ? fallo.message : 'No pudimos validar el punto.');
    } finally {
      validacion.current = false;
      if (montado.current) setValidando(false);
    }
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!validacion.current) alCancelar();
      }}
    >
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.encabezado}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            {etiqueta}
          </Text>
          <Text style={estilos.texto}>Tocá para colocar el pin. Mantenelo presionado para arrastrarlo.</Text>
        </View>
        <View style={estilos.contenedorMapa}>
          {!tieneClave ? (
            <Text style={estilos.error}>El mapa no está configurado. Podés volver a buscar un lugar por nombre.</Text>
          ) : cargando ? (
            <ActivityIndicator accessibilityLabel="Cargando mapa" color={colores.primario} />
          ) : (
            <>
              <MapView
                ref={mapa}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                initialRegion={regionDe(centro)}
                loadingEnabled
                showsMyLocationButton={false}
                showsUserLocation={false}
                toolbarEnabled={false}
                moveOnMarkerPress={false}
                onMapReady={() => setListo(true)}
                onRegionChangeComplete={(region) => {
                  centroActual.current = { lat: region.latitude, lng: region.longitude };
                }}
                onPress={(evento) =>
                  marcar({ lat: evento.nativeEvent.coordinate.latitude, lng: evento.nativeEvent.coordinate.longitude })
                }
              >
                {punto && (
                  <Marker
                    coordinate={{ latitude: punto.lat, longitude: punto.lng }}
                    pinColor={colores.primario}
                    draggable
                    title="Punto seleccionado"
                    onDragEnd={(evento) =>
                      marcar({ lat: evento.nativeEvent.coordinate.latitude, lng: evento.nativeEvent.coordinate.longitude })
                    }
                  />
                )}
              </MapView>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !listo || validando || localizando, busy: localizando }}
                disabled={!listo || validando || localizando}
                style={[estilos.miUbicacion, (!listo || validando || localizando) && estilos.inactivo]}
                onPress={() => void usarMiUbicacion()}
              >
                <Text style={estilos.enlace}>{localizando ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}</Text>
              </Pressable>
            </>
          )}
        </View>
        <View style={estilos.pie}>
          {localizando && (
            <Text accessibilityLiveRegion="polite" style={estilos.texto}>
              Esperando tu ubicación. Android o iOS puede pedirte permiso.
            </Text>
          )}
          {precision !== null && (
            <Text style={estilos.texto}>Ubicación aproximada (±{Math.ceil(precision)} m). Podés ajustar el pin.</Text>
          )}
          {punto && (
            <Text style={estilos.coordenadas}>
              {punto.lat.toFixed(6)}, {punto.lng.toFixed(6)}
            </Text>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={estilos.error}>
              {error}
            </Text>
          )}
          <Boton
            texto="Marcar el centro del mapa"
            variante="secundario"
            deshabilitado={!listo || validando}
            alPresionar={() => marcar(centroActual.current)}
          />
          <Boton
            texto="Usar este punto"
            cargando={validando}
            deshabilitado={!listo || !punto || localizando}
            alPresionar={() => void confirmar()}
          />
          <Boton texto="Volver a buscar lugar" variante="secundario" deshabilitado={validando} alPresionar={alCancelar} />
          <Text style={estilos.nota}>Se conserva el punto del pin; la dirección puede ser una referencia cercana.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { padding: 16, gap: 6 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 22, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  contenedorMapa: { flex: 1, minHeight: 160, justifyContent: 'center', padding: 16, backgroundColor: colores.primarioClaro },
  pie: { padding: 16, gap: 8 },
  miUbicacion: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colores.blanco,
    elevation: 3,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  enlace: { fontFamily: fuentes.texto, fontSize: 14, color: colores.primario, fontWeight: '700' },
  inactivo: { opacity: 0.6 },
  coordenadas: { fontFamily: fuentes.texto, fontSize: 13, color: colores.texto },
  error: { fontFamily: fuentes.texto, color: colores.error, fontSize: 14 },
  nota: { fontFamily: fuentes.texto, color: colores.textoSuave, fontSize: 12 },
});
