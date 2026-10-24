// Horario de trabajo: días laborales y jornada (RN-09, RF-AJU-03).
import type { FechaISO, HoraDelDia, HorarioTrabajo, Tarea } from './modelo';
import { estaAbierta } from './tareas';
import { diaDeLaSemana, horaAMinutos } from './tiempo';

export type Encaje = 'dentro' | 'dia_no_laboral' | 'fuera_de_jornada';

export function esDiaLaboral(fecha: FechaISO, horario: HorarioTrabajo): boolean {
  return horario.diasLaborales.includes(diaDeLaSemana(fecha));
}

/** RN-09: si un horario de tarea cabe en la jornada de su día. */
export function encajeEnHorario(
  fecha: FechaISO,
  horaInicio: HoraDelDia,
  metaMinutos: number,
  horario: HorarioTrabajo,
): Encaje {
  if (!esDiaLaboral(fecha, horario)) return 'dia_no_laboral';
  const inicio = horaAMinutos(horaInicio);
  const dentroDeJornada = inicio >= horaAMinutos(horario.entrada) && inicio + metaMinutos <= horaAMinutos(horario.salida);
  return dentroDeJornada ? 'dentro' : 'fuera_de_jornada';
}

/** RF-AJU-03: tareas abiertas que un nuevo horario deja afuera. */
export function tareasFueraDelHorario(tareas: Tarea[], horario: HorarioTrabajo): Tarea[] {
  return tareas.filter(
    (tarea) =>
      estaAbierta(tarea) && encajeEnHorario(tarea.fecha, tarea.horaInicio, tarea.metaMinutos, horario) !== 'dentro',
  );
}
