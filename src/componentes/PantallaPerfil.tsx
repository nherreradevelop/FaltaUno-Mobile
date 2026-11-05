import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ActividadDelHistorial, Perfil } from '../api/tipos';
import { obtenerMiHistorial, obtenerMiPerfil, obtenerPerfilDeUsuario } from '../api/usuarios';
import {
  formatearCantidadActividades,
  formatearCantidadValoraciones,
  formatearFecha,
  formatearValoracion,
} from '../comun/formato';
import {
  clasificarErrorDePerfil,
  ETIQUETA_ESTADO,
  MENSAJE_FALLA_HISTORIAL,
  type ResultadoDeError,
} from '../comun/mensajesPerfil';
import { colores, fuentes } from '../comun/tema';
import { Avatar } from './Avatar';
import { Boton } from './Boton';

type EstadoPerfil = { tipo: 'cargando' } | { tipo: 'listo'; perfil: Perfil } | ResultadoDeError;

/**
 * M – CU04 Visualizar perfil de usuario. Sin usuarioId muestra el perfil propio (FP); con usuarioId,
 * el perfil público de otro usuario (A1). La usan app/(app)/perfil/index.tsx y app/(app)/perfil/[id].tsx.
 */
export function PantallaPerfil({ usuarioId }: { usuarioId?: string }) {
  const { estado, reintentar } = usePerfil(usuarioId);
  const esPropio = estado.tipo === 'listo' && estado.perfil.esPropio;
  // El historial se pide solo en el perfil propio: el perfil público no lo muestra (A1)
  const historial = useHistorial(esPropio);

  return (
    <SafeAreaView style={estilos.pantalla}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={estilos.volver} hitSlop={12}>
        <Text style={estilos.textoVolver}>‹ Volver</Text>
      </Pressable>

      {/* FlatList y no ScrollView: el historial puede tener muchas actividades */}
      <FlatList
        data={historial.actividades}
        keyExtractor={(actividad) => actividad.id}
        renderItem={({ item }) => <FilaDeActividad actividad={item} />}
        contentContainerStyle={estilos.contenido}
        ListHeaderComponent={<EncabezadoDelPerfil estado={estado} reintentar={reintentar} />}
        ListFooterComponent={esPropio ? <PieDelHistorial historial={historial} /> : undefined}
      />
    </SafeAreaView>
  );
}

function usePerfil(usuarioId?: string) {
  const [estado, setEstado] = useState<EstadoPerfil>({ tipo: 'cargando' });
  /** Se incrementa al tocar "Reintentar" (CU04 ER1, RNF-10). */
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    // Si el usuario sale de la pantalla antes de que llegue la respuesta, se descarta
    let vigente = true;
    setEstado({ tipo: 'cargando' });

    const pedido = usuarioId ? obtenerPerfilDeUsuario(usuarioId) : obtenerMiPerfil();
    pedido
      .then((perfil) => {
        if (vigente) setEstado({ tipo: 'listo', perfil });
      })
      .catch((error: unknown) => {
        if (vigente) setEstado(clasificarErrorDePerfil(error));
      });

    return () => {
      vigente = false;
    };
  }, [usuarioId, intento]);

  return { estado, reintentar: () => setIntento((anterior) => anterior + 1) };
}

interface EstadoHistorial {
  actividades: ActividadDelHistorial[];
  hayMas: boolean;
  cargando: boolean;
  hayError: boolean;
  verMas: () => void;
  reintentar: () => void;
}

/** CU04 FP paso 2: historial de a 10; "Ver más" agrega la página siguiente. */
function useHistorial(habilitado: boolean): EstadoHistorial {
  const [actividades, setActividades] = useState<ActividadDelHistorial[]>([]);
  const [paginaCargada, setPaginaCargada] = useState(0);
  const [paginaPedida, setPaginaPedida] = useState(1);
  const [intento, setIntento] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [hayError, setHayError] = useState(false);

  useEffect(() => {
    if (!habilitado) {
      return;
    }
    let vigente = true;
    setCargando(true);
    setHayError(false);

    obtenerMiHistorial(paginaPedida)
      .then((historial) => {
        if (!vigente) return;
        setActividades((anteriores) => [...anteriores, ...historial.actividades]);
        setPaginaCargada(historial.pagina);
        setHayMas(historial.hayMas);
      })
      .catch(() => {
        if (vigente) setHayError(true); // CU04 ER1
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [habilitado, paginaPedida, intento]);

  // Entre que se habilita y arranca el pedido de la primera página, ya se considera "cargando"
  const esperandoPrimeraPagina = habilitado && paginaCargada === 0 && !hayError;

  return {
    actividades,
    hayMas,
    cargando: cargando || esperandoPrimeraPagina,
    hayError,
    verMas: () => setPaginaPedida(paginaCargada + 1),
    // RNF-10: vuelve a pedir la página que falló; las ya cargadas no se piden de nuevo ni se duplican
    reintentar: () => setIntento((anterior) => anterior + 1),
  };
}

function EncabezadoDelPerfil({ estado, reintentar }: { estado: EstadoPerfil; reintentar: () => void }) {
  if (estado.tipo === 'cargando') {
    return <ActivityIndicator color={colores.primario} style={estilos.cargando} />;
  }
  if (estado.tipo === 'noDisponible') {
    return <Text style={[estilos.tarjeta, estilos.textoSuave]}>{estado.mensaje}</Text>; // CU04 E1
  }
  if (estado.tipo === 'falla') {
    return <AvisoDeError mensaje={estado.mensaje} reintentar={reintentar} />; // CU04 ER1
  }
  return <DatosDelPerfil perfil={estado.perfil} />;
}

function DatosDelPerfil({ perfil }: { perfil: Perfil }) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <Avatar nombre={perfil.nombre} fotoUrl={perfil.fotoUrl} tamano={80} />
        <View style={estilos.identidad}>
          <Text style={estilos.nombre}>{perfil.nombre}</Text>
          {perfil.esPropio ? <Text style={estilos.textoSuave}>{perfil.email}</Text> : null}
          <Text>
            <Valoracion valoracionPromedio={perfil.valoracionPromedio} />
            {/* CU04 FP: en el perfil propio se indica cuántas valoraciones recibió */}
            {perfil.esPropio && perfil.cantidadValoraciones > 0 ? (
              <Text style={estilos.textoSuave}> · {formatearCantidadValoraciones(perfil.cantidadValoraciones)}</Text>
            ) : null}
            {/* CU04 A1: en el perfil de otro usuario se muestra cuántas actividades tiene, no cuáles */}
            {!perfil.esPropio ? (
              <Text style={estilos.textoSuave}> · {formatearCantidadActividades(perfil.cantidadActividades)}</Text>
            ) : null}
          </Text>
        </View>
      </View>

      {perfil.biografia ? <Text style={estilos.biografia}>{perfil.biografia}</Text> : null}

      {perfil.deportes.length > 0 ? (
        <View style={estilos.deportes} accessibilityLabel="Deportes que practica">
          {perfil.deportes.map((deporte) => (
            <Text key={deporte.id} style={estilos.etiqueta}>
              {deporte.nombre}
            </Text>
          ))}
        </View>
      ) : null}

      {/* CU04 RN2: "Editar perfil" solo en el perfil propio. Pendiente: CU05 – Editar perfil de usuario (A2) */}
      {perfil.esPropio ? <Boton texto="Editar perfil" variante="secundario" alPresionar={() => {}} deshabilitado /> : null}

      {/* Opciones desde el perfil de otro usuario. Pendiente: CU06 – Gestionar lista de amigos y CU07 – Mensajería entre dos usuarios */}
      {!perfil.esPropio ? (
        <View style={estilos.acciones}>
          <View style={estilos.accion}>
            <Boton texto="Agregar amigo" variante="secundario" alPresionar={() => {}} deshabilitado />
          </View>
          <View style={estilos.accion}>
            <Boton texto="Enviar mensaje" variante="secundario" alPresionar={() => {}} deshabilitado />
          </View>
        </View>
      ) : null}

      {perfil.esPropio ? <Text style={estilos.subtitulo}>Actividades en las que participé</Text> : null}
    </View>
  );
}

/** CU04 RN3: promedio con 2 decimales, o "Sin valoraciones". */
function Valoracion({ valoracionPromedio }: { valoracionPromedio: number | null }) {
  if (valoracionPromedio === null) {
    return <Text style={estilos.textoSuave}>Sin valoraciones</Text>;
  }
  return (
    <Text style={estilos.valoracion} accessibilityLabel={`Valoración promedio ${formatearValoracion(valoracionPromedio)} de 5`}>
      ★ {formatearValoracion(valoracionPromedio)}
    </Text>
  );
}

function FilaDeActividad({ actividad }: { actividad: ActividadDelHistorial }) {
  const esCancelada = actividad.estado === 'cancelada';
  return (
    <View style={estilos.fila}>
      <View style={estilos.datosFila}>
        <Text style={estilos.nombreActividad}>{actividad.nombre}</Text>
        <Text style={estilos.textoSuave}>
          {actividad.deporte} · {formatearFecha(actividad.fechaHoraInicio)}
        </Text>
      </View>
      <Text style={[estilos.etiqueta, esCancelada ? estilos.etiquetaCancelada : estilos.etiquetaArchivada]}>
        {ETIQUETA_ESTADO[actividad.estado]}
      </Text>
    </View>
  );
}

function PieDelHistorial({ historial }: { historial: EstadoHistorial }) {
  if (historial.cargando) {
    return <ActivityIndicator color={colores.primario} style={estilos.cargando} />;
  }
  if (historial.hayError) {
    return <AvisoDeError mensaje={MENSAJE_FALLA_HISTORIAL} reintentar={historial.reintentar} />;
  }
  if (historial.actividades.length === 0) {
    return <Text style={estilos.textoSuave}>Todavía no tenés actividades archivadas o canceladas.</Text>;
  }
  if (historial.hayMas) {
    return <Boton texto="Ver más" variante="secundario" alPresionar={historial.verMas} />;
  }
  return null;
}

function AvisoDeError({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return (
    <View style={estilos.aviso} accessibilityRole="alert">
      <Text style={estilos.textoAviso}>{mensaje}</Text>
      <Boton texto="Reintentar" variante="secundario" alPresionar={reintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  volver: { paddingHorizontal: 20, paddingVertical: 12 },
  textoVolver: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '600', color: colores.primario },
  contenido: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  cargando: { marginVertical: 24 },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 14,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  identidad: { flex: 1, gap: 4 },
  nombre: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 24, color: colores.texto },
  valoracion: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 16, color: colores.texto },
  biografia: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.texto },
  deportes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  etiqueta: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    fontFamily: fuentes.texto,
    fontWeight: '600',
    fontSize: 14,
  },
  etiquetaArchivada: { backgroundColor: '#E3EFE3', color: '#2D5A2D' },
  etiquetaCancelada: { backgroundColor: colores.errorFondo, color: colores.error },
  acciones: { flexDirection: 'row', gap: 10 },
  accion: { flex: 1 },
  subtitulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 18, color: colores.texto, marginTop: 6 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  datosFila: { flex: 1, gap: 2 },
  nombreActividad: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  textoSuave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  aviso: { backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14, gap: 12 },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
});
