// RF-PER-03: comprueba que lo leído de LocalStorage tenga exactamente la forma de EstadoPersistido.
import {
  COLORES_CATEGORIA,
  CRITERIOS_ORDEN,
  DIAS_SEMANA,
  ESTADOS_TAREA,
  FRANJAS_RECORDATORIO,
  LIMITES,
  PASOS_PRIMER_USO,
  PRIORIDADES,
  VISTAS_CALENDARIO,
  type Categoria,
  type EstadoPersistido,
  type HorarioTrabajo,
  type Preferencias,
  type Recordatorio,
  type Tarea,
} from '../domain/modelo';
import { esFechaValida, esHoraValida } from '../domain/tiempo';

type Objeto = Record<string, unknown>;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

function esTextoONulo(valor: unknown): valor is string | null {
  return valor === null || esTexto(valor);
}

function esUnoDe<Opcion extends string>(opciones: readonly Opcion[], valor: unknown): valor is Opcion {
  return opciones.some((opcion) => opcion === valor);
}

function esListaDe<Elemento>(valor: unknown, esElemento: (item: unknown) => item is Elemento): valor is Elemento[] {
  return Array.isArray(valor) && valor.every((item) => esElemento(item));
}

function esFecha(valor: unknown): boolean {
  return esTexto(valor) && esFechaValida(valor);
}

function esHora(valor: unknown): boolean {
  return esTexto(valor) && esHoraValida(valor);
}

function esCategoria(valor: unknown): valor is Categoria {
  return (
    esObjeto(valor) &&
    esTexto(valor.id) &&
    esTexto(valor.nombre) &&
    esUnoDe(COLORES_CATEGORIA, valor.color) &&
    esTexto(valor.creadaEn)
  );
}

function esTarea(valor: unknown): valor is Tarea {
  return (
    esObjeto(valor) &&
    esTexto(valor.id) &&
    esTexto(valor.titulo) &&
    esTexto(valor.descripcion) &&
    esTexto(valor.categoriaId) &&
    esUnoDe(PRIORIDADES, valor.prioridad) &&
    esFecha(valor.fecha) &&
    esHora(valor.horaInicio) &&
    Number.isInteger(valor.metaMinutos) &&
    Number(valor.metaMinutos) >= LIMITES.metaMinimaMinutos &&
    Number(valor.metaMinutos) <= LIMITES.metaMaximaMinutos &&
    esUnoDe(ESTADOS_TAREA, valor.estado) &&
    Number.isInteger(valor.segundosMedidos) &&
    Number(valor.segundosMedidos) >= 0 &&
    esTextoONulo(valor.cronometroIniciadoEn) &&
    esTexto(valor.creadaEn) &&
    esTexto(valor.actualizadaEn) &&
    esTextoONulo(valor.completadaEn)
  );
}

function esRecordatorio(valor: unknown): valor is Recordatorio {
  return (
    esObjeto(valor) &&
    (valor.hora === null || esHora(valor.hora)) &&
    (valor.ultimoAviso === null || esFecha(valor.ultimoAviso))
  );
}

function esHorarioTrabajo(valor: unknown): valor is HorarioTrabajo {
  return (
    esObjeto(valor) &&
    esListaDe(valor.diasLaborales, (dia): dia is string => esUnoDe(DIAS_SEMANA, dia)) &&
    esHora(valor.entrada) &&
    esHora(valor.salida)
  );
}

function esPreferencias(valor: unknown): valor is Preferencias {
  if (!esObjeto(valor)) return false;
  const recordatorios = valor.recordatorios;
  return (
    esTexto(valor.nombreUsuario) &&
    esHorarioTrabajo(valor.horarioTrabajo) &&
    esUnoDe(PASOS_PRIMER_USO, valor.pasoPrimerUso) &&
    esObjeto(recordatorios) &&
    FRANJAS_RECORDATORIO.every((franja) => esRecordatorio(recordatorios[franja])) &&
    esUnoDe(VISTAS_CALENDARIO, valor.vistaPreferida) &&
    esUnoDe(CRITERIOS_ORDEN, valor.ordenPreferido)
  );
}

/** RF-PER-03: JSON con version 1, tareas que apuntan a categorías existentes y a lo sumo un cronómetro corriendo. */
export function esEstadoValido(valor: unknown): valor is EstadoPersistido {
  if (!esObjeto(valor) || valor.version !== 1) return false;
  const { categorias, tareas, preferencias } = valor;
  if (!esListaDe(categorias, esCategoria) || !esListaDe(tareas, esTarea) || !esPreferencias(preferencias)) {
    return false;
  }
  const idsDeCategorias = new Set(categorias.map((categoria) => categoria.id));
  const cronometrosCorriendo = tareas.filter((tarea) => tarea.cronometroIniciadoEn !== null).length;
  return tareas.every((tarea) => idsDeCategorias.has(tarea.categoriaId)) && cronometrosCorriendo <= 1;
}
