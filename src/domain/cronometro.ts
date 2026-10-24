// Cronómetro por tarea (RF-CRO, RN-10, RN-11).
// El tiempo se calcula desde cronometroIniciadoEn, no desde un contador en memoria (RF-CRO-05).
import type { HorarioTrabajo, Id, Tarea } from './modelo';
import { esDiaLaboral } from './horario';
import { estaAbierta } from './tareas';
import { fechaLocal, horaAMinutos, instanteLocal, MINUTOS_POR_DIA, minutosDelDia } from './tiempo';

export function cronometroCorriendo(tarea: Tarea): boolean {
  return tarea.cronometroIniciadoEn !== null;
}

/** Glosario "Tiempo medido": tramos cerrados más el tramo en curso. */
export function segundosMedidos(tarea: Tarea, ahora: Date): number {
  if (tarea.cronometroIniciadoEn === null) return tarea.segundosMedidos;
  const tramo = Math.floor((ahora.getTime() - Date.parse(tarea.cronometroIniciadoEn)) / 1000);
  return tarea.segundosMedidos + Math.max(0, tramo);
}

/** RF-CRO-03: suma el tramo en curso hasta un instante y detiene el cronómetro. */
export function pausarCronometro(tarea: Tarea, hasta: Date): Tarea {
  if (!cronometroCorriendo(tarea)) return tarea;
  return {
    ...tarea,
    segundosMedidos: segundosMedidos(tarea, hasta),
    cronometroIniciadoEn: null,
    actualizadaEn: hasta.toISOString(),
  };
}

export interface ResultadoInicio {
  tareas: Tarea[];
  /** La tarea que se pausó para respetar RN-10, si había una. */
  pausada: Tarea | null;
}

/** RF-CRO-02 + RN-10: inicia un cronómetro y pausa el que estuviera corriendo. */
export function iniciarCronometro(tareas: Tarea[], idTarea: Id, ahora: Date): ResultadoInicio {
  const elegida = tareas.find((tarea) => tarea.id === idTarea);
  if (elegida === undefined || !estaAbierta(elegida) || cronometroCorriendo(elegida)) {
    return { tareas, pausada: null };
  }
  let pausada: Tarea | null = null;
  const actualizadas = tareas.map((tarea) => {
    if (tarea.id === idTarea) {
      return {
        ...tarea,
        cronometroIniciadoEn: ahora.toISOString(),
        estado: tarea.estado === 'pendiente' ? 'en_progreso' : tarea.estado,
        actualizadaEn: ahora.toISOString(),
      } satisfies Tarea;
    }
    if (cronometroCorriendo(tarea)) {
      pausada = pausarCronometro(tarea, ahora);
      return pausada;
    }
    return tarea;
  });
  return { tareas: actualizadas, pausada };
}

/**
 * RN-11: la hora de salida del día en que se inició, si se inició en un día laboral
 * antes de esa hora; si no, las 24:00 de ese día.
 */
export function limiteDelCronometro(tarea: Tarea, horario: HorarioTrabajo): Date | null {
  if (tarea.cronometroIniciadoEn === null) return null;
  const inicio = new Date(tarea.cronometroIniciadoEn);
  const fechaDeInicio = fechaLocal(inicio);
  const salida = horaAMinutos(horario.salida);
  const empezoEnJornada = esDiaLaboral(fechaDeInicio, horario) && minutosDelDia(inicio) < salida;
  return instanteLocal(fechaDeInicio, empezoEnJornada ? salida : MINUTOS_POR_DIA);
}

export interface ResultadoPausaAutomatica {
  tareas: Tarea[];
  pausadas: Tarea[];
}

/** RN-11: pausa los cronómetros olvidados contando solo hasta su límite. */
export function aplicarPausaAutomatica(tareas: Tarea[], horario: HorarioTrabajo, ahora: Date): ResultadoPausaAutomatica {
  const pausadas: Tarea[] = [];
  const actualizadas = tareas.map((tarea) => {
    const limite = limiteDelCronometro(tarea, horario);
    if (limite === null || ahora <= limite) return tarea;
    const pausada = { ...pausarCronometro(tarea, limite), actualizadaEn: ahora.toISOString() };
    pausadas.push(pausada);
    return pausada;
  });
  return { tareas: actualizadas, pausadas };
}
