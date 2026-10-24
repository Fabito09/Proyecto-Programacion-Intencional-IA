// Cuadrícula por horas común a las tres vistas (RF-CAL-03 a RF-CAL-09, RN-08).
import type { FechaISO, HoraDelDia, HorarioTrabajo, Tarea } from '../../domain/modelo';
import { esDiaLaboral } from '../../domain/horario';
import {
  agruparPorSuperposicion,
  extremosDelGrupo,
  finEnMinutos,
  inicioEnMinutos,
  sumaDeMetasAbiertas,
} from '../../domain/tareas';
import { diaDeLaSemana, fechaLocal, formatearDuracion, horaAMinutos, MINUTOS_POR_DIA, minutosAHora, minutosDelDia } from '../../domain/tiempo';
import { el, ubicar } from '../dom';
import { DIA_CORTO, fechaCorta, horaLegible } from '../textos';
import { bloqueDeGrupo, type ContextoBloque } from './bloqueTarea';
import { posicionEnPeriodo, type Periodo } from './periodo';

export interface OpcionesCuadricula {
  periodo: Periodo;
  /** Ya filtradas por categoría y estado. */
  tareas: Tarea[];
  horario: HorarioTrabajo;
  contexto: ContextoBloque;
  mostrarCabecera: boolean;
  alPulsarEspacio(fecha: FechaISO, hora: HoraDelDia): void;
}

function estaEnElPeriodo(tarea: Tarea, periodo: Periodo): boolean {
  return inicioEnMinutos(tarea) < periodo.hasta && finEnMinutos(tarea) > periodo.desde;
}

/** RF-CAL-08 + RF-EST-03/04: fecha, día y total de metas abiertas del día. */
function cabeceraDelDia(dia: FechaISO, opciones: OpcionesCuadricula, hoy: FechaISO): HTMLElement {
  const laboral = esDiaLaboral(dia, opciones.horario);
  const total = laboral ? formatearDuracion(sumaDeMetasAbiertas(opciones.tareas, dia)) : 'No laboral';
  return el(
    'div',
    { clase: `cuadricula__cabecera-dia${dia === hoy ? ' es-hoy' : ''}` },
    el(
      'div',
      { clase: 'cuadricula__fecha' },
      el('span', { clase: 'cuadricula__numero' }, fechaCorta(dia)),
      el('span', { clase: 'cuadricula__dia-semana' }, DIA_CORTO[diaDeLaSemana(dia)]),
    ),
    el('span', { clase: 'cuadricula__total' }, total),
  );
}

function etiquetasDeHora(periodo: Periodo): HTMLElement {
  const columna = el('div', { clase: 'cuadricula__horas', atributos: { 'aria-hidden': 'true' } });
  for (let minutos = periodo.desde; minutos <= periodo.hasta && minutos < MINUTOS_POR_DIA; minutos += periodo.minutosPorFila) {
    const etiqueta = el('span', { clase: `cuadricula__hora${minutos % 60 === 0 ? ' es-en-punto' : ''}` }, horaLegible(minutos));
    etiqueta.style.setProperty('--arriba', `${posicionEnPeriodo(periodo, minutos)}px`);
    columna.append(etiqueta);
  }
  return columna;
}

/** RF-CAL-06: sombras para las horas fuera de la jornada. */
function sombrasFueraDeJornada(periodo: Periodo, horario: HorarioTrabajo): HTMLElement[] {
  const entrada = horaAMinutos(horario.entrada);
  const salida = horaAMinutos(horario.salida);
  const tramos: [number, number][] = [
    [periodo.desde, Math.min(entrada, periodo.hasta)],
    [Math.max(salida, periodo.desde), periodo.hasta],
  ];
  return tramos
    .filter(([desde, hasta]) => hasta > desde)
    .map(([desde, hasta]) => {
      const sombra = el('div', { clase: 'cuadricula__sombra' });
      ubicar(sombra, posicionEnPeriodo(periodo, desde), posicionEnPeriodo(periodo, hasta) - posicionEnPeriodo(periodo, desde));
      return sombra;
    });
}

function columnaDelDia(dia: FechaISO, opciones: OpcionesCuadricula, hoy: FechaISO): HTMLElement {
  const { periodo, horario, contexto } = opciones;
  const laboral = esDiaLaboral(dia, horario);
  const columna = el('div', {
    clase: `cuadricula__columna${laboral ? '' : ' es-no-laboral'}${dia === hoy ? ' es-hoy' : ''}`,
    atributos: { 'data-fecha': dia },
  });
  if (laboral) columna.append(...sombrasFueraDeJornada(periodo, horario));

  const delDia = opciones.tareas.filter((tarea) => tarea.fecha === dia && estaEnElPeriodo(tarea, periodo));
  for (const grupo of agruparPorSuperposicion(delDia)) {
    const { inicio, fin } = extremosDelGrupo(grupo);
    const arriba = posicionEnPeriodo(periodo, Math.max(inicio, periodo.desde));
    const abajo = posicionEnPeriodo(periodo, Math.min(fin, periodo.hasta));
    const bloque = bloqueDeGrupo(grupo, contexto);
    ubicar(bloque, arriba, abajo - arriba);
    columna.append(bloque);
  }

  const minutosActuales = minutosDelDia(contexto.ahora);
  if (dia === hoy && minutosActuales >= periodo.desde && minutosActuales < periodo.hasta) {
    const linea = el('div', { clase: 'linea-ahora', atributos: { 'aria-hidden': 'true' } });
    linea.style.setProperty('--arriba', `${posicionEnPeriodo(periodo, minutosActuales)}px`);
    columna.append(linea);
  }

  // RF-CAL-09: solo un espacio vacío dentro de la jornada abre el formulario.
  columna.addEventListener('click', (evento) => {
    if (evento.target !== columna || !laboral) return;
    const minutos = periodo.desde + Math.floor(evento.offsetY / periodo.altoFila) * periodo.minutosPorFila;
    if (minutos < horaAMinutos(horario.entrada) || minutos >= horaAMinutos(horario.salida)) return;
    opciones.alPulsarEspacio(dia, minutosAHora(minutos));
  });
  return columna;
}

export function cuadricula(opciones: OpcionesCuadricula): HTMLElement {
  const { periodo } = opciones;
  const hoy = fechaLocal(opciones.contexto.ahora);
  const variosDias = periodo.dias.length > 1;

  const cuerpo = el(
    'div',
    { clase: 'cuadricula__cuerpo' },
    etiquetasDeHora(periodo),
    ...periodo.dias.map((dia) => columnaDelDia(dia, opciones, hoy)),
  );
  cuerpo.style.setProperty('--alto-total', `${posicionEnPeriodo(periodo, periodo.hasta)}px`);
  cuerpo.style.setProperty('--alto-fila', `${periodo.altoFila}px`);

  const raiz = el(
    'div',
    { clase: `cuadricula${variosDias ? ' cuadricula--semana' : ''}` },
    el(
      'div',
      { clase: 'cuadricula__desplazable' },
      opciones.mostrarCabecera
        ? el('div', { clase: 'cuadricula__cabecera' }, el('span'), ...periodo.dias.map((dia) => cabeceraDelDia(dia, opciones, hoy)))
        : null,
      cuerpo,
    ),
  );
  raiz.style.setProperty('--columnas', String(periodo.dias.length));
  return raiz;
}
