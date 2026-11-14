import { useEffect, useState } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorApi } from '../api/cliente';
import { buscarUbicaciones, type Coordenadas, type LugarActividad } from '../api/actividades';
import { nuevaClave } from '../comun/formularioActividad';
import { colores, fuentes } from '../comun/tema';
import { Campo } from './Campo';
import { Boton } from './Boton';
import { MapaUbicacion } from './MapaUbicacion';

interface Props {
  etiqueta: string;
  centroInicial: Coordenadas;
  valor: LugarActividad | null;
  alCambiar: (lugar: LugarActividad | null) => void;
  deshabilitado?: boolean;
  alNoDisponible?: () => void;
  error?: string;
}

/** CU10: búsqueda por nombre o selección de pin, con descarte de respuestas anteriores. */
export function SelectorUbicacion({
  etiqueta,
  centroInicial,
  valor,
  alCambiar,
  deshabilitado,
  alNoDisponible,
  error: errorValidacion,
}: Props) {
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [texto, setTexto] = useState(valor?.descripcion ?? '');
  const [sesion] = useState(nuevaClave);
  const [sugerencias, setSugerencias] = useState<LugarActividad[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    if (valor || texto.trim().length < 3 || deshabilitado || mapaAbierto) return;
    let vigente = true;
    const temporizador = setTimeout(() => {
      setCargando(true);
      setError('');
      buscarUbicaciones(texto, sesion)
        .then((lugares) => {
          if (vigente) {
            setSugerencias(lugares);
            if (lugares.length === 0) setError('No encontramos lugares. Probá otra dirección.');
          }
        })
        .catch((fallo: unknown) => {
          if (vigente && fallo instanceof ErrorApi && fallo.estado === 503 && fallo.codigo.startsWith('MAPAS_'))
            alNoDisponible?.();
          if (vigente) setError(fallo instanceof Error ? fallo.message : 'No pudimos buscar ubicaciones.');
        })
        .finally(() => {
          if (vigente) setCargando(false);
        });
    }, 500);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [texto, sesion, valor, deshabilitado, alNoDisponible, mapaAbierto]);
  if (valor?.provisional)
    return (
      <View style={estilos.caja}>
        <Campo etiqueta={etiqueta} value={`${valor.lat}, ${valor.lng}`} editable={false} />
        <Text style={estilos.atribucion}>Ubicación por defecto · pendiente de editar</Text>
      </View>
    );
  return (
    <View style={estilos.caja}>
      <Campo
        etiqueta={etiqueta}
        value={texto}
        error={errorValidacion || error}
        editable={!deshabilitado}
        onChangeText={(nuevo) => {
          setTexto(nuevo);
          setSugerencias([]);
          setError('');
          setCargando(false);
          alCambiar(null);
        }}
      />
      <Boton
        texto="Marcar en mapa"
        variante="secundario"
        deshabilitado={deshabilitado}
        alPresionar={() => {
          Keyboard.dismiss();
          setSugerencias([]);
          setCargando(false);
          setMapaAbierto(true);
        }}
      />
      {mapaAbierto && !deshabilitado && (
        <MapaUbicacion
          etiqueta={etiqueta}
          centroInicial={centroInicial}
          valor={valor}
          alCancelar={() => setMapaAbierto(false)}
          alConfirmar={(lugar) => {
            setMapaAbierto(false);
            setTexto(lugar.descripcion);
            setError('');
            alCambiar(lugar);
          }}
        />
      )}
      {cargando && !mapaAbierto && <Text accessibilityLiveRegion="polite">Buscando lugares…</Text>}
      {!valor &&
        !mapaAbierto &&
        sugerencias.map((lugar) => (
          <Pressable
            key={lugar.placeId}
            accessibilityRole="button"
            disabled={deshabilitado}
            style={estilos.sugerencia}
            onPress={() => {
              setTexto(lugar.descripcion);
              setSugerencias([]);
              alCambiar(lugar);
            }}
          >
            <Text style={estilos.texto}>{lugar.descripcion}</Text>
          </Pressable>
        ))}
      <Text style={estilos.atribucion}>Google Maps</Text>
      {valor && (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            const consulta = valor.tipo === 'pin' ? `${valor.lat},${valor.lng}` : valor.descripcion;
            const placeId = valor.placeId ? `&query_place_id=${encodeURIComponent(valor.placeId)}` : '';
            void Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}${placeId}`,
            ).catch(() => setError('No pudimos abrir Google Maps.'));
          }}
        >
          <Text style={estilos.enlace}>{valor.tipo === 'pin' ? 'Ver pin en Google Maps' : 'Ver ubicación en Google Maps'}</Text>
        </Pressable>
      )}
    </View>
  );
}
const estilos = StyleSheet.create({
  caja: { gap: 6 },
  sugerencia: { padding: 14, borderWidth: 1, borderColor: colores.borde, borderRadius: 10, backgroundColor: colores.blanco },
  texto: { fontFamily: fuentes.texto, color: colores.texto, fontSize: 15 },
  atribucion: { fontFamily: fuentes.texto, color: '#5E5E5E', fontSize: 12, fontWeight: '400' },
  enlace: { fontFamily: fuentes.texto, color: colores.primario, fontSize: 14 },
});
