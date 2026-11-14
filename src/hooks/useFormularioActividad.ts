import { useState } from 'react';
import type { DatosCrearActividad, LugarActividad } from '../api/actividades';
import { datosDelFormulario, ErrorFormulario, formularioInicial, type FormularioActividad } from '../comun/formularioActividad';

type CampoActividad = keyof FormularioActividad | `invitados.${number}`;

/** Relaciona errores del contrato HTTP con los campos que permiten corregirlos. */
function camposRelacionados(error: string): string[] {
  switch (error) {
    case 'fechaHoraInicio':
      return ['fecha', 'hora'];
    case 'origenCoordenadas':
    case 'origenPlaceId':
      return ['origen', 'tieneVehiculo'];
    case 'destinoCoordenadas':
    case 'destinoPlaceId':
      return ['destino'];
    case 'costoEstimadoCentavos':
      return ['costo'];
    case 'lugaresVehiculo':
      return ['lugaresVehiculo', 'tieneVehiculo'];
    case 'invitados':
      return ['invitados', 'cupoMaximo'];
    default:
      return error.startsWith('invitados.') ? [error, 'invitados'] : [error];
  }
}

/** CU10: valores, campos visitados y validación local; la API conserva las reglas definitivas del alta. */
export function useFormularioActividad(maximoParticipantes: number | undefined, destinoPorDefecto?: LugarActividad) {
  const [estado, setEstado] = useState(() => ({
    formulario: formularioInicial(),
    visitados: {} as Partial<Record<CampoActividad, boolean>>,
    validarTodos: false,
    erroresServidor: {} as Record<string, string>,
  }));
  const formulario = destinoPorDefecto ? { ...estado.formulario, destino: destinoPorDefecto } : estado.formulario;
  let erroresLocales: Record<string, string> = {};
  if (maximoParticipantes !== undefined) {
    try {
      datosDelFormulario(formulario, maximoParticipantes);
    } catch (error) {
      if (!(error instanceof ErrorFormulario)) throw error;
      erroresLocales = error.campos;
    }
  }
  const campos = { ...estado.erroresServidor };
  for (const [campo, mensaje] of Object.entries(erroresLocales)) {
    if (estado.validarTodos || camposRelacionados(campo).some((relacionado) => estado.visitados[relacionado as CampoActividad])) {
      campos[campo] = mensaje;
    }
  }

  function cambiar<K extends keyof FormularioActividad>(campo: K, valor: FormularioActividad[K]) {
    setEstado((actual) => ({
      ...actual,
      visitados: campo === 'tieneVehiculo' ? { ...actual.visitados, tieneVehiculo: true } : actual.visitados,
      formulario: {
        ...actual.formulario,
        [campo]: valor,
        ...(campo === 'tieneVehiculo' ? { lugaresVehiculo: '' } : {}),
      },
      erroresServidor: Object.fromEntries(
        Object.entries(actual.erroresServidor).filter(([error]) => !camposRelacionados(error).includes(campo)),
      ),
    }));
  }

  function visitar(campo: CampoActividad) {
    setEstado((actual) => ({ ...actual, visitados: { ...actual.visitados, [campo]: true } }));
  }

  /** Revalida con el instante actual al enviar, incluso si la fecha fue válida al salir del campo. */
  function validar(): DatosCrearActividad {
    setEstado((actual) => ({ ...actual, validarTodos: true, erroresServidor: {} }));
    if (maximoParticipantes === undefined) throw new Error('Esperá a que se carguen las opciones de la actividad.');
    return datosDelFormulario(formulario, maximoParticipantes);
  }

  function registrarErrores(erroresServidor: Record<string, string>) {
    setEstado((actual) => ({ ...actual, erroresServidor }));
  }

  return { formulario, campos, cambiar, visitar, validar, registrarErrores };
}
