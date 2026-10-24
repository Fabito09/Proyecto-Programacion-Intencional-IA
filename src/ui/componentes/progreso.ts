import { el } from '../dom';

const PASOS = 3;

/** Barra "Paso N de 3" del primer uso. */
export function progresoPrimerUso(paso: 1 | 2 | 3): HTMLElement {
  const barras = Array.from({ length: PASOS }, (_, indice) =>
    el('span', { clase: `progreso__barra${indice < paso ? ' es-completa' : ''}` }),
  );
  return el(
    'div',
    { clase: 'progreso' },
    el('div', { clase: 'progreso__barras', atributos: { 'aria-hidden': 'true' } }, ...barras),
    el('p', { clase: 'progreso__texto' }, `Paso ${paso} de ${PASOS}`),
  );
}
