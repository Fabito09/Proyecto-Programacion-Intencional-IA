// Recordatorios diarios: un único resumen por franja y por día (RN-02, RN-03, RF-REC-02, RF-AJU-06).
import { FRANJAS_RECORDATORIO, type FechaISO, type FranjaRecordatorio, type Preferencias, type Tarea } from './modelo';
import { estaAbierta, estaVencida } from './tareas';
import { fechaLocal, horaAMinutos, minutosDelDia } from './tiempo';
import type { HorasRecordatorio } from './validacionPreferencias';

export interface ResumenDelDia {
  /** Tareas abiertas de Hoy que todavía no vencen. */
  deHoy: number;
  deAltaPrioridad: number;
  vencidas: number;
}

/** Glosario "Resumen del día": cada tarea cuenta en un solo grupo. */
export function resumenDelDia(tareas: Tarea[], ahora: Date): ResumenDelDia {
  const hoy = fechaLocal(ahora);
  const deHoy = tareas.filter((tarea) => tarea.fecha === hoy && estaAbierta(tarea) && !estaVencida(tarea, ahora));
  return {
    deHoy: deHoy.length,
    deAltaPrioridad: deHoy.filter((tarea) => tarea.prioridad === 'alta').length,
    vencidas: tareas.filter((tarea) => estaVencida(tarea, ahora)).length,
  };
}

function cantidad(numero: number, singular: string, plural: string): string {
  return `${numero} ${numero === 1 ? singular : plural}`;
}

export function textoDelResumen(resumen: ResumenDelDia): string {
  const partes: string[] = [];
  if (resumen.deHoy > 0) {
    const altas = resumen.deAltaPrioridad > 0 ? ` (${resumen.deAltaPrioridad} de prioridad alta)` : '';
    partes.push(`${cantidad(resumen.deHoy, 'tarea', 'tareas')} para hoy${altas}`);
  }
  if (resumen.vencidas > 0) {
    partes.push(
      resumen.deHoy > 0
        ? cantidad(resumen.vencidas, 'vencida', 'vencidas')
        : cantidad(resumen.vencidas, 'tarea vencida', 'tareas vencidas'),
    );
  }
  return `Tiene ${partes.join(' y ')}.`;
}

/** Franjas configuradas cuya hora ya llegó Hoy y que todavía no avisaron Hoy. */
export function franjasPendientes(preferencias: Preferencias, ahora: Date): FranjaRecordatorio[] {
  const hoy = fechaLocal(ahora);
  const minutosActuales = minutosDelDia(ahora);
  return FRANJAS_RECORDATORIO.filter((franja) => {
    const { hora, ultimoAviso } = preferencias.recordatorios[franja];
    return hora !== null && horaAMinutos(hora) <= minutosActuales && ultimoAviso !== hoy;
  });
}

function marcarAvisadas(preferencias: Preferencias, franjas: FranjaRecordatorio[], hoy: FechaISO): Preferencias {
  const recordatorios = { ...preferencias.recordatorios };
  for (const franja of franjas) recordatorios[franja] = { ...recordatorios[franja], ultimoAviso: hoy };
  return { ...preferencias, recordatorios };
}

export interface EvaluacionRecordatorios {
  /** El resumen a mostrar en un único aviso, o null si no corresponde avisar. */
  aviso: ResumenDelDia | null;
  preferencias: Preferencias;
}

/**
 * RN-02 y RN-03: si una o más franjas están pendientes y hay algo que avisar, un solo aviso
 * que las marca a todas. RF-REC-02: sin tareas para avisar no se toca ultimoAviso.
 */
export function evaluarRecordatorios(preferencias: Preferencias, tareas: Tarea[], ahora: Date): EvaluacionRecordatorios {
  const pendientes = franjasPendientes(preferencias, ahora);
  if (pendientes.length === 0) return { aviso: null, preferencias };
  const resumen = resumenDelDia(tareas, ahora);
  if (resumen.deHoy + resumen.vencidas === 0) return { aviso: null, preferencias };
  return { aviso: resumen, preferencias: marcarAvisadas(preferencias, pendientes, fechaLocal(ahora)) };
}

/** RF-AJU-06: una franja cuya nueva hora todavía no llegó puede volver a avisar Hoy. */
export function actualizarRecordatorios(preferencias: Preferencias, horas: HorasRecordatorio, ahora: Date): Preferencias {
  const minutosActuales = minutosDelDia(ahora);
  const recordatorios = { ...preferencias.recordatorios };
  for (const franja of FRANJAS_RECORDATORIO) {
    const actual = preferencias.recordatorios[franja];
    const nueva = horas[franja];
    const reiniciar = nueva !== actual.hora && nueva !== null && horaAMinutos(nueva) > minutosActuales;
    recordatorios[franja] = { hora: nueva, ultimoAviso: reiniciar ? null : actual.ultimoAviso };
  }
  return { ...preferencias, recordatorios };
}
