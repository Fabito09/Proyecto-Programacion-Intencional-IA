import { el } from '../dom';
import { icono, type NombreIcono } from '../iconos';

export type Variante = 'primario' | 'acento' | 'secundario' | 'fantasma' | 'peligro';

interface OpcionesBoton {
  variante?: Variante;
  iconoInicial?: NombreIcono;
  tipo?: 'button' | 'submit';
  deshabilitado?: boolean;
  alHacerClic?: () => void;
}

export function boton(texto: string, opciones: OpcionesBoton = {}): HTMLButtonElement {
  return el(
    'button',
    {
      clase: `boton boton--${opciones.variante ?? 'secundario'}`,
      atributos: { type: opciones.tipo ?? 'button', disabled: opciones.deshabilitado },
      alHacerClic: opciones.alHacerClic,
    },
    opciones.iconoInicial ? icono(opciones.iconoInicial) : null,
    texto,
  );
}

/** Botón redondo de solo ícono; la etiqueta accesible es obligatoria. */
export function botonIcono(nombre: NombreIcono, etiqueta: string, alHacerClic: () => void, clase = 'boton-icono'): HTMLButtonElement {
  return el('button', { clase, atributos: { type: 'button', 'aria-label': etiqueta }, alHacerClic }, icono(nombre, undefined, 18));
}
