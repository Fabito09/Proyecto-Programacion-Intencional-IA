// Fechas y horas locales del navegador (glosario: Hoy, Mañana, Semana).
import { DIAS_SEMANA, type DiaSemana, type FechaISO, type HoraDelDia } from './modelo';

export const MINUTOS_POR_DIA = 24 * 60;

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

function conCeros(numero: number): string {
  return String(numero).padStart(2, '0');
}

export function esFechaValida(texto: string): texto is FechaISO {
  if (!PATRON_FECHA.test(texto)) return false;
  const anio = Number(texto.slice(0, 4));
  const mes = Number(texto.slice(5, 7));
  const dia = Number(texto.slice(8, 10));
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

export function esHoraValida(texto: string): texto is HoraDelDia {
  return PATRON_HORA.test(texto);
}

/** Minutos transcurridos desde la medianoche. */
export function horaAMinutos(hora: HoraDelDia): number {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

/** Admite 1440 para el fin del día, que se muestra como "24:00". */
export function minutosAHora(minutos: number): HoraDelDia {
  return `${conCeros(Math.floor(minutos / 60))}:${conCeros(minutos % 60)}`;
}

export function fechaLocal(instante: Date): FechaISO {
  return `${instante.getFullYear()}-${conCeros(instante.getMonth() + 1)}-${conCeros(instante.getDate())}`;
}

export function minutosDelDia(instante: Date): number {
  return instante.getHours() * 60 + instante.getMinutes();
}

/** Instante local a N minutos de la medianoche de una fecha (1440 = medianoche siguiente). */
export function instanteLocal(fecha: FechaISO, minutos: number): Date {
  return new Date(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)), 0, minutos);
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const instante = instanteLocal(fecha, 0);
  instante.setDate(instante.getDate() + dias);
  return fechaLocal(instante);
}

/** 0 = lunes … 6 = domingo (ISO 8601). */
function indiceDelDia(fecha: FechaISO): number {
  return (instanteLocal(fecha, 0).getDay() + 6) % 7;
}

export function diaDeLaSemana(fecha: FechaISO): DiaSemana {
  const dia = DIAS_SEMANA[indiceDelDia(fecha)];
  if (dia === undefined) throw new Error(`Día fuera de rango para ${fecha}`);
  return dia;
}

export function lunesDeLaSemana(fecha: FechaISO): FechaISO {
  return sumarDias(fecha, -indiceDelDia(fecha));
}

/** Las siete fechas, de lunes a domingo, de la semana que contiene la fecha. */
export function diasDeLaSemana(fecha: FechaISO): FechaISO[] {
  const lunes = lunesDeLaSemana(fecha);
  return DIAS_SEMANA.map((_, indice) => sumarDias(lunes, indice));
}

export function mismaSemana(a: FechaISO, b: FechaISO): boolean {
  return lunesDeLaSemana(a) === lunesDeLaSemana(b);
}

/** Número de semana ISO 8601, mostrado como "S43" (RF-EST-02). */
export function numeroDeSemanaISO(fecha: FechaISO): number {
  const jueves = sumarDias(fecha, 3 - indiceDelDia(fecha));
  const primeroDeEnero = `${jueves.slice(0, 4)}-01-01`;
  const diasTranscurridos = Math.round(
    (instanteLocal(jueves, 0).getTime() - instanteLocal(primeroDeEnero, 0).getTime()) / MILISEGUNDOS_POR_DIA,
  );
  return Math.floor(diasTranscurridos / 7) + 1;
}

/** Formato "X h Y min" (RF-CAL-08). */
export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

/** Formato "H:MM:SS" (RF-CRO-01). */
export function formatearCronometro(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return `${horas}:${conCeros(minutos)}:${conCeros(segundos % 60)}`;
}
