// Las dos casillas de recordatorio; vacía = "Ninguno" (RF-INI-06, RF-AJU-01, RF-AJU-04).
import { FRANJAS_RECORDATORIO, type FranjaRecordatorio, type Preferencias } from '../../domain/modelo';
import type { BorradorRecordatorios } from '../../domain/validacionPreferencias';
import { el } from '../dom';
import { campoEntrada, type CampoDeControl, type CampoFormulario } from '../formulario';

const ETIQUETA: Record<FranjaRecordatorio, string> = {
  principal: 'Primer recordatorio',
  secundario: 'Segundo recordatorio',
};

export interface CamposRecordatorios {
  contenedor: HTMLElement;
  campos: Record<FranjaRecordatorio, CampoFormulario>;
  leer(): BorradorRecordatorios;
}

function casillaDeHora(franja: FranjaRecordatorio, recordatorios: Preferencias['recordatorios']): CampoDeControl<HTMLInputElement> {
  const campo = campoEntrada(ETIQUETA[franja], { type: 'time', value: recordatorios[franja].hora ?? '' });
  const ninguno = el('span', { clase: 'campo__ninguno' }, 'Ninguno');
  const actualizar = () => {
    ninguno.hidden = campo.control.value !== '';
  };
  campo.control.addEventListener('input', actualizar);
  campo.contenedor.classList.add('campo--recordatorio');
  campo.contenedor.append(ninguno);
  actualizar();
  return campo;
}

export function camposRecordatorios(recordatorios: Preferencias['recordatorios']): CamposRecordatorios {
  const principal = casillaDeHora('principal', recordatorios);
  const secundario = casillaDeHora('secundario', recordatorios);
  return {
    contenedor: el(
      'div',
      { clase: 'recordatorios' },
      ...FRANJAS_RECORDATORIO.map((franja) => (franja === 'principal' ? principal : secundario).contenedor),
      el('p', { clase: 'texto-tenue' }, 'Deje una casilla vacía si no quiere ese recordatorio.'),
    ),
    campos: { principal, secundario },
    leer: () => ({ principal: principal.control.value, secundario: secundario.control.value }),
  };
}
