// Las dos casillas de recordatorio; vacía = "Ninguno" (RF-INI-06, RF-AJU-01, RF-AJU-04, RF-UI-07).
import { type FranjaRecordatorio, type Preferencias } from '../../domain/modelo';
import type { BorradorRecordatorios } from '../../domain/validacionPreferencias';
import { el } from '../dom';
import { campoHora, type CampoFormulario } from '../formulario';

export interface CamposRecordatorios {
  contenedor: HTMLElement;
  campos: Record<FranjaRecordatorio, CampoFormulario>;
  leer(): BorradorRecordatorios;
}

export function camposRecordatorios(recordatorios: Preferencias['recordatorios']): CamposRecordatorios {
  const principal = campoHora('Primer recordatorio', recordatorios.principal.hora ?? '', 'Ninguno');
  const secundario = campoHora('Segundo recordatorio', recordatorios.secundario.hora ?? '', 'Ninguno');
  return {
    contenedor: el(
      'div',
      { clase: 'recordatorios' },
      principal.contenedor,
      secundario.contenedor,
      el('p', { clase: 'texto-tenue' }, 'Elija "Ninguno" si no quiere ese recordatorio.'),
    ),
    campos: { principal, secundario },
    leer: () => ({ principal: principal.leer(), secundario: secundario.leer() }),
  };
}
