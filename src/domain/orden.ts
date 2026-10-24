// RF-CAL-11: orden de las listas de tareas según el criterio elegido.
import type { CriterioOrden, Tarea } from './modelo';
import { RANGO_PRIORIDAD } from './tareas';

type Comparador = (a: Tarea, b: Tarea) => number;

function compararTexto(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

const porPrioridad: Comparador = (a, b) => RANGO_PRIORIDAD[a.prioridad] - RANGO_PRIORIDAD[b.prioridad];
const porFechaYHora: Comparador = (a, b) => compararTexto(a.fecha + a.horaInicio, b.fecha + b.horaInicio);
const porMeta: Comparador = (a, b) => a.metaMinutos - b.metaMinutos;
const porCreacion: Comparador = (a, b) => compararTexto(a.creadaEn, b.creadaEn);

/** Orden principal y desempates de la tabla de RF-CAL-11. */
const COMPARADORES: Record<CriterioOrden, Comparador[]> = {
  prioridad: [porPrioridad, porFechaYHora, porCreacion],
  fecha: [porFechaYHora, porPrioridad, porCreacion],
  meta: [porMeta, porPrioridad, porCreacion],
};

export function ordenarTareas(tareas: Tarea[], criterio: CriterioOrden): Tarea[] {
  const comparadores = COMPARADORES[criterio];
  return [...tareas].sort((a, b) => {
    for (const comparar of comparadores) {
      const diferencia = comparar(a, b);
      if (diferencia !== 0) return diferencia;
    }
    return 0;
  });
}
