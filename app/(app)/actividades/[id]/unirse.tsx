import { useLocalSearchParams } from 'expo-router';
import { FormularioUnirse } from '../../../../src/componentes/FormularioUnirse';

/**
 * M – CU11 Unirse a una actividad. Se abre desde la acción principal del detalle (CU09), que pasa los datos que
 * el formulario necesita para no volver a pedir la actividad. Los cupos los verifica de nuevo la API al enviar.
 * Pendiente: CU18 – al aceptar una invitación también se llega acá (CU11 paso 4).
 */
export default function PantallaUnirse() {
  const { id, nombre, cuposLibres, destinoLat, destinoLng } = useLocalSearchParams<{
    id: string;
    nombre: string;
    cuposLibres: string;
    destinoLat: string;
    destinoLng: string;
  }>();
  const actividad = {
    id,
    nombre,
    cuposLibres: Number(cuposLibres),
    destino: { lat: Number(destinoLat), lng: Number(destinoLng) },
  };
  return <FormularioUnirse actividad={actividad} />;
}
