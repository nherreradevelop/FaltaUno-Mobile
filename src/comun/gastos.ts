import type { DatosGasto, Gasto, ParteGasto, PersonaGasto } from '../api/gastos';

export interface FormularioGasto {
  concepto: string;
  monto: string;
  pagadorId: string;
  participantes: string[];
}

/** Formato local, sin convertir el texto monetario a punto flotante. */
export function leerMontoGasto(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,10}([,.]\d{1,2})?$/.test(limpio)) return null;
  const [entero, decimales = ''] = limpio.split(/[,.]/);
  const monto = Number(entero) * 100 + Number(decimales.padEnd(2, '0'));
  return monto > 0 && monto <= 999_999_999_999 ? monto : null;
}

export function formularioDeGasto(gasto: Gasto | null): FormularioGasto {
  return gasto
    ? {
        concepto: gasto.concepto,
        monto: `${Math.trunc(gasto.montoCentesimos / 100)},${String(gasto.montoCentesimos % 100).padStart(2, '0')}`,
        pagadorId: gasto.pagadorId,
        participantes: gasto.partes.map((p) => p.personaId),
      }
    : { concepto: '', monto: '', pagadorId: '', participantes: [] };
}

export function validarFormularioGasto(formulario: FormularioGasto): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!formulario.concepto.trim() || formulario.concepto.trim().length > 150)
    errores.concepto = 'Ingresá un concepto de hasta 150 caracteres.';
  if (leerMontoGasto(formulario.monto) === null)
    errores.montoCentesimos = 'Ingresá un monto mayor que cero, con hasta dos decimales.';
  if (!formulario.pagadorId) errores.pagadorId = 'Indicá quién realizó el pago.';
  if (!formulario.participantes.length) errores.participantes = 'Seleccioná al menos un participante.';
  return errores;
}

export function datosDelFormulario(formulario: FormularioGasto): DatosGasto {
  return {
    concepto: formulario.concepto.trim(),
    montoCentesimos: leerMontoGasto(formulario.monto)!,
    pagadorId: formulario.pagadorId,
    participantes: [...formulario.participantes],
  };
}

/** Previsualización de D1. La API vuelve a calcular las partes antes de guardarlas. */
export function previsualizarReparto(monto: number | null, participantes: string[], personas: PersonaGasto[]): ParteGasto[] {
  if (!monto || !participantes.length) return [];
  return [...participantes].sort().map((id, indice) => ({
    personaId: id,
    participacionId: personas.find((p) => p.id === id)?.participacionId ?? '',
    montoCentesimos: Math.floor(monto / participantes.length) + (indice < monto % participantes.length ? 1 : 0),
  }));
}

export function nombrePersona(personas: PersonaGasto[], id: string): string {
  const persona = personas.find((p) => p.id === id);
  if (!persona) return 'Participante';
  return persona.invitadoId ? `${persona.nombre} (invitado de ${persona.responsable})` : persona.nombre;
}
