// Validación del formulario de tarea (RF-TAR-01 a RF-TAR-07, RN-01, RN-09).
import {
  LIMITES,
  PRIORIDADES,
  type Categoria,
  type FechaISO,
  type HoraDelDia,
  type HorarioTrabajo,
  type Id,
  type Prioridad,
  type Tarea,
} from './modelo';
import { encajeEnHorario } from './horario';
import { MENSAJES } from './mensajes';
import { exito, fallo, tieneErrores, type ErroresDeCampo, type Resultado } from './resultado';
import { existeDuplicado } from './tareas';
import { esFechaValida, esHoraValida } from './tiempo';

export type CampoTarea = 'titulo' | 'descripcion' | 'fecha' | 'horaInicio' | 'meta' | 'prioridad' | 'categoriaId';

/** Valores tal como llegan del formulario (RF-UI-02). */
export interface BorradorTarea {
  titulo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  metaHoras: string;
  metaMinutos: string;
  prioridad: string;
  categoriaId: string;
}

export interface DatosTarea {
  titulo: string;
  descripcion: string;
  fecha: FechaISO;
  horaInicio: HoraDelDia;
  metaMinutos: number;
  prioridad: Prioridad;
  categoriaId: Id;
}

export interface ContextoTarea {
  tareas: Tarea[];
  categorias: Categoria[];
  horario: HorarioTrabajo;
  hoy: FechaISO;
  /** null al crear; la tarea original al editar. */
  tareaEnEdicion: Tarea | null;
}

const PATRON_ENTERO = /^\d+$/;

/** Casilla vacía = 0; null si no es un entero entre 0 y el máximo. */
function leerEntero(texto: string, maximo: number): number | null {
  const limpio = texto.trim();
  if (limpio === '') return 0;
  if (!PATRON_ENTERO.test(limpio)) return null;
  const valor = Number(limpio);
  return valor <= maximo ? valor : null;
}

/** RF-TAR-03: meta en minutos, o null si está fuera de rango. */
function leerMeta(horas: string, minutos: string): number | null {
  const horasLeidas = leerEntero(horas, 24);
  const minutosLeidos = leerEntero(minutos, 59);
  if (horasLeidas === null || minutosLeidos === null) return null;
  const total = horasLeidas * 60 + minutosLeidos;
  return total >= LIMITES.metaMinimaMinutos && total <= LIMITES.metaMaximaMinutos ? total : null;
}

function esPrioridad(texto: string): texto is Prioridad {
  return PRIORIDADES.some((prioridad) => prioridad === texto);
}

export function validarTarea(borrador: BorradorTarea, contexto: ContextoTarea): Resultado<DatosTarea, CampoTarea> {
  const errores: ErroresDeCampo<CampoTarea> = {};
  const titulo = borrador.titulo.trim();
  const descripcion = borrador.descripcion.trim();
  const { fecha, horaInicio, prioridad, categoriaId } = borrador;
  const meta = leerMeta(borrador.metaHoras, borrador.metaMinutos);

  // RF-TAR-01, RF-TAR-02
  if (titulo === '') errores.titulo = MENSAJES.tituloObligatorio;
  else if (titulo.length > LIMITES.tituloMaximo) errores.titulo = MENSAJES.maximoCaracteres(LIMITES.tituloMaximo);
  if (descripcion.length > LIMITES.descripcionMaxima) {
    errores.descripcion = MENSAJES.maximoCaracteres(LIMITES.descripcionMaxima);
  }

  // RF-TAR-03
  if (meta === null) errores.meta = MENSAJES.metaFueraDeRango;

  // RF-TAR-04, RF-TAR-05: al editar se puede conservar la fecha original aunque ya pasó.
  if (!esFechaValida(fecha)) errores.fecha = MENSAJES.fechaInvalida;
  else if (fecha < contexto.hoy && fecha !== contexto.tareaEnEdicion?.fecha) errores.fecha = MENSAJES.fechaEnElPasado;

  // RF-TAR-06, RF-TAR-07
  if (!esHoraValida(horaInicio)) errores.horaInicio = MENSAJES.horaInicioInvalida;
  if (!esPrioridad(prioridad)) errores.prioridad = MENSAJES.elijaPrioridad;
  if (!contexto.categorias.some((categoria) => categoria.id === categoriaId)) {
    errores.categoriaId = MENSAJES.elijaCategoria;
  }

  // RN-09
  if (esFechaValida(fecha) && esHoraValida(horaInicio) && meta !== null) {
    const encaje = encajeEnHorario(fecha, horaInicio, meta, contexto.horario);
    if (encaje === 'dia_no_laboral') errores.fecha ??= MENSAJES.diaNoLaboral;
    if (encaje === 'fuera_de_jornada') {
      errores.horaInicio ??= MENSAJES.fueraDeJornada(contexto.horario.entrada, contexto.horario.salida);
    }
  }

  // RN-01
  const idExcluido = contexto.tareaEnEdicion?.id ?? null;
  if (errores.titulo === undefined && esFechaValida(fecha) && existeDuplicado(titulo, fecha, contexto.tareas, idExcluido)) {
    errores.titulo = MENSAJES.tareaDuplicada;
  }

  if (tieneErrores(errores) || meta === null || !esFechaValida(fecha) || !esHoraValida(horaInicio) || !esPrioridad(prioridad)) {
    return fallo(errores);
  }
  return exito({ titulo, descripcion, fecha, horaInicio, metaMinutos: meta, prioridad, categoriaId });
}
