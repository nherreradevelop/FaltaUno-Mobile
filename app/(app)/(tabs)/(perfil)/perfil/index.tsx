import { PantallaPerfil } from '../../../../../src/componentes/PantallaPerfil';

/** M – CU04 FP: "Mi perfil". Es la pantalla principal de la sección Perfil de la barra (CU39), sin "Volver". */
export default function PantallaMiPerfil() {
  return <PantallaPerfil mostrarVolver={false} />;
}
