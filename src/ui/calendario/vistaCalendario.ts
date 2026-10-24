// Sección Calendario: encabezado, controles, vencidas y cuadrícula (RF-CAL, RN-05, RF-EST-02).
import { CRITERIOS_ORDEN, ESTADOS_TAREA, VISTAS_CALENDARIO, type FechaISO, type HoraDelDia, type Tarea } from '../../domain/modelo';
import { MENSAJES } from '../../domain/mensajes';
import { esDiaLaboral } from '../../domain/horario';
import { ordenarTareas } from '../../domain/orden';
import { estaVencida, finEnMinutos, inicioEnMinutos, sumaDeMetasAbiertas } from '../../domain/tareas';
import {
  diaDeLaSemana,
  fechaLocal,
  formatearDuracion,
  lunesDeLaSemana,
  minutosDelDia,
  numeroDeSemanaISO,
  sumarDias,
} from '../../domain/tiempo';
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarRespuesta } from '../avisos';
import { boton, botonIcono } from '../componentes/boton';
import { etiquetaAlerta, pildoraCategoria } from '../componentes/etiquetas';
import { el } from '../dom';
import { DIA_CORTO, fechaCorta, fechaLarga, horaLegible, mesYAnio, NOMBRE_CRITERIO, NOMBRE_ESTADO, NOMBRE_VISTA, rango, rangoDeTarea, resumenDeHorario } from '../textos';
import type { AccionesSobreTareas } from './bloqueTarea';
import { cuadricula } from './cuadricula';
import { periodoDe, type Periodo } from './periodo';

/** Estado de la vista que no se guarda: qué fecha se mira, filtros y si "Vencidas" está abierta. */
export interface EstadoCalendario {
  fechaReferencia: FechaISO;
  filtroCategoria: string;
  filtroEstado: string;
  vencidasAbiertas: boolean;
}

export interface ControlCalendario {
  estado: EstadoCalendario;
  cambiar(cambios: Partial<EstadoCalendario>): void;
  abrirNuevaTarea(fecha?: FechaISO, hora?: HoraDelDia): void;
  acciones: AccionesSobreTareas;
}

function cumpleFiltros(tarea: Tarea, estado: EstadoCalendario): boolean {
  return (
    (estado.filtroCategoria === '' || tarea.categoriaId === estado.filtroCategoria) &&
    (estado.filtroEstado === '' || tarea.estado === estado.filtroEstado)
  );
}

function selector(etiqueta: string, opciones: { valor: string; texto: string }[], valor: string, alCambiar: (valor: string) => void): HTMLElement {
  const control = el(
    'select',
    { clase: 'selector' },
    ...opciones.map((opcion) => el('option', { atributos: { value: opcion.valor, selected: opcion.valor === valor } }, opcion.texto)),
  );
  control.addEventListener('change', () => alCambiar(control.value));
  return el('label', { clase: 'control-etiquetado' }, etiqueta, control);
}

function titulos(aplicacion: Aplicacion, periodo: Periodo, fechaReferencia: FechaISO): { titulo: HTMLElement; subtitulo: string } {
  const { preferencias, tareas } = aplicacion.obtenerEstado();
  const ahora = aplicacion.ahora();
  const hoy = fechaLocal(ahora);
  const semana = el('span', { clase: 'titulo-grande__secundario' }, ` S${numeroDeSemanaISO(fechaReferencia)}`);

  switch (preferencias.vistaPreferida) {
    case 'horas':
      return {
        titulo: el('h1', { clase: 'titulo-grande' }, 'Próximas horas', el('span', { clase: 'titulo-grande__secundario' }, ` ${rango(periodo.desde, periodo.hasta)}`)),
        subtitulo: `${fechaLarga(hoy)} · Ahora ${horaLegible(minutosDelDia(ahora))}`,
      };
    case 'dia': {
      const laboral = esDiaLaboral(fechaReferencia, preferencias.horarioTrabajo);
      return {
        titulo: el('h1', { clase: `titulo-grande${fechaReferencia === hoy ? ' es-hoy' : ''}` }, fechaLarga(fechaReferencia), semana),
        subtitulo: laboral
          ? `${fechaReferencia === hoy ? 'Hoy' : 'Este día'}: ${formatearDuracion(sumaDeMetasAbiertas(tareas, fechaReferencia))} planificadas · Jornada ${preferencias.horarioTrabajo.entrada}–${preferencias.horarioTrabajo.salida}`
          : 'Día no laboral',
      };
    }
    case 'semana': {
      const total = periodo.dias.reduce((suma, dia) => suma + sumaDeMetasAbiertas(tareas, dia), 0);
      return {
        titulo: el('h1', { clase: 'titulo-grande' }, mesYAnio(lunesDeLaSemana(fechaReferencia)), semana),
        subtitulo: `Total de la semana: ${formatearDuracion(total)} planificadas · Horario ${resumenDeHorario(preferencias.horarioTrabajo)}`,
      };
    }
  }
}

function controles(aplicacion: Aplicacion, control: ControlCalendario): HTMLElement {
  const { preferencias, categorias } = aplicacion.obtenerEstado();
  const vista = preferencias.vistaPreferida;
  const hoy = fechaLocal(aplicacion.ahora());
  const paso = vista === 'semana' ? 7 : 1;
  const nombrePaso = vista === 'semana' ? 'Semana' : 'Día';

  return el(
    'div',
    { clase: 'controles' },
    // RF-CAL-01, RF-CAL-02
    el(
      'div',
      { clase: 'segmentado', atributos: { role: 'group', 'aria-label': 'Vista' } },
      ...VISTAS_CALENDARIO.map((opcion) =>
        el(
          'button',
          {
            clase: 'segmentado__opcion',
            atributos: { type: 'button', 'aria-pressed': String(opcion === vista) },
            alHacerClic: () => mostrarRespuesta(aplicacion.cambiarVista(opcion)),
          },
          NOMBRE_VISTA[opcion],
        ),
      ),
    ),
    // RF-CAL-11
    selector(
      'Ordenar',
      CRITERIOS_ORDEN.map((criterio) => ({ valor: criterio, texto: NOMBRE_CRITERIO[criterio] })),
      preferencias.ordenPreferido,
      (valor) => {
        const criterio = CRITERIOS_ORDEN.find((opcion) => opcion === valor);
        if (criterio) mostrarRespuesta(aplicacion.cambiarOrden(criterio));
      },
    ),
    // RF-CAL-12
    selector(
      'Categoría',
      [{ valor: '', texto: 'Todas' }, ...categorias.map((categoria) => ({ valor: categoria.id, texto: categoria.nombre }))],
      control.estado.filtroCategoria,
      (valor) => control.cambiar({ filtroCategoria: valor }),
    ),
    selector(
      'Estado',
      [{ valor: '', texto: 'Todos' }, ...ESTADOS_TAREA.map((estado) => ({ valor: estado, texto: NOMBRE_ESTADO[estado] }))],
      control.estado.filtroEstado,
      (valor) => control.cambiar({ filtroEstado: valor }),
    ),
    vista === 'horas'
      ? null
      : el(
          'div',
          { clase: 'navegacion' },
          boton('Hoy', { alHacerClic: () => control.cambiar({ fechaReferencia: hoy }) }),
          botonIcono('izquierda', `${nombrePaso} anterior`, () => control.cambiar({ fechaReferencia: sumarDias(control.estado.fechaReferencia, -paso) }), 'boton-redondo'),
          botonIcono('derecha', `${nombrePaso} siguiente`, () => control.cambiar({ fechaReferencia: sumarDias(control.estado.fechaReferencia, paso) }), 'boton-redondo'),
        ),
    boton('Nueva tarea', { variante: 'acento', iconoInicial: 'mas', alHacerClic: () => control.abrirNuevaTarea() }),
  );
}

/** RN-05: tareas vencidas, incluso de semanas anteriores, arriba del calendario. */
function seccionVencidas(aplicacion: Aplicacion, control: ControlCalendario, tareas: Tarea[]): HTMLElement | null {
  const { preferencias, categorias } = aplicacion.obtenerEstado();
  const ahora = aplicacion.ahora();
  const vencidas = ordenarTareas(tareas.filter((tarea) => estaVencida(tarea, ahora)), preferencias.ordenPreferido);
  if (vencidas.length === 0) return null;

  const seccion = el(
    'details',
    { clase: 'vencidas', atributos: { open: control.estado.vencidasAbiertas } },
    el('summary', { clase: 'vencidas__resumen' }, `Vencidas (${vencidas.length})`),
    el(
      'ul',
      { clase: 'lista-simple' },
      ...vencidas.map((tarea) =>
        el(
          'li',
          {},
          el(
            'button',
            { clase: 'fila-tarea', atributos: { type: 'button' }, alHacerClic: () => control.acciones.abrirTarea(tarea) },
            el(
              'span',
              { clase: 'fila-tarea__texto fila-tarea__texto--en-linea' },
              el('span', { clase: 'fila-tarea__titulo alerta--vencida' }, tarea.titulo),
              el('span', { clase: 'texto-tenue' }, `${DIA_CORTO[diaDeLaSemana(tarea.fecha)]} ${fechaCorta(tarea.fecha)} · ${rangoDeTarea(tarea)}`),
              pildoraCategoria(categorias.find((categoria) => categoria.id === tarea.categoriaId)),
            ),
            etiquetaAlerta('vencida'),
          ),
        ),
      ),
    ),
  );
  seccion.addEventListener('toggle', () => {
    control.estado.vencidasAbiertas = seccion.open;
  });
  return seccion;
}

function mensajeVacio(texto: string, accion: HTMLElement): HTMLElement {
  return el('div', { clase: 'vacio' }, el('p', { clase: 'vacio__texto' }, texto), accion);
}

export function vistaCalendario(aplicacion: Aplicacion, control: ControlCalendario): HTMLElement {
  const estado = aplicacion.obtenerEstado();
  const ahora = aplicacion.ahora();
  const hoy = fechaLocal(ahora);
  const vista = estado.preferencias.vistaPreferida;
  const periodo = periodoDe(vista, control.estado.fechaReferencia, ahora);
  const filtradas = estado.tareas.filter((tarea) => cumpleFiltros(tarea, control.estado));
  const hayFiltros = control.estado.filtroCategoria !== '' || control.estado.filtroEstado !== '';
  const visibles = filtradas.filter(
    (tarea) => periodo.dias.includes(tarea.fecha) && inicioEnMinutos(tarea) < periodo.hasta && finEnMinutos(tarea) > periodo.desde,
  );
  const { titulo, subtitulo } = titulos(aplicacion, periodo, control.estado.fechaReferencia);

  let aviso: HTMLElement | null = null;
  if (estado.tareas.length === 0) {
    // RF-CAL-10
    aviso = mensajeVacio(MENSAJES.sinTareas, boton('Agregar mi primera tarea', { variante: 'acento', iconoInicial: 'mas', alHacerClic: () => control.abrirNuevaTarea() }));
  } else if (hayFiltros && visibles.length === 0) {
    // RF-CAL-12
    aviso = mensajeVacio(MENSAJES.sinCoincidencias, boton('Quitar filtros', { alHacerClic: () => control.cambiar({ filtroCategoria: '', filtroEstado: '' }) }));
  }

  return el(
    'section',
    { clase: 'calendario', atributos: { 'aria-label': 'Calendario' } },
    el('div', { clase: 'calendario__encabezado' }, titulo, controles(aplicacion, control)),
    el('p', { clase: 'texto-tenue' }, subtitulo),
    periodo.dias.includes(hoy) ? seccionVencidas(aplicacion, control, filtradas) : null,
    aviso,
    cuadricula({
      periodo,
      tareas: filtradas,
      horario: estado.preferencias.horarioTrabajo,
      mostrarCabecera: vista !== 'horas',
      contexto: { categorias: estado.categorias, ahora, detallado: vista !== 'semana', acciones: control.acciones },
      alPulsarEspacio: (fecha, hora) => control.abrirNuevaTarea(fecha, hora),
    }),
  );
}
