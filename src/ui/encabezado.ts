// Encabezado de la app: las tres secciones (RF-UI-01), el cronómetro en curso (RF-CRO-04) y el saludo (RF-INI-08).
import { cronometroCorriendo } from '../domain/cronometro';
import type { Aplicacion } from '../services/aplicacion';
import { mostrarRespuesta } from './avisos';
import { botonIcono } from './componentes/boton';
import { textoCronometro } from './componentes/etiquetas';
import { el } from './dom';
import { icono } from './iconos';

export type Seccion = 'calendario' | 'categorias' | 'ajustes';

const SECCIONES: { seccion: Seccion; texto: string }[] = [
  { seccion: 'calendario', texto: 'Calendario' },
  { seccion: 'categorias', texto: 'Categorías' },
  { seccion: 'ajustes', texto: 'Ajustes' },
];

export function encabezado(aplicacion: Aplicacion, actual: Seccion, alCambiarSeccion: (seccion: Seccion) => void): HTMLElement {
  const { tareas, preferencias } = aplicacion.obtenerEstado();
  const enCurso = tareas.find(cronometroCorriendo);

  return el(
    'header',
    { clase: 'encabezado' },
    el(
      'nav',
      { clase: 'encabezado__secciones', atributos: { 'aria-label': 'Secciones' } },
      ...SECCIONES.map(({ seccion, texto }) =>
        el(
          'button',
          {
            clase: 'encabezado__seccion',
            atributos: { type: 'button', 'aria-current': seccion === actual ? 'page' : undefined },
            alHacerClic: () => alCambiarSeccion(seccion),
          },
          texto,
        ),
      ),
    ),
    el(
      'div',
      { clase: 'encabezado__derecha' },
      enCurso
        ? el(
            'div',
            { clase: 'cronometro-en-curso' },
            icono('reloj'),
            el('span', { clase: 'cronometro-en-curso__titulo' }, enCurso.titulo),
            textoCronometro(enCurso, aplicacion.ahora()),
            botonIcono('pausar', 'Pausar cronómetro', () => mostrarRespuesta(aplicacion.pausarCronometro(enCurso.id)), 'boton-redondo boton-redondo--chico'),
          )
        : null,
      el('span', { clase: 'encabezado__saludo' }, `Hola, ${preferencias.nombreUsuario}`),
    ),
  );
}
