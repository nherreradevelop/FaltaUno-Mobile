import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Balance, PersonaGasto } from '../api/gastos';
import type { DatosPago, Pago } from '../api/pagos';
import { leerMontoGasto, nombrePersona } from '../comun/gastos';
import { maximoParaPago, montoEditablePago, validarMontoPago } from '../comun/pagos';
import { formatearMonto } from '../comun/formato';
import { colores, fuentes } from '../comun/tema';
import { Campo } from './Campo';
import { Boton } from './Boton';

interface Props {
  pago: Pago | null;
  balance: Balance | null;
  personas: PersonaGasto[];
  inicial?: DatosPago | null;
  bloqueado: boolean;
  puedeGuardar: boolean;
  campos: Record<string, string>;
  children: ReactNode;
  alGuardar: (datos: DatosPago) => void;
  alCancelar: () => void;
}
/** CU26: formulario corto, importe sugerido y teclado que no tapa la confirmación. */
export function FormularioPago({
  pago,
  balance,
  personas,
  inicial,
  bloqueado,
  puedeGuardar,
  campos,
  children,
  alGuardar,
  alCancelar,
}: Props) {
  const maximo = maximoParaPago(pago, balance);
  const [monto, setMonto] = useState(() => montoEditablePago(inicial?.montoCentesimos ?? pago?.montoCentesimos ?? maximo));
  const [enviado, setEnviado] = useState(false);
  const centesimos = leerMontoGasto(monto);
  const error = campos.montoCentesimos ?? (enviado ? validarMontoPago(centesimos, maximo) : null);
  const pagador = pago?.pagadorId ?? balance?.deudorId ?? inicial?.pagadorId ?? '';
  const receptor = pago?.receptorId ?? balance?.acreedorId ?? inicial?.receptorId ?? '';
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!bloqueado) alCancelar();
      }}
    >
      <SafeAreaView style={s.pantalla}>
        <KeyboardAvoidingView style={s.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
            <Text style={s.titulo} accessibilityRole="header">
              {pago ? 'Editar pago' : 'Registrar pago'}
            </Text>
            <Text style={s.texto}>
              {nombrePersona(personas, `p:${pagador}`)} pagó a {nombrePersona(personas, `p:${receptor}`)}
            </Text>
            <Text style={s.texto}>Máximo permitido: {formatearMonto(maximo)}. Podés registrar un pago total o parcial.</Text>
            {children}
            <Campo
              etiqueta="Monto pagado ($)"
              keyboardType="decimal-pad"
              value={monto}
              onChangeText={setMonto}
              editable={!bloqueado}
              error={error ?? undefined}
            />
            <Boton
              texto={pago ? 'Guardar cambios' : 'Registrar pago'}
              deshabilitado={bloqueado || !puedeGuardar}
              alPresionar={() => {
                setEnviado(true);
                if (!validarMontoPago(centesimos, maximo))
                  alGuardar({ montoCentesimos: centesimos!, pagadorId: pagador, receptorId: receptor });
              }}
            />
            <Boton texto="Cancelar" variante="secundario" deshabilitado={bloqueado} alPresionar={alCancelar} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 18 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 26, color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
});
