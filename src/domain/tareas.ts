// Consultas sobre tareas: estados derivados, duplicados y superposiciones.
import type { FechaISO, Id, Prioridad, Tarea } from './modelo';
import { normalizarTexto } from './texto';
import { fechaLocal, horaAMinutos, instanteLocal, mismaSemana, sumarDias } from './tiempo';

export const RANGO_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

type Horario = Pick<Tarea, 'horaInicio' | 'metaMinutos'>;

export function estaAbierta(tarea: Tarea): boolean {
  return tarea.estado !== 'completada';
}

export function inicioEnMinutos(tarea: Horario): number {
  return horaAMinutos(tarea.horaInicio);
}

export function finEnMinutos(tarea: Horario): number {
  return inicioEnMinutos(tarea) + tarea.metaMinutos;
}

/** Glosario "Tarea vencida": abierta y su fin ya pasó. No cambia su estado (RF-TAR-12). */
export function estaVencida(tarea: Tarea, ahora: Date): boolean {
  return estaAbierta(tarea) && instanteLocal(tarea.fecha, finEnMinutos(tarea)) < ahora;
}

/** Glosario "Tarea por vencer": abierta, no vencida, de Hoy o Mañana. */
export function estaPorVencer(tarea: Tarea, ahora: Date): boolean {
  if (!estaAbierta(tarea) || estaVencida(tarea, ahora)) return false;
  const hoy = fechaLocal(ahora);
  return tarea.fecha === hoy || tarea.fecha === sumarDias(hoy, 1);
}

export type Alerta = 'vencida' | 'por_vencer';

/** RN-06: qué señal visual lleva una tarea. */
export function alertaDe(tarea: Tarea, ahora: Date): Alerta | null {
  if (estaVencida(tarea, ahora)) return 'vencida';
  if (estaPorVencer(tarea, ahora)) return 'por_vencer';
  return null;
}

/** RN-01: otra tarea abierta con el mismo título normalizado en la misma semana. */
export function existeDuplicado(titulo: string, fecha: FechaISO, tareas: Tarea[], idExcluido: Id | null): boolean {
  const tituloNormalizado = normalizarTexto(titulo);
  return tareas.some(
    (otra) =>
      otra.id !== idExcluido &&
      estaAbierta(otra) &&
      mismaSemana(otra.fecha, fecha) &&
      normalizarTexto(otra.titulo) === tituloNormalizado,
  );
}

export function seSuperponen(a: Tarea, b: Tarea): boolean {
  return a.fecha === b.fecha && inicioEnMinutos(a) < finEnMinutos(b) && inicioEnMinutos(b) < finEnMinutos(a);
}

/** RN-07: tareas abiertas con las que choca una tarea recién guardada. */
export function tareasQueSeSuperponen(tarea: Tarea, tareas: Tarea[]): Tarea[] {
  return tareas.filter((otra) => otra.id !== tarea.id && estaAbierta(otra) && seSuperponen(tarea, otra));
}

/** RN-08: agrupa las tareas de un mismo día conectadas por superposición. */
export function agruparPorSuperposicion(tareasDelDia: Tarea[]): Tarea[][] {
  const ordenadas = [...tareasDelDia].sort((a, b) => inicioEnMinutos(a) - inicioEnMinutos(b));
  const grupos: Tarea[][] = [];
  let grupoActual: Tarea[] = [];
  let finDelGrupo = -1;
  for (const tarea of ordenadas) {
    if (grupoActual.length > 0 && inicioEnMinutos(tarea) < finDelGrupo) {
      grupoActual.push(tarea);
      finDelGrupo = Math.max(finDelGrupo, finEnMinutos(tarea));
    } else {
      if (grupoActual.length > 0) grupos.push(grupoActual);
      grupoActual = [tarea];
      finDelGrupo = finEnMinutos(tarea);
    }
  }
  if (grupoActual.length > 0) grupos.push(grupoActual);
  return grupos;
}

/** RN-08: la tarea que representa al grupo: mayor prioridad y, si empatan, la que empieza antes. */
export function tareaPrincipal(grupo: Tarea[]): Tarea {
  const [primera, ...resto] = grupo;
  if (primera === undefined) throw new Error('Un grupo superpuesto no puede estar vacío');
  return resto.reduce((elegida, tarea) => {
    const diferencia = RANGO_PRIORIDAD[tarea.prioridad] - RANGO_PRIORIDAD[elegida.prioridad];
    if (diferencia !== 0) return diferencia < 0 ? tarea : elegida;
    return inicioEnMinutos(tarea) < inicioEnMinutos(elegida) ? tarea : elegida;
  }, primera);
}

/** RF-CAL-08: suma de las metas de las tareas abiertas de un día. */
export function sumaDeMetasAbiertas(tareas: Tarea[], fecha: FechaISO): number {
  return tareas
    .filter((tarea) => tarea.fecha === fecha && estaAbierta(tarea))
    .reduce((total, tarea) => total + tarea.metaMinutos, 0);
}
