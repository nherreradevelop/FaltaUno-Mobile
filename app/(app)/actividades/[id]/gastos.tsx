import { useLocalSearchParams } from 'expo-router';
import { GastosDeActividad } from '../../../../src/componentes/GastosDeActividad';

/** CU23–CU25: entrada independiente desde la sección debajo del mapa. */
export default function GastosActividad() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GastosDeActividad key={id} actividadId={id} />;
}
