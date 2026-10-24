// Creación de nodos del DOM sin innerHTML: los textos siempre entran como nodos de texto.

export type Hijo = Node | string | number | null | undefined | false;
type ValorAtributo = string | number | boolean | null | undefined;

export interface OpcionesElemento {
  clase?: string;
  atributos?: Record<string, ValorAtributo>;
  alHacerClic?: () => void;
}

export function agregarHijos(padre: Node, hijos: Hijo[]): void {
  for (const hijo of hijos) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    padre.appendChild(typeof hijo === 'string' || typeof hijo === 'number' ? document.createTextNode(String(hijo)) : hijo);
  }
}

export function el<Etiqueta extends keyof HTMLElementTagNameMap>(
  etiqueta: Etiqueta,
  opciones: OpcionesElemento = {},
  ...hijos: Hijo[]
): HTMLElementTagNameMap[Etiqueta] {
  const elemento = document.createElement(etiqueta);
  if (opciones.clase) elemento.className = opciones.clase;
  for (const [nombre, valor] of Object.entries(opciones.atributos ?? {})) {
    if (valor === true) elemento.setAttribute(nombre, '');
    else if (valor !== false && valor !== null && valor !== undefined) elemento.setAttribute(nombre, String(valor));
  }
  const alHacerClic = opciones.alHacerClic;
  if (alHacerClic) elemento.addEventListener('click', () => alHacerClic());
  agregarHijos(elemento, hijos);
  return elemento;
}

export function reemplazarContenido(padre: Element, ...hijos: Hijo[]): void {
  padre.replaceChildren();
  agregarHijos(padre, hijos);
}

let contadorDeIds = 0;

export function idUnico(prefijo: string): string {
  contadorDeIds += 1;
  return `${prefijo}-${contadorDeIds}`;
}

/** Ubica un elemento en la cuadrícula del calendario mediante variables CSS. */
export function ubicar(elemento: HTMLElement, arriba: number, alto: number): void {
  elemento.style.setProperty('--arriba', `${arriba}px`);
  elemento.style.setProperty('--alto', `${alto}px`);
}
