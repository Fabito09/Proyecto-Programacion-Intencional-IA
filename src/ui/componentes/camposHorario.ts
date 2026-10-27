// Días laborales + entrada y salida (RF-INI-01, RF-AJU-01). Se usa en la bienvenida y en Ajustes.
import { DIAS_SEMANA, type HorarioTrabajo } from '../../domain/modelo';
import type { BorradorHorario, CampoHorario } from '../../domain/validacionPreferencias';
import { el } from '../dom';
import { campoHora, grupoDeCampos, type CampoFormulario } from '../formulario';
import { DIA_CORTO } from '../textos';

export interface CamposHorario {
  contenedor: HTMLElement;
  campos: Record<CampoHorario, CampoFormulario>;
  leer(): BorradorHorario;
}

export function camposHorario(leyenda: string, inicial: HorarioTrabajo | null): CamposHorario {
  const casillas = DIAS_SEMANA.map((dia) =>
    el(
      'label',
      { clase: 'chip' },
      el('input', { atributos: { type: 'checkbox', value: dia, checked: inicial?.diasLaborales.includes(dia) ?? false } }),
      DIA_CORTO[dia],
    ),
  );
  const dias = grupoDeCampos('Días de trabajo', casillas, 'grupo--chips');
  const entrada = campoHora('Hora de entrada', inicial?.entrada ?? '');
  const salida = campoHora('Hora de salida', inicial?.salida ?? '');

  const contenedor = el(
    'fieldset',
    { clase: 'seccion-formulario' },
    el('legend', { clase: 'seccion-formulario__titulo' }, leyenda),
    dias.contenedor,
    el('div', { clase: 'fila-campos' }, entrada.contenedor, salida.contenedor),
  );

  return {
    contenedor,
    campos: { dias, entrada, salida },
    leer: () => ({
      dias: Array.from(dias.contenedor.querySelectorAll<HTMLInputElement>('input:checked'), (casilla) => casilla.value),
      entrada: entrada.leer(),
      salida: salida.leer(),
    }),
  };
}
