// Íconos SVG de trazo (sin emojis). Decorativos salvo que se les dé una etiqueta.

const ESPACIO_SVG = 'http://www.w3.org/2000/svg';

const TRAZOS = {
  mas: ['M12 5v14', 'M5 12h14'],
  izquierda: ['M15 18l-6-6 6-6'],
  derecha: ['M9 18l6-6-6-6'],
  cerrar: ['M6 6l12 12', 'M18 6L6 18'],
  completar: ['M5 12l5 5 9-10'],
  reloj: ['M20 13a8 8 0 1 1-16 0a8 8 0 1 1 16 0', 'M12 9v4l2 2', 'M9 2h6'],
  campana: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  info: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M12 8v4', 'M12 16h.01'],
  alta: ['M6 13l6-6 6 6', 'M6 19l6-6 6 6'],
  media: ['M5 10h14', 'M5 14h14'],
  baja: ['M6 9l6 6 6-6'],
} as const;

const RELLENOS = {
  iniciar: 'M7 5l12 7-12 7z',
  pausar: 'M6 5h4v14H6zM14 5h4v14h-4z',
} as const;

export type NombreIcono = keyof typeof TRAZOS | keyof typeof RELLENOS;

function esRelleno(nombre: NombreIcono): nombre is keyof typeof RELLENOS {
  return nombre in RELLENOS;
}

function trazo(datos: string): SVGPathElement {
  const camino = document.createElementNS(ESPACIO_SVG, 'path');
  camino.setAttribute('d', datos);
  return camino;
}

export function icono(nombre: NombreIcono, etiqueta?: string, tamano = 16): SVGSVGElement {
  const svg = document.createElementNS(ESPACIO_SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(tamano));
  svg.setAttribute('height', String(tamano));
  svg.classList.add('icono');
  if (etiqueta) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', etiqueta);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  if (esRelleno(nombre)) {
    svg.setAttribute('fill', 'currentColor');
    svg.append(trazo(RELLENOS[nombre]));
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.append(...TRAZOS[nombre].map(trazo));
  }
  return svg;
}
