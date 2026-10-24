// Nombres y formatos de fecha visibles en la interfaz (RF-UI-05: trato de usted).
import type {
  ColorCategoria,
  CriterioOrden,
  DiaSemana,
  EstadoTarea,
  FechaISO,
  HorarioTrabajo,
  Prioridad,
  Tarea,
  VistaCalendario,
} from '../domain/modelo';
import type { Alerta } from '../domain/tareas';
import { finEnMinutos, inicioEnMinutos } from '../domain/tareas';
import { diaDeLaSemana, minutosAHora } from '../domain/tiempo';

export const DIA_CORTO: Record<DiaSemana, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom',
};

const DIA_LARGO: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };

export const NOMBRE_ESTADO: Record<EstadoTarea, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

export const NOMBRE_VISTA: Record<VistaCalendario, string> = { horas: 'Horas', dia: 'Día', semana: 'Semana' };

export const NOMBRE_CRITERIO: Record<CriterioOrden, string> = { prioridad: 'Prioridad', fecha: 'Fecha', meta: 'Meta' };

export const NOMBRE_COLOR: Record<ColorCategoria, string> = {
  azul: 'Azul',
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
  morado: 'Morado',
  gris: 'Gris',
};

export const TEXTO_ALERTA: Record<Alerta, string> = { vencida: 'Vencida', por_vencer: 'Por vencer' };

function nombreDelMes(fecha: FechaISO): string {
  return MESES[Number(fecha.slice(5, 7)) - 1] ?? '';
}

/** "23 oct" */
export function fechaCorta(fecha: FechaISO): string {
  return `${Number(fecha.slice(8, 10))} ${nombreDelMes(fecha).slice(0, 3)}`;
}

/** "Viernes 23 oct" */
export function fechaLarga(fecha: FechaISO): string {
  return `${DIA_LARGO[diaDeLaSemana(fecha)]} ${fechaCorta(fecha)}`;
}

/** "Octubre 2026" */
export function mesYAnio(fecha: FechaISO): string {
  const mes = nombreDelMes(fecha);
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${fecha.slice(0, 4)}`;
}

/** "9:00" en lugar de "09:00", como en los wireframes. */
export function horaLegible(minutos: number): string {
  const hora = minutosAHora(minutos);
  return hora.startsWith('0') ? hora.slice(1) : hora;
}

export function rango(inicio: number, fin: number): string {
  return `${horaLegible(inicio)}–${horaLegible(fin)}`;
}

export function rangoDeTarea(tarea: Tarea): string {
  return rango(inicioEnMinutos(tarea), finEnMinutos(tarea));
}

export function cantidadDeTareas(cantidad: number): string {
  return cantidad === 1 ? '1 tarea' : `${cantidad} tareas`;
}

/** "Lun, Mar, Mié, Jue, Vie · 08:00–17:00" */
export function resumenDeHorario(horario: HorarioTrabajo): string {
  return `${horario.diasLaborales.map((dia) => DIA_CORTO[dia]).join(', ')} · ${horario.entrada}–${horario.salida}`;
}
