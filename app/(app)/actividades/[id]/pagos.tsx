import { useLocalSearchParams } from 'expo-router';
import { PagosDeActividad } from '../../../../src/componentes/PagosDeActividad';

/** CU26: la pantalla delega el estado y la presentación al módulo de pagos. */
export default function PagosActividad() {
  const { id, deudorId, acreedorId } = useLocalSearchParams<{ id: string; deudorId?: string; acreedorId?: string }>();
  return <PagosDeActividad actividadId={id} deudorId={deudorId} acreedorId={acreedorId} />;
}
