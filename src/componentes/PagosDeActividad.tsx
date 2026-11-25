import { obtenerPago } from '../api/pagos';
import { ErrorApi } from '../api/cliente';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Balance } from '../api/gastos';
import type { Pago } from '../api/pagos';
import { nombrePersona } from '../comun/gastos';
import { formatearMonto, formatearFechaHora } from '../comun/formato';
import { colores, fuentes, sombraSuave } from '../comun/tema';
import { usePagos } from '../hooks/usePagos';
import { Boton } from './Boton';
import { TituloConVolver } from './TituloConVolver';
import { FormularioPago } from './FormularioPago';

type Fila = { tipo: 'deuda'; balance: Balance } | { tipo: 'pago'; pago: Pago } | { tipo: 'tituloPagos' };
/** CU26: lista propia virtualizada; solo las dos partes consultan cada pago. */
export function PagosDeActividad({
  actividadId,
  deudorId,
  acreedorId,
}: {
  actividadId: string;
  deudorId?: string;
  acreedorId?: string;
}) {
  const modelo = usePagos(actividadId);
  const [pago, setPago] = useState<Pago | null>(modelo.pendiente?.pago ?? null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [formulario, setFormulario] = useState(!!modelo.pendiente && modelo.pendiente.accion !== 'eliminar');
  const [confirmar, setConfirmar] = useState(false);
  const [inicialAbierto, setInicialAbierto] = useState(false);
  const [avisoInicial, setAvisoInicial] = useState('');
  const bloqueado = modelo.ocupado || !!modelo.pendiente;
  const detalleId = pago?.id;
  useEffect(() => {
    // La lectura sigue los cambios; un borrador o una confirmación conserva su versión para revisar conflictos.
    if (!detalleId || formulario || confirmar || modelo.pendiente || modelo.ocupado) return;
    let vigente = true;
    obtenerPago(actividadId, detalleId)
      .then((actual) => {
        if (vigente) setPago(actual);
      })
      .catch((error: unknown) => {
        if (vigente && error instanceof ErrorApi && [404, 410].includes(error.estado)) setPago(null);
      });
    return () => {
      vigente = false;
    };
  }, [actividadId, detalleId, formulario, confirmar, modelo.pendiente, modelo.ocupado, modelo.pagos]);

  const personas = modelo.opciones?.personas ?? [];
  const puedeEditar = !!pago && modelo.opciones?.puedeEscribir && pago.registradoPorId === modelo.opciones.participacionActualId;
  useEffect(() => {
    if (!modelo.opciones || inicialAbierto) return;
    const pagador = modelo.pendiente?.datos?.pagadorId ?? deudorId;
    const receptor = modelo.pendiente?.datos?.receptorId ?? acreedorId;
    if (pagador && receptor) {
      const deuda = modelo.opciones.deudas.find((b) => b.deudorId === pagador && b.acreedorId === receptor);
      if (deuda && modelo.opciones.puedeEscribir) {
        setBalance(deuda);
        setFormulario(true);
      } else if (!modelo.pendiente)
        setAvisoInicial(
          deuda
            ? (modelo.opciones.motivo ?? 'La actividad ya no admite pagos.')
            : 'No existe una deuda pendiente para registrar.',
        );
    }
    setInicialAbierto(true);
  }, [modelo.opciones, modelo.pendiente, inicialAbierto, deudorId, acreedorId]);
  function terminar(ok: boolean) {
    if (ok) {
      setFormulario(false);
      setPago(null);
      setBalance(null);
    }
  }
  async function revisar(id: string) {
    const actual = await modelo.revisar(id);
    setPago(actual);
    if (!actual) setFormulario(false);
  }
  const estado = (
    <View style={s.acciones}>
      {!!modelo.aviso && (
        <Text accessibilityLiveRegion="polite" style={s.aviso}>
          {modelo.aviso}
        </Text>
      )}
      {!!modelo.error && (
        <Text accessibilityRole="alert" style={s.error}>
          {modelo.error}
        </Text>
      )}
      {!!modelo.opciones?.motivo && <Text style={s.advertencia}>{modelo.opciones.motivo}</Text>}
      {modelo.pendiente && (
        <>
          <Text style={s.texto}>Operación pendiente de verificación.</Text>
          <Boton
            texto="Verificar resultado"
            variante="secundario"
            deshabilitado={modelo.ocupado}
            alPresionar={() => void modelo.verificar().then(terminar)}
          />
          {modelo.puedeReintentar && (
            <Boton
              texto="Reenviar mismo intento"
              variante="secundario"
              deshabilitado={modelo.ocupado}
              alPresionar={() => void modelo.reintentar().then(terminar)}
            />
          )}
        </>
      )}
      {['PAGO_MODIFICADO', 'MONTO_PAGO_INVALIDO'].includes(modelo.codigo) && pago && (
        <>
          <Text style={s.texto}>Revisá la versión actual antes de confirmar nuevamente.</Text>
          <Boton
            texto="Cargar versión actual"
            variante="secundario"
            deshabilitado={bloqueado}
            alPresionar={() => void revisar(pago.id)}
          />
        </>
      )}
    </View>
  );
  const filas: Fila[] = pago
    ? []
    : [
        ...(modelo.opciones?.deudas ?? []).map((b): Fila => ({ tipo: 'deuda', balance: b })),
        { tipo: 'tituloPagos' },
        ...modelo.pagos.map((p): Fila => ({ tipo: 'pago', pago: p })),
      ];
  return (
    <SafeAreaView style={s.pantalla}>
      <FlatList
        data={filas}
        contentContainerStyle={s.contenido}
        keyExtractor={(f) =>
          f.tipo === 'tituloPagos' ? 'titulo' : f.tipo === 'pago' ? f.pago.id : `${f.balance.deudorId}:${f.balance.acreedorId}`
        }
        ListHeaderComponent={
          <View style={s.acciones}>
            <View style={s.presentacion}>
              <TituloConVolver
                titulo={pago ? 'Detalle del pago' : 'Pagos y balances'}
                etiqueta={pago ? 'Volver a pagos' : 'Volver a gastos'}
                deshabilitado={bloqueado}
                alVolver={() => {
                  if (pago) setPago(null);
                  else router.back();
                }}
              />
            </View>
            {estado}
            {!!avisoInicial && <Text style={s.advertencia}>{avisoInicial}</Text>}
            {modelo.cargando && <Text style={s.texto}>Cargando pagos…</Text>}
            {!modelo.pendiente && (
              <Boton
                tono="balances"
                texto="Actualizar pagos y balances"
                variante="secundario"
                deshabilitado={bloqueado}
                alPresionar={() => void modelo.recargar()}
              />
            )}
            {pago && (
              <>
                <Text style={s.texto}>
                  {nombrePersona(personas, `p:${pago.pagadorId}`)} pagó a {nombrePersona(personas, `p:${pago.receptorId}`)}
                </Text>
                <Text style={s.monto}>{formatearMonto(pago.montoCentesimos)}</Text>
                <Text style={s.suave}>{formatearFechaHora(pago.fechaRegistro)}</Text>
                {puedeEditar && (
                  <>
                    <Boton
                      texto="Editar pago"
                      variante="secundario"
                      deshabilitado={bloqueado}
                      alPresionar={() => setFormulario(true)}
                    />
                    <Boton
                      texto="Eliminar pago"
                      variante="peligro"
                      deshabilitado={bloqueado}
                      alPresionar={() => setConfirmar(true)}
                    />
                  </>
                )}
              </>
            )}
            {!pago && <Text style={[s.subtitulo, s.tituloDeudas]}>Mis deudas pendientes</Text>}
            {!pago && !modelo.cargando && !modelo.opciones?.deudas.length && (
              <Text style={s.suave}>No hay deudas pendientes.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.tipo === 'tituloPagos')
            return (
              <View style={s.acciones}>
                <Text style={s.subtitulo}>Mis pagos</Text>
                <Text style={s.suave}>
                  Solo vos y la otra parte pueden consultar cada pago. El historial se conserva seis meses desde el archivo de la
                  actividad.
                </Text>
                {modelo.opciones?.historialVencido && (
                  <Text style={s.advertencia}>Venció el plazo de conservación del historial de pagos.</Text>
                )}
                {!!modelo.opciones?.historialHasta && !modelo.opciones.historialVencido && (
                  <Text style={s.suave}>Disponible hasta {formatearFechaHora(modelo.opciones.historialHasta)}.</Text>
                )}
                {!modelo.cargando && !modelo.pagos.length && !modelo.opciones?.historialVencido && (
                  <Text style={s.suave}>Todavía no tenés pagos registrados.</Text>
                )}
              </View>
            );
          if (item.tipo === 'deuda')
            return (
              <View style={[s.tarjeta, s.tarjetaDeuda]}>
                <Text style={s.texto}>
                  {nombrePersona(personas, `p:${item.balance.deudorId}`)} debe a{' '}
                  {nombrePersona(personas, `p:${item.balance.acreedorId}`)}
                </Text>
                <Text style={s.monto}>{formatearMonto(item.balance.montoCentesimos)}</Text>
                {modelo.opciones?.puedeEscribir && (
                  <Boton
                    tono="balances"
                    texto="Registrar pago"
                    variante="secundario"
                    deshabilitado={bloqueado}
                    alPresionar={() => {
                      setBalance(item.balance);
                      setPago(null);
                      setFormulario(true);
                    }}
                  />
                )}
              </View>
            );
          const p = item.pago;
          return (
            <Pressable accessibilityRole="button" disabled={bloqueado} style={s.tarjeta} onPress={() => void revisar(p.id)}>
              <Text style={s.texto}>
                {nombrePersona(personas, `p:${p.pagadorId}`)} pagó a {nombrePersona(personas, `p:${p.receptorId}`)}
              </Text>
              <Text style={s.monto}>{formatearMonto(p.montoCentesimos)}</Text>
              <Text style={s.suave}>{formatearFechaHora(p.fechaRegistro)}</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          modelo.hayMas && !pago ? (
            <Boton
              texto="Ver más pagos"
              variante="secundario"
              deshabilitado={bloqueado}
              alPresionar={() => void modelo.verMas()}
            />
          ) : undefined
        }
      />
      {formulario && (
        <FormularioPago
          key={`${pago?.id ?? `${balance?.deudorId}:${balance?.acreedorId}`}:${pago?.version ?? 0}`}
          pago={pago}
          balance={
            balance
              ? (modelo.opciones?.deudas.find((b) => b.deudorId === balance.deudorId && b.acreedorId === balance.acreedorId) ?? {
                  ...balance,
                  montoCentesimos: 0,
                })
              : null
          }
          personas={personas}
          inicial={modelo.pendiente?.datos}
          campos={modelo.campos}
          bloqueado={bloqueado}
          puedeGuardar={!!modelo.opciones?.puedeEscribir}
          alCancelar={() => setFormulario(false)}
          alGuardar={(datos) => void modelo.enviar(pago ? 'editar' : 'registrar', datos, pago).then(terminar)}
        >
          {estado}
        </FormularioPago>
      )}
      <Modal transparent visible={confirmar && !bloqueado} animationType="fade" onRequestClose={() => setConfirmar(false)}>
        <View style={s.velo}>
          <View style={s.dialogo} accessibilityViewIsModal>
            <Text style={s.subtitulo}>Eliminar pago</Text>
            <Text style={s.texto}>
              ¿Eliminar el pago de {nombrePersona(personas, `p:${pago?.pagadorId}`)} a{' '}
              {nombrePersona(personas, `p:${pago?.receptorId}`)} por {formatearMonto(pago?.montoCentesimos ?? 0)}? Esto
              actualizará los balances.
            </Text>
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setConfirmar(false)} />
            <Boton
              texto="Eliminar pago"
              variante="peligro"
              alPresionar={() => {
                setConfirmar(false);
                if (pago) void modelo.enviar('eliminar', null, pago).then(terminar);
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  advertencia: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colores.acento,
    fontFamily: fuentes.texto,
    color: colores.advertencia,
    backgroundColor: colores.advertenciaSuave,
  },
  presentacion: {
    padding: 18,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: colores.borde,
    borderTopColor: colores.balancesPrimario,
    borderRadius: 18,
    backgroundColor: colores.balancesSuave,
  },
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 14 },
  acciones: { gap: 14, paddingVertical: 10 },
  subtitulo: {
    fontFamily: fuentes.texto,
    fontWeight: '700',
    fontSize: 18,
    color: colores.balancesPrimario,
    borderLeftWidth: 4,
    borderLeftColor: colores.balancesPrimario,
    paddingLeft: 10,
  },
  tituloDeudas: { color: colores.advertencia, borderLeftColor: colores.acento },
  tarjetaDeuda: { borderLeftColor: colores.acento },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  suave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  monto: { fontFamily: fuentes.texto, fontWeight: '700', fontSize: 21, color: colores.texto },
  tarjeta: {
    ...sombraSuave,
    borderLeftWidth: 3,
    borderLeftColor: colores.balancesPrimario,
    padding: 18,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  aviso: {
    padding: 14,
    fontFamily: fuentes.texto,
    color: colores.primarioOscuro,
    backgroundColor: colores.primarioClaro,
    borderRadius: 12,
  },
  error: {
    padding: 14,
    fontFamily: fuentes.texto,
    color: colores.advertencia,
    backgroundColor: colores.advertenciaSuave,
    borderRadius: 12,
  },
  velo: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.velo },
  dialogo: { padding: 22, gap: 16, borderRadius: 20, backgroundColor: colores.superficie },
});
