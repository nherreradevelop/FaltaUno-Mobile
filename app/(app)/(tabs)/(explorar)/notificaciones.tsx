import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLasNotificacionesLeidas,
  type Notificacion,
} from '../../../../src/api/notificaciones';
import { Boton } from '../../../../src/componentes/Boton';
import { colores, fuentes } from '../../../../src/comun/tema';
import {
  agregarAlPrincipio,
  haceCuanto,
  marcarLeidaEnLaLista,
  MENSAJES_NOTIFICACIONES,
  rutaDeDestino,
} from '../../../../src/notificaciones/notificaciones';
import { useNotificaciones } from '../../../../src/notificaciones/ProveedorNotificaciones';

type Carga = 'inicial' | 'mas' | null;

/**
 * M – CU40 FP pasos 3 a 7: notificaciones del usuario, de la más reciente a la más antigua.
 * Ver la lista no marca nada como leído (RN5, A4); "Volver" regresa a la pantalla anterior.
 */
export default function PantallaNotificaciones() {
  const { noLeidas, actualizarNoLeidas, nuevas, refrescarNoLeidas } = useNotificaciones();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [carga, setCarga] = useState<Carga>('inicial');
  const [error, setError] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [intento, setIntento] = useState(0);
  // A5: id de la notificación que se está marcando como leída sin abrirla
  const [marcandoUna, setMarcandoUna] = useState<string | null>(null);

  // FP paso 3: primera página. "intento" la vuelve a pedir con "Reintentar" (ER1).
  useEffect(() => {
    let vigente = true;
    listarNotificaciones(null)
      .then((pagina) => {
        if (!vigente) return;
        setLista(pagina.notificaciones);
        setHayMas(pagina.hayMas);
        setError(null);
      })
      .catch(() => {
        if (vigente) setError(MENSAJES_NOTIFICACIONES.errorAlCargar);
      })
      .finally(() => {
        if (vigente) setCarga(null);
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  // Al abrir la pantalla se confirma el indicador con la API, por si cambió sin aviso en vivo
  useEffect(() => {
    refrescarNoLeidas();
    // Solo al abrir: refrescarNoLeidas cambia en cada render del proveedor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A3: con la pantalla abierta, las nuevas se agregan arriba
  useEffect(() => {
    const desuscribir = nuevas.suscribir((notificacion) => setLista((anterior) => agregarAlPrincipio(anterior, notificacion)));
    return desuscribir;
  }, [nuevas]);

  function reintentar() {
    setCarga('inicial');
    setError(null);
    setIntento((anterior) => anterior + 1);
  }

  /** A2: al llegar al final de la lista se piden las 20 anteriores. */
  async function verMas() {
    const ultima = lista[lista.length - 1];
    if (!ultima || !hayMas || carga || error) return;
    setCarga('mas');
    try {
      const pagina = await listarNotificaciones(ultima.id);
      setLista((anterior) => [...anterior, ...pagina.notificaciones]);
      setHayMas(pagina.hayMas);
    } catch {
      setError(MENSAJES_NOTIFICACIONES.errorAlCargar); // ER1: se conserva lo que ya se mostraba
    } finally {
      setCarga(null);
    }
  }

  /** FP pasos 5 a 7. */
  async function abrir(notificacion: Notificacion) {
    if (!notificacion.leida) {
      try {
        actualizarNoLeidas(await marcarNotificacionLeida(notificacion.id));
        setLista((anterior) => marcarLeidaEnLaLista(anterior, notificacion.id));
      } catch {
        // ER2: igual se lleva al usuario a la pantalla; el indicador queda con lo que confirmó la API
      }
    }
    const ruta = rutaDeDestino(notificacion.destino);
    // E2: la pantalla de destino muestra el estado actual (por ejemplo, actividad cancelada)
    if (ruta) router.push(ruta as Parameters<typeof router.push>[0]);
  }

  /** A5: marca una como leída sin abrirla; el usuario se queda en la pantalla. */
  async function marcarComoLeida(notificacion: Notificacion) {
    if (marcandoUna) return;
    setMarcandoUna(notificacion.id);
    setError(null);
    try {
      actualizarNoLeidas(await marcarNotificacionLeida(notificacion.id));
      setLista((anterior) => marcarLeidaEnLaLista(anterior, notificacion.id));
    } catch {
      setError(MENSAJES_NOTIFICACIONES.errorAlMarcarUna); // ER2: queda sin leer
    } finally {
      setMarcandoUna(null);
    }
  }

  /** A1: marca las recibidas hasta este momento. */
  async function marcarTodas() {
    const hasta = new Date();
    setMarcandoTodas(true);
    try {
      actualizarNoLeidas(await marcarTodasLasNotificacionesLeidas(hasta));
      setLista((anterior) => anterior.map((n) => (new Date(n.creadaEn) <= hasta ? { ...n, leida: true } : n)));
    } catch {
      setError(MENSAJES_NOTIFICACIONES.errorAlMarcarTodas); // ER2
    } finally {
      setMarcandoTodas(false);
    }
  }

  const sinNotificaciones = carga === null && !error && lista.length === 0;

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <View style={estilos.barra}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
          <Text style={estilos.enlace}>‹ Volver</Text>
        </Pressable>
        {noLeidas > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: marcandoTodas, busy: marcandoTodas }}
            disabled={marcandoTodas}
            onPress={() => void marcarTodas()}
            hitSlop={12}
          >
            <Text style={estilos.enlace}>{marcandoTodas ? 'Marcando…' : 'Marcar todas como leídas'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={estilos.titulo} accessibilityRole="header">
        Notificaciones
      </Text>

      {carga === 'inicial' ? (
        <View style={estilos.esqueletos} accessibilityRole="progressbar" accessibilityLabel="Cargando notificaciones">
          <View style={estilos.esqueleto} />
          <View style={estilos.esqueleto} />
          <View style={estilos.esqueleto} />
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(notificacion) => notificacion.id}
          contentContainerStyle={estilos.contenido}
          onEndReached={() => void verMas()}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <FilaNotificacion
              notificacion={item}
              alPresionar={() => void abrir(item)}
              alMarcarLeida={() => void marcarComoLeida(item)}
              marcando={marcandoUna === item.id}
              marcadoBloqueado={marcandoUna !== null}
            />
          )}
          ListEmptyComponent={sinNotificaciones ? <Text style={estilos.vacio}>{MENSAJES_NOTIFICACIONES.vacio}</Text> : undefined}
          ListFooterComponent={
            <View style={estilos.pie}>
              {carga === 'mas' ? <ActivityIndicator color={colores.primario} /> : null}
              {error ? (
                <View style={estilos.aviso} accessibilityRole="alert">
                  <Text style={estilos.textoAviso}>{error}</Text>
                  <Boton
                    texto="Reintentar"
                    variante="secundario"
                    alPresionar={lista.length === 0 ? reintentar : () => setError(null)}
                  />
                </View>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

interface PropsFila {
  notificacion: Notificacion;
  alPresionar: () => void;
  alMarcarLeida: () => void;
  marcando: boolean;
  marcadoBloqueado: boolean;
}

function FilaNotificacion({ notificacion, alPresionar, alMarcarLeida, marcando, marcadoBloqueado }: PropsFila) {
  const noLeida = !notificacion.leida;
  const cuando = haceCuanto(notificacion.creadaEn);
  return (
    <View style={[estilos.fila, noLeida ? estilos.filaNoLeida : null]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${noLeida ? 'Sin leer: ' : ''}${notificacion.texto}. ${cuando}`}
        onPress={alPresionar}
        style={({ pressed }) => [estilos.contenidoFila, pressed ? estilos.filaPresionada : null]}
      >
        {/* El punto acompaña a la negrita y a la etiqueta accesible: el color no es la única señal */}
        <View style={[estilos.punto, noLeida ? estilos.puntoNoLeida : null]} />
        <View style={estilos.textos}>
          <Text style={[estilos.texto, noLeida ? estilos.textoNoLeida : null]}>{notificacion.texto}</Text>
          <Text style={estilos.cuando}>{cuando}</Text>
        </View>
      </Pressable>
      {/* A5: solo en las que están sin leer; en las leídas el espacio queda vacío para que los textos se alineen */}
      {noLeida ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Marcar como leída: ${notificacion.texto}`}
          accessibilityState={{ disabled: marcadoBloqueado, busy: marcando }}
          disabled={marcadoBloqueado}
          onPress={alMarcarLeida}
          hitSlop={8}
          style={[estilos.marcarLeida, marcadoBloqueado ? estilos.marcarLeidaBloqueado : null]}
        >
          {/* El tilde va en un círculo, igual que en la web */}
          {({ pressed }) => (
            <View style={[estilos.circulo, pressed ? estilos.circuloPresionado : null]}>
              <Text style={[estilos.textoMarcarLeida, pressed ? estilos.textoMarcarLeidaPresionado : null]}>✓</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={estilos.marcarLeida} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  enlace: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '600', color: colores.primario },
  titulo: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontFamily: fuentes.titulos,
    fontWeight: '800',
    fontSize: 26,
    color: colores.texto,
  },
  contenido: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  esqueletos: { paddingHorizontal: 20, gap: 8 },
  esqueleto: { height: 64, borderRadius: 14, backgroundColor: colores.superficieSutil },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 4,
    borderRadius: 14,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  filaNoLeida: { backgroundColor: colores.primarioClaro, borderColor: colores.primarioClaro },
  filaPresionada: { opacity: 0.85 },
  contenidoFila: { flex: 1, flexDirection: 'row', gap: 12, padding: 10, paddingLeft: 14, minHeight: 44 },
  marcarLeida: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  marcarLeidaBloqueado: { opacity: 0.5 },
  circulo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    shadowColor: colores.texto,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  circuloPresionado: { backgroundColor: colores.superficieSutil },
  textoMarcarLeida: { fontFamily: fuentes.texto, fontSize: 16, lineHeight: 20, color: colores.textoSuave },
  textoMarcarLeidaPresionado: { color: colores.primario },
  punto: { width: 10, height: 10, marginTop: 6, borderRadius: 5 },
  puntoNoLeida: { backgroundColor: colores.primario },
  textos: { flex: 1, gap: 4 },
  texto: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 21, color: colores.texto },
  textoNoLeida: { fontWeight: '700' },
  cuando: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  vacio: { marginTop: 32, textAlign: 'center', fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSuave },
  pie: { paddingTop: 8, gap: 12 },
  aviso: { backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14, gap: 12 },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
});
