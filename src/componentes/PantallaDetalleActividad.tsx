import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerDetalleDeActividad, obtenerParticipantes } from '../api/actividades';
import type { DetalleActividad, ParticipanteDeActividad } from '../api/tipos';
import {
  formatearFechaHora,
  formatearLugaresLibres,
  formatearMonto,
  hayLugaresLibres,
  proporcionOcupada,
} from '../comun/formato';
import {
  ACCIONES_DEL_MENU,
  filasDeParticipantes,
  type FilaDeParticipantes,
  ACCIONES_RAPIDAS,
  accionesOfrecidas,
  accionPrincipal,
  clasificarErrorDeActividad,
  ETIQUETA_NIVEL,
  ETIQUETA_ROL,
  MENSAJE_FALLA_PARTICIPANTES,
  pestanasDisponibles,
  resumenDeQuienesVan,
  type ErrorDeActividad,
  type PestanaDeActividad,
} from '../comun/mensajesActividad';
import { ETIQUETA_ESTADO } from '../comun/mensajesPerfil';
import { colores, fuentes } from '../comun/tema';
import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { EstrellasDeValoracion } from './EstrellasDeValoracion';
import { useSesion } from '../sesion/SesionContexto';
import { MapaDelRecorrido } from './MapaDelRecorrido';

type EstadoPantalla = { tipo: 'cargando' } | { tipo: 'listo'; actividad: DetalleActividad } | ErrorDeActividad;

/**
 * M – CU09 Detalle de actividad. La usa app/(app)/actividades/[id]/index.tsx.
 * Sin sesión, app/_layout.tsx lleva al login y después vuelve acá (A3).
 */
export function PantallaDetalleActividad({ actividadId }: { actividadId: string }) {
  const { estado, reintentar } = useDetalle(actividadId);
  const actividad = estado.tipo === 'listo' ? estado.actividad : null;
  // CU09 A1: una sola llamada para los avatares de la cabecera y la pestaña Participantes
  const participantes = useParticipantes(actividadId, actividad?.opciones.includes('verParticipantes') ?? false);
  const puedeRemover = actividad?.opciones.includes('removerParticipantes') ?? false;
  // RN5 / CU21: la API ofrece valorar cuando la actividad está iniciada o archivada y el usuario forma parte
  const puedeValorar = actividad?.opciones.includes('valorar') ?? false;
  const { sesion } = useSesion();
  const usuarioActualId = sesion?.usuario.id ?? null;
  const [pestanaActiva, setPestanaActiva] = useState<PestanaDeActividad>('participantes');
  const [menuAbierto, setMenuAbierto] = useState(false);
  // La lista solo se muestra en la pestaña "Participantes"; lo cargado se conserva al cambiar de pestaña.
  // CU09 A1: los invitados externos tienen fila propia, debajo de quien los trae
  const filasVisibles = pestanaActiva === 'participantes' ? filasDeParticipantes(participantes.lista) : [];

  // "Ver todos": abre la pestaña Participantes y baja hasta ella
  const listaRef = useRef<FlatList<FilaDeParticipantes>>(null);
  const posicionDePestanas = useRef(0);
  function verTodosLosParticipantes() {
    setPestanaActiva('participantes');
    listaRef.current?.scrollToOffset({ offset: posicionDePestanas.current, animated: true });
  }

  // CU09 E2: se informa que la actividad no está disponible y se vuelve al inicio
  useEffect(() => {
    if (estado.tipo === 'noDisponible') {
      router.replace({ pathname: '/', params: { aviso: estado.mensaje } });
    }
  }, [estado]);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <BarraSuperior actividad={actividad} alAbrirMenu={() => setMenuAbierto(true)} />

      {/* FlatList: la ficha, el mapa y las pestañas van en el encabezado; los participantes son la lista, que puede ser larga */}
      <FlatList
        ref={listaRef}
        data={filasVisibles}
        keyExtractor={(fila) => fila.clave}
        renderItem={({ item }) =>
          item.tipo === 'usuario' ? (
            <FilaDeParticipante
              participante={item.participante}
              puedeRemover={puedeRemover}
              puedeValorar={puedeValorar}
              usuarioActualId={usuarioActualId}
            />
          ) : (
            <FilaDeInvitado nombre={item.nombre} invitadoPor={item.invitadoPor} />
          )
        }
        contentContainerStyle={estilos.contenido}
        ListHeaderComponent={
          <EncabezadoDelDetalle
            estado={estado}
            reintentar={reintentar}
            participantes={participantes}
            pestanaActiva={pestanaActiva}
            alElegirPestana={setPestanaActiva}
            alVerTodos={verTodosLosParticipantes}
            alUbicarPestanas={(y) => {
              posicionDePestanas.current = y;
            }}
          />
        }
        ListFooterComponent={
          actividad ? (
            <PieDelDetalle actividad={actividad} pestanaActiva={pestanaActiva} participantes={participantes} />
          ) : undefined
        }
      />

      {actividad ? <BarraDeAccionPrincipal actividad={actividad} /> : null}
      {actividad ? <MenuDeOpciones actividad={actividad} visible={menuAbierto} alCerrar={() => setMenuAbierto(false)} /> : null}
    </SafeAreaView>
  );
}

/** Volver, y a la derecha las acciones de un toque (Compartir, Silenciar) y "Más opciones" (⋯). */
function BarraSuperior({ actividad, alAbrirMenu }: { actividad: DetalleActividad | null; alAbrirMenu: () => void }) {
  const rapidas = actividad ? accionesOfrecidas(ACCIONES_RAPIDAS, actividad.opciones) : [];
  const hayMenu = actividad ? accionesOfrecidas(ACCIONES_DEL_MENU, actividad.opciones).length > 0 : false;
  return (
    <View style={estilos.barraSuperior}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        style={estilos.botonRedondo}
        hitSlop={8}
      >
        <Text style={estilos.textoBotonRedondo}>‹</Text>
      </Pressable>
      <View style={estilos.accionesRapidas}>
        {/* Pendiente: CU19 (compartir) y CU20 (silenciar) */}
        {rapidas.map((accion) => (
          <Pressable
            key={accion.opcion}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={[estilos.pastilla, estilos.deshabilitado]}
          >
            <Text style={estilos.textoPastilla}>{accion.etiqueta}</Text>
          </Pressable>
        ))}
        {hayMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más opciones"
            onPress={alAbrirMenu}
            style={estilos.botonRedondo}
            hitSlop={8}
          >
            <Text style={estilos.textoBotonRedondo}>⋯</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** La acción principal fija abajo: unirse, si no participa y hay lugar (CU09 FP paso 4). */
function BarraDeAccionPrincipal({ actividad }: { actividad: DetalleActividad }) {
  const principal = accionPrincipal(actividad.opciones);
  if (principal === null) {
    return null;
  }
  return (
    <SafeAreaView edges={['bottom']} style={estilos.barraInferior}>
      {/* Pendiente: CU11 – Unirse a una actividad */}
      <Boton texto={principal.etiqueta} alPresionar={() => {}} deshabilitado />
      {/* Que un botón apagado no parezca roto: se avisa a la vista */}
      <Text style={estilos.proximamente}>Disponible próximamente</Text>
    </SafeAreaView>
  );
}

interface PropsMenu {
  actividad: DetalleActividad;
  visible: boolean;
  alCerrar: () => void;
}

/** "Más opciones": acciones menos frecuentes; las que sacan al usuario o terminan la actividad, al final y en rojo. */
function MenuDeOpciones({ actividad, visible, alCerrar }: PropsMenu) {
  const acciones = accionesOfrecidas(ACCIONES_DEL_MENU, actividad.opciones);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={alCerrar}>
      <Pressable style={estilos.fondoMenu} onPress={alCerrar} accessibilityLabel="Cerrar menú">
        <View style={estilos.menu} accessibilityRole="menu">
          <Text style={[estilos.proximamente, estilos.encabezadoMenu]}>Disponibles próximamente</Text>
          {/* Pendiente: CU17, CU29, CU32, CU13 y CU12 */}
          {acciones.map((accion) => (
            <View
              key={accion.opcion}
              style={[estilos.itemMenu, estilos.deshabilitado]}
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: true }}
            >
              <Text style={[estilos.textoItemMenu, accion.esPeligrosa ? estilos.textoPeligro : null]}>{accion.etiqueta}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function useDetalle(actividadId: string) {
  const [estado, setEstado] = useState<EstadoPantalla>({ tipo: 'cargando' });
  /** Se incrementa al tocar "Reintentar" (CU09 ER1, RNF-10). */
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    // Si el usuario sale de la pantalla antes de que llegue la respuesta, se descarta
    let vigente = true;
    setEstado({ tipo: 'cargando' });

    obtenerDetalleDeActividad(actividadId)
      .then((actividad) => {
        if (vigente) setEstado({ tipo: 'listo', actividad });
      })
      .catch((error: unknown) => {
        if (vigente) setEstado(clasificarErrorDeActividad(error));
      });

    return () => {
      vigente = false;
    };
  }, [actividadId, intento]);

  return { estado, reintentar: () => setIntento((anterior) => anterior + 1) };
}

interface EstadoParticipantes {
  lista: ParticipanteDeActividad[];
  hayMas: boolean;
  cargando: boolean;
  hayFalla: boolean;
  verMas: () => void;
  reintentar: () => void;
}

/** CU09 A1: participantes de a 20; "Ver más" agrega la página siguiente. */
function useParticipantes(actividadId: string, habilitado: boolean): EstadoParticipantes {
  const [lista, setLista] = useState<ParticipanteDeActividad[]>([]);
  const [paginaCargada, setPaginaCargada] = useState(0);
  const [paginaPedida, setPaginaPedida] = useState(1);
  const [intento, setIntento] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [hayFalla, setHayFalla] = useState(false);

  useEffect(() => {
    if (!habilitado) {
      return;
    }
    let vigente = true;
    setCargando(true);
    setHayFalla(false);

    obtenerParticipantes(actividadId, paginaPedida)
      .then((pagina) => {
        if (!vigente) return;
        // La página 1 reemplaza la lista: si el efecto corre de nuevo (recarga en desarrollo) no se duplican filas
        setLista((anteriores) => (pagina.pagina === 1 ? pagina.participantes : [...anteriores, ...pagina.participantes]));
        setPaginaCargada(pagina.pagina);
        setHayMas(pagina.hayMas);
      })
      .catch(() => {
        if (vigente) setHayFalla(true); // CU09 ER1
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [actividadId, habilitado, paginaPedida, intento]);

  return {
    lista,
    hayMas,
    cargando,
    hayFalla,
    verMas: () => setPaginaPedida(paginaCargada + 1),
    // RNF-10: vuelve a pedir la página que falló; las ya cargadas no se piden de nuevo ni se duplican
    reintentar: () => setIntento((anterior) => anterior + 1),
  };
}

interface PropsEncabezado extends Omit<PropsDetalle, 'actividad'> {
  estado: EstadoPantalla;
  reintentar: () => void;
}

function EncabezadoDelDetalle({ estado, reintentar, ...props }: PropsEncabezado) {
  if (estado.tipo === 'cargando') {
    return <ActivityIndicator color={colores.primario} style={estilos.cargando} />;
  }
  if (estado.tipo === 'falla') {
    return <AvisoDeError mensaje={estado.mensaje} reintentar={reintentar} />; // CU09 ER1
  }
  if (estado.tipo === 'listo') {
    return <DetalleDeLaActividad actividad={estado.actividad} {...props} />;
  }
  return null;
}

interface PropsDetalle {
  actividad: DetalleActividad;
  participantes: EstadoParticipantes;
  pestanaActiva: PestanaDeActividad;
  alElegirPestana: (pestana: PestanaDeActividad) => void;
  alVerTodos: () => void;
  /** Posición vertical de las pestañas dentro de la lista, para que "Ver todos" baje hasta ellas. */
  alUbicarPestanas: (y: number) => void;
}

/** Orden: qué es, si me conviene (cuándo, lugares, costo, quién va), pronóstico, cómo llegar y las pestañas. */
function DetalleDeLaActividad(props: PropsDetalle) {
  const { actividad, participantes, alVerTodos, alUbicarPestanas } = props;
  const etiquetaRol = ETIQUETA_ROL[actividad.miRol];

  return (
    <View style={estilos.encabezado}>
      <View style={estilos.cabecera}>
        <View style={estilos.etiquetas}>
          <Text style={estilos.etiqueta}>{actividad.deporte.nombre}</Text>
          {/* CU09 RN4: estado de la actividad */}
          <Text style={[estilos.etiqueta, estiloDeEstado(actividad.estado)]}>{ETIQUETA_ESTADO[actividad.estado]}</Text>
          <Text style={[estilos.etiqueta, estilos.etiquetaNeutra]}>{ETIQUETA_NIVEL[actividad.nivel]}</Text>
          {/* CU09 FP paso 3: relación del usuario con la actividad */}
          {etiquetaRol ? <Text style={[estilos.etiqueta, estilos.etiquetaRol]}>✓ {etiquetaRol}</Text> : null}
        </View>
        <Text style={estilos.titulo}>{actividad.nombre}</Text>
        {/* Si el organizador es el propio usuario, ya lo dice la etiqueta "Sos el organizador" */}
        {actividad.miRol !== 'organizador' ? <Organizador organizador={actividad.organizador} /> : null}
        <AvisoDeEstado actividad={actividad} />
      </View>

      <Resumen actividad={actividad} />
      <QuienesVan actividad={actividad} participantes={participantes} alVerTodos={alVerTodos} />

      {actividad.descripcion ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.texto}>{actividad.descripcion}</Text>
        </View>
      ) : null}

      <Pronostico actividad={actividad} />

      {/* CU09 A2: salida, destino y mapa juntos */}
      {actividad.opciones.includes('verMapa') ? <MapaDelRecorrido origen={actividad.origen} destino={actividad.destino} /> : null}

      {/* Participantes (A1), Chat y Gastos; la lista de participantes sigue debajo de este encabezado */}
      <View onLayout={(evento) => alUbicarPestanas(evento.nativeEvent.layout.y)}>
        <BarraDePestanas {...props} />
      </View>
    </View>
  );
}

/** Lo que decide si me uno: cuándo, si hay lugar y cuánto sale el traslado. */
function Resumen({ actividad }: { actividad: DetalleActividad }) {
  const ocupado = proporcionOcupada(actividad.cuposOcupados, actividad.cupoMaximo);
  return (
    <View style={estilos.resumen}>
      {/* "Cuándo" ocupa todo el ancho: en una tarjeta angosta "domingo 15 de noviembre" se partía en cuatro renglones */}
      <View style={[estilos.tarjeta, estilos.datoResumen, estilos.datoCuando]}>
        <Text style={estilos.datoTitulo}>Cuándo</Text>
        <Text style={estilos.datoValor}>{conMayuscula(formatearFechaHora(actividad.fechaHoraInicio))}</Text>
      </View>
      {/* Glosario: solo una actividad Programada admite incorporaciones; después importa cuántos fueron, no cuántos lugares quedan */}
      {actividad.estado === 'programada' ? (
        <View style={[estilos.tarjeta, estilos.datoResumen]}>
          <Text style={estilos.datoTitulo}>Lugares</Text>
          <Text style={estilos.datoValor}>{formatearLugaresLibres(actividad.cuposOcupados, actividad.cupoMaximo)}</Text>
          <View
            style={estilos.cupo}
            accessibilityRole="progressbar"
            accessibilityLabel="Lugares ocupados"
            accessibilityValue={{ min: 0, max: actividad.cupoMaximo, now: actividad.cuposOcupados }}
          >
            <View style={[estilos.cupoRelleno, { width: `${ocupado * 100}%` }]} />
          </View>
          {/* Sin lugares el texto ya es "2 de 2": no se repite el total */}
          {hayLugaresLibres(actividad.cuposOcupados, actividad.cupoMaximo) ? (
            <Text style={estilos.datoTitulo}>de {actividad.cupoMaximo}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[estilos.tarjeta, estilos.datoResumen]}>
          <Text style={estilos.datoTitulo}>Participantes</Text>
          <Text style={estilos.datoValor}>{actividad.cuposOcupados}</Text>
          <View
            style={estilos.cupo}
            accessibilityRole="progressbar"
            accessibilityLabel="Lugares ocupados"
            accessibilityValue={{ min: 0, max: actividad.cupoMaximo, now: actividad.cuposOcupados }}
          >
            <View style={[estilos.cupoRelleno, { width: `${ocupado * 100}%` }]} />
          </View>
          <Text style={estilos.datoTitulo}>de {actividad.cupoMaximo}</Text>
        </View>
      )}
      {actividad.costoEstimadoCentesimos !== null ? (
        <View style={[estilos.tarjeta, estilos.datoResumen]}>
          <Text style={estilos.datoTitulo}>Traslado</Text>
          <Text style={estilos.datoValor}>{formatearMonto(actividad.costoEstimadoCentesimos)}</Text>
          <Text style={estilos.datoTitulo}>estimado</Text>
        </View>
      ) : null}
    </View>
  );
}

/** CU09 A1: quién va, con avatares, sin tener que bajar hasta las pestañas. */
function QuienesVan({ actividad, participantes, alVerTodos }: Pick<PropsDetalle, 'actividad' | 'participantes' | 'alVerTodos'>) {
  const conCuenta = participantes.lista.filter(({ usuario }) => usuario !== null).slice(0, 3);
  if (!actividad.opciones.includes('verParticipantes') || conCuenta.length === 0) {
    return null;
  }
  const sinMostrar = actividad.cuposOcupados - conCuenta.length;
  return (
    <View style={estilos.quienesVan}>
      <View style={estilos.avatares}>
        {conCuenta.map(({ usuario }, indice) =>
          usuario ? (
            <View key={usuario.id} style={[estilos.anilloAvatar, indice > 0 ? estilos.avatarSuperpuesto : null]}>
              <Avatar nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tamano={32} />
            </View>
          ) : null,
        )}
        {sinMostrar > 0 ? (
          <View style={[estilos.anilloAvatar, estilos.avatarSuperpuesto, estilos.avatarMas]}>
            <Text style={estilos.textoAvatarMas}>+{sinMostrar}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[estilos.textoSuave, estilos.textoQuienesVan]} numberOfLines={1}>
        {resumenDeQuienesVan(participantes.lista, actividad.cuposOcupados)}
      </Text>
      <Pressable accessibilityRole="button" onPress={alVerTodos} hitSlop={8}>
        <Text style={estilos.enlace}>Ver todos</Text>
      </Pressable>
    </View>
  );
}

function estiloDeEstado(estado: DetalleActividad['estado']) {
  if (estado === 'cancelada') return estilos.etiquetaCancelada;
  if (estado === 'iniciada') return estilos.etiquetaIniciada;
  return estilos.etiquetaVerde;
}

function Organizador({ organizador }: { organizador: DetalleActividad['organizador'] }) {
  if (organizador === null) {
    return <Text style={estilos.textoSuave}>Organiza: usuario eliminado</Text>;
  }
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/perfil/${organizador.id}`)}
      style={estilos.organizador}
      hitSlop={8}
    >
      <Avatar nombre={organizador.nombre} fotoUrl={organizador.fotoUrl} tamano={40} />
      <Text style={estilos.nombreOrganizador}>Organiza {organizador.nombre}</Text>
    </Pressable>
  );
}

/** CU09 E1 (cancelada), RN4 (iniciada: fecha límite de gastos) y RN5 (archivada: solo lectura). */
function AvisoDeEstado({ actividad }: { actividad: DetalleActividad }) {
  if (actividad.estado === 'cancelada') {
    return <Text style={[estilos.aviso, estilos.textoAviso]}>Esta actividad fue cancelada.</Text>;
  }
  if (actividad.estado === 'iniciada' && actividad.fechaLimiteGastos) {
    return (
      <Text style={estilos.avisoInfo}>
        La actividad ya comenzó. Se pueden registrar gastos y pagos hasta el {formatearFechaHora(actividad.fechaLimiteGastos)}.
      </Text>
    );
  }
  if (actividad.estado === 'archivada') {
    return <Text style={estilos.avisoInfo}>Esta actividad está archivada: se puede consultar en modo solo lectura.</Text>;
  }
  return null;
}

/**
 * CU09 FP paso 2: información ambiental disponible. Sin información queda en una línea, para no ocupar lugar con un
 * aviso vacío. Pendiente: CU15 – mostrar los datos ambientales detallados.
 */
function Pronostico({ actividad }: { actividad: DetalleActividad }) {
  const { pronostico } = actividad;
  if (pronostico === null) {
    return (
      <View style={[estilos.tarjeta, estilos.pronostico, estilos.pronosticoVacio]}>
        <Text style={estilos.textoPronosticoVacio}>
          <Text style={estilos.negrita}>Pronóstico:</Text> no disponible.
        </Text>
      </View>
    );
  }
  return (
    <View style={[estilos.tarjeta, estilos.pronostico]}>
      <Text style={estilos.subtituloPronostico}>Pronóstico para la actividad</Text>
      {pronostico.nivelRecomendado ? (
        <Text style={estilos.nivelRecomendado}>Apto para nivel {ETIQUETA_NIVEL[pronostico.nivelRecomendado].toLowerCase()}.</Text>
      ) : null}
      <Text style={estilos.texto}>{pronostico.resumen}</Text>
      <Text style={estilos.textoSuave}>Actualizado {formatearFechaHora(pronostico.fechaGeneracion)}</Text>
    </View>
  );
}

function BarraDePestanas({
  actividad,
  pestanaActiva,
  alElegirPestana,
}: Pick<PropsDetalle, 'actividad' | 'pestanaActiva' | 'alElegirPestana'>) {
  const pestanas = pestanasDisponibles(actividad.opciones);
  if (pestanas.length === 0) {
    return null;
  }
  // Una sola pestaña no se muestra como pestaña: queda como título de la sección
  if (pestanas.length === 1) {
    return (
      <Text style={estilos.tituloSeccionUnica} accessibilityRole="header">
        {tituloDePestana(pestanas[0].pestana, pestanas[0].etiqueta, actividad)}
      </Text>
    );
  }
  return (
    <View style={estilos.pestanas} accessibilityRole="tablist">
      {pestanas.map(({ pestana, etiqueta }) => {
        const activa = pestana === pestanaActiva;
        return (
          <Pressable
            key={pestana}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            onPress={() => alElegirPestana(pestana)}
            style={[estilos.pestana, activa ? estilos.pestanaActiva : null]}
          >
            <Text style={[estilos.textoPestana, activa ? estilos.textoPestanaActiva : null]}>
              {tituloDePestana(pestana, etiqueta, actividad)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Participantes muestra cuántos lugares están ocupados (incluye invitados externos, que tienen fila propia). */
function tituloDePestana(pestana: PestanaDeActividad, etiqueta: string, actividad: DetalleActividad): string {
  return pestana === 'participantes' ? `${etiqueta} (${actividad.cuposOcupados})` : etiqueta;
}

interface PropsPie {
  actividad: DetalleActividad;
  pestanaActiva: PestanaDeActividad;
  participantes: EstadoParticipantes;
}

/** Debajo de la lista: en "Participantes", la carga y "Ver más" (A1); en Chat y Gastos, su caso de uso pendiente. */
function PieDelDetalle({ actividad, pestanaActiva, participantes }: PropsPie) {
  const definicion = pestanasDisponibles(actividad.opciones).find(({ pestana }) => pestana === pestanaActiva);
  if (definicion === undefined) {
    return null;
  }
  // Pendiente: CU16 (chat grupal) y CU34 (gastos y balances)
  if (definicion.casoDeUsoPendiente !== null) {
    return <Text style={[estilos.textoSuave, estilos.pie]}>Disponible con el {definicion.casoDeUsoPendiente}.</Text>;
  }
  return (
    <View style={estilos.pie}>
      {participantes.cargando ? <ActivityIndicator color={colores.primario} style={estilos.cargando} /> : null}
      {participantes.hayFalla ? (
        <AvisoDeError mensaje={MENSAJE_FALLA_PARTICIPANTES} reintentar={participantes.reintentar} />
      ) : null}
      {participantes.hayMas && !participantes.cargando && !participantes.hayFalla ? (
        <Boton texto="Ver más" variante="secundario" alPresionar={participantes.verMas} />
      ) : null}
    </View>
  );
}

interface PropsFila {
  participante: ParticipanteDeActividad;
  puedeRemover: boolean;
  puedeValorar: boolean;
  usuarioActualId: string | null;
}

function FilaDeParticipante({ participante, puedeRemover, puedeValorar, usuarioActualId }: PropsFila) {
  const { usuario } = participante;
  const esElUsuarioActual = usuario !== null && usuario.id === usuarioActualId;
  // CU21: se valora a los demás participantes registrados, no a uno mismo ni a una cuenta cerrada
  const mostrarEstrellas = puedeValorar && usuario !== null && !esElUsuarioActual;
  return (
    <View style={estilos.fila}>
      <View style={estilos.persona}>
        {usuario ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/perfil/${usuario.id}`)}
            style={estilos.usuario}
            hitSlop={6}
          >
            <Avatar nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} tamano={40} />
            <View style={estilos.textoParticipante}>
              <Text style={estilos.nombreParticipante} numberOfLines={1}>
                {usuario.nombre}
                {esElUsuarioActual ? <Text style={estilos.vos}> (vos)</Text> : null}
              </Text>
              {participante.esOrganizador ? <Text style={estilos.rolParticipante}>Organizador</Text> : null}
            </View>
          </Pressable>
        ) : (
          <Text style={[estilos.textoSuave, estilos.usuario]}>Usuario eliminado</Text>
        )}
        {mostrarEstrellas ? <EstrellasDeValoracion nombre={usuario.nombre} /> : null}
      </View>
      {/* CU09 A1 paso 3. Pendiente: CU31 – Remover a un participante */}
      {puedeRemover && !participante.esOrganizador ? (
        <Boton texto="Remover" variante="secundario" alPresionar={() => {}} deshabilitado />
      ) : null}
    </View>
  );
}

/** CU09 A1: un invitado externo, con quién lo trae. No tiene perfil ni se valora (no es un usuario registrado). */
function FilaDeInvitado({ nombre, invitadoPor }: { nombre: string; invitadoPor: string | null }) {
  return (
    <View style={[estilos.fila, estilos.persona]}>
      <View style={estilos.avatarInvitado} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={estilos.textoAvatarInvitado}>+</Text>
      </View>
      <View style={estilos.textoParticipante}>
        <Text style={estilos.nombreParticipante} numberOfLines={1}>
          {nombre}
        </Text>
        <Text style={estilos.textoSuave}>{invitadoPor ? `Invitado por ${invitadoPor}` : 'Invitado externo'}</Text>
      </View>
    </View>
  );
}

function AvisoDeError({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
  return (
    <View style={[estilos.aviso, estilos.avisoConBoton]} accessibilityRole="alert">
      <Text style={estilos.textoAviso}>{mensaje}</Text>
      <Boton texto="Reintentar" variante="secundario" alPresionar={reintentar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonRedondo: { fontSize: 22, lineHeight: 26, color: colores.texto, fontWeight: '700' },
  accionesRapidas: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pastilla: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
    justifyContent: 'center',
  },
  textoPastilla: { fontFamily: fuentes.texto, fontWeight: '600', fontSize: 14, color: colores.texto },
  deshabilitado: { opacity: 0.6 },
  barraInferior: {
    backgroundColor: colores.blanco,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  fondoMenu: { flex: 1, backgroundColor: 'rgba(15, 37, 55, 0.35)', alignItems: 'flex-end', paddingTop: 110, paddingRight: 16 },
  menu: { width: 250, backgroundColor: colores.blanco, borderRadius: 16, padding: 8 },
  itemMenu: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  textoItemMenu: { fontFamily: fuentes.texto, fontWeight: '600', fontSize: 15, color: colores.texto },
  textoPeligro: { color: colores.error, fontWeight: '700' },
  contenido: { paddingHorizontal: 20, paddingBottom: 32 },
  cabecera: { gap: 12, paddingTop: 4 },
  etiquetaRol: { backgroundColor: colores.primario, color: colores.blanco, fontWeight: '700' },
  resumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  datoCuando: { flexBasis: '100%' },
  datoResumen: { flex: 1, padding: 12, gap: 4 },
  cupo: { height: 6, borderRadius: 3, backgroundColor: colores.primarioClaro, overflow: 'hidden' },
  cupoRelleno: { height: 6, backgroundColor: colores.primario },
  quienesVan: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatares: { flexDirection: 'row', alignItems: 'center' },
  anilloAvatar: { borderRadius: 18, borderWidth: 2, borderColor: colores.fondo },
  avatarSuperpuesto: { marginLeft: -8 },
  avatarMas: { width: 36, height: 36, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center' },
  textoAvatarMas: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 12, color: colores.textoSuave },
  textoQuienesVan: { flex: 1 },
  enlace: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 14, color: colores.primario },
  cargando: { marginVertical: 24 },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 12,
  },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  etiquetaVerde: { backgroundColor: '#E3EFE3', color: '#2D5A2D' },
  etiquetaIniciada: { backgroundColor: '#FDF0E3', color: '#9A4A0C' },
  etiquetaCancelada: { backgroundColor: colores.errorFondo, color: colores.error },
  etiquetaNeutra: { backgroundColor: colores.blanco, color: colores.texto, borderWidth: 1, borderColor: colores.borde },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 26, color: colores.texto },
  organizador: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nombreOrganizador: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  datoTitulo: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  datoValor: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  pronostico: { backgroundColor: colores.primarioClaro, borderColor: colores.primarioClaro, gap: 8 },
  subtituloPronostico: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 17, color: colores.primarioOscuro },
  nivelRecomendado: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: '#2D5A2D' },
  pestanas: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colores.borde, marginTop: 4 },
  pestana: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  pestanaActiva: { borderBottomColor: colores.primario },
  textoPestana: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.textoSuave },
  textoPestanaActiva: { color: colores.primario },
  encabezado: { gap: 12 },
  pie: { gap: 12, marginTop: 12 },
  fila: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colores.borde, gap: 8 },
  // Una sola línea por participante: avatar y nombre a la izquierda; estrellas a la derecha
  persona: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  usuario: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  textoParticipante: { flex: 1, minWidth: 0 },
  rolParticipante: { fontFamily: fuentes.texto, fontWeight: '600', fontSize: 13, color: colores.primarioOscuro },
  nombreParticipante: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 15, color: colores.texto },
  vos: { fontWeight: '400', color: colores.textoSuave },
  avatarInvitado: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAvatarInvitado: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 18, color: colores.textoSuave },
  proximamente: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave, textAlign: 'center', marginTop: 6 },
  encabezadoMenu: { marginTop: 4, marginBottom: 4 },
  pronosticoVacio: { paddingVertical: 14 },
  textoPronosticoVacio: { fontFamily: fuentes.texto, fontSize: 15, color: colores.primarioOscuro },
  negrita: { fontWeight: '700' },
  tituloSeccionUnica: {
    fontFamily: fuentes.texto,
    fontWeight: '700',
    fontSize: 15,
    color: colores.texto,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    marginTop: 4,
  },
  texto: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 22, color: colores.texto },
  textoSuave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  aviso: { backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14, overflow: 'hidden' },
  avisoConBoton: { gap: 12 },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
  avisoInfo: {
    backgroundColor: colores.primarioClaro,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
    fontFamily: fuentes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: colores.primarioOscuro,
  },
});

/** El día va al principio de la línea: "Sábado 14 de noviembre" (textTransform 'capitalize' pondría mayúscula en cada palabra). */
function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
