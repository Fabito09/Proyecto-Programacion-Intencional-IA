// Qué días y qué franja horaria muestra cada vista (RF-CAL-03, RF-CAL-04, RF-CAL-05).
import type { FechaISO, VistaCalendario } from '../../domain/modelo';
import { diasDeLaSemana, fechaLocal, MINUTOS_POR_DIA, minutosDelDia } from '../../domain/tiempo';

export interface Periodo {
  dias: FechaISO[];
  /** Minutos desde la medianoche donde empieza la cuadrícula. */
  desde: number;
  hasta: number;
  minutosPorFila: number;
  altoFila: number;
}

const CUARTO_DE_HORA = 15;
const VENTANA_PROXIMAS_HORAS = 3 * 60;

export function periodoDe(vista: VistaCalendario, fechaReferencia: FechaISO, ahora: Date): Periodo {
  switch (vista) {
    case 'horas': {
      // RF-CAL-03: desde la hora actual redondeada al cuarto de hora, 3 horas, filas de 15 min.
      const desde = Math.floor(minutosDelDia(ahora) / CUARTO_DE_HORA) * CUARTO_DE_HORA;
      return {
        dias: [fechaLocal(ahora)],
        desde,
        hasta: Math.min(desde + VENTANA_PROXIMAS_HORAS, MINUTOS_POR_DIA),
        minutosPorFila: CUARTO_DE_HORA,
        altoFila: 40,
      };
    }
    case 'dia':
      return { dias: [fechaReferencia], desde: 0, hasta: MINUTOS_POR_DIA, minutosPorFila: 60, altoFila: 64 };
    case 'semana':
      return { dias: diasDeLaSemana(fechaReferencia), desde: 0, hasta: MINUTOS_POR_DIA, minutosPorFila: 60, altoFila: 52 };
  }
}

/** Posición vertical en píxeles de un minuto del día dentro del período. */
export function posicionEnPeriodo(periodo: Periodo, minutos: number): number {
  return ((minutos - periodo.desde) / periodo.minutosPorFila) * periodo.altoFila;
}
