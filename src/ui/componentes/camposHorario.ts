// Días laborales + entrada y salida (RF-INI-01, RF-AJU-01). Se usa en la bienvenida y en Ajustes.
import { DIAS_SEMANA, type HorarioTrabajo } from '../../domain/modelo';
import type { BorradorHorario, CampoHorario } from '../../domain/validacionPreferencias';
import { el } from '../dom';
import { campoEntrada, grupoDeCampos, type CampoFormulario } from '../formulario';
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
  const entrada = campoEntrada('Hora de entrada', { type: 'time', value: inicial?.entrada ?? '' });
  const salida = campoEntrada('Hora de salida', { type: 'time', value: inicial?.salida ?? '' });

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
      entrada: entrada.control.value,
      salida: salida.control.value,
    }),
  };
}
