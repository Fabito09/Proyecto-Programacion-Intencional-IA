// Píldoras de categoría (RF-EST-05), etiquetas de alerta (RN-06) e ícono de prioridad (RF-CAL-07).
import type { Categoria, Prioridad, Tarea } from '../../domain/modelo';
import { segundosMedidos } from '../../domain/cronometro';
import type { Alerta } from '../../domain/tareas';
import { formatearCronometro } from '../../domain/tiempo';
import { el } from '../dom';
import { icono } from '../iconos';
import { NOMBRE_PRIORIDAD, TEXTO_ALERTA } from '../textos';

export function pildoraCategoria(categoria: Categoria | undefined): HTMLElement | null {
  if (categoria === undefined) return null;
  return el('span', { clase: `pildora pildora--${categoria.color}` }, categoria.nombre);
}

export function etiquetaAlerta(alerta: Alerta | null): HTMLElement | null {
  if (alerta === null) return null;
  return el('span', { clase: `etiqueta etiqueta--${alerta}` }, TEXTO_ALERTA[alerta]);
}

export function iconoPrioridad(prioridad: Prioridad): SVGSVGElement {
  const svg = icono(prioridad, `Prioridad ${NOMBRE_PRIORIDAD[prioridad].toLowerCase()}`, 14);
  svg.classList.add(`prioridad--${prioridad}`);
  return svg;
}

/** RF-CRO-01: "H:MM:SS". app.ts lo actualiza cada segundo a través de data-cronometro. */
export function textoCronometro(tarea: Tarea, ahora: Date): HTMLElement {
  return el(
    'span',
    { clase: 'cronometro', atributos: { 'data-cronometro': tarea.id } },
    formatearCronometro(segundosMedidos(tarea, ahora)),
  );
}
