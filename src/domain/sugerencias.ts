// RN-12: meta sugerida para tareas repetidas a partir del tiempo medido.
import { LIMITES, type Tarea } from './modelo';
import { normalizarTexto } from './texto';

const VECES_CONSIDERADAS = 3;
const SEGUNDOS_MINIMOS = 60;

export interface MetaSugerida {
  minutos: number;
  /** Cuántas tareas anteriores se promediaron. */
  veces: number;
}

export function sugerirMeta(titulo: string, tareas: Tarea[]): MetaSugerida | null {
  const tituloNormalizado = normalizarTexto(titulo);
  if (tituloNormalizado === '') return null;

  const anteriores = tareas
    .filter(
      (tarea) =>
        tarea.estado === 'completada' &&
        tarea.segundosMedidos >= SEGUNDOS_MINIMOS &&
        normalizarTexto(tarea.titulo) === tituloNormalizado,
    )
    .sort((a, b) => (b.completadaEn ?? '').localeCompare(a.completadaEn ?? ''))
    .slice(0, VECES_CONSIDERADAS);
  if (anteriores.length === 0) return null;

  const promedioSegundos = anteriores.reduce((total, tarea) => total + tarea.segundosMedidos, 0) / anteriores.length;
  const minutos = Math.min(LIMITES.metaMaximaMinutos, Math.max(LIMITES.metaMinimaMinutos, Math.round(promedioSegundos / 60)));
  return { minutos, veces: anteriores.length };
}
