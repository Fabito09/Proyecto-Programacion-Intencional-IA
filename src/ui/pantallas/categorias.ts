// Sección Categorías (RF-CAT-02 a RF-CAT-04, RN-04).
import { COLORES_CATEGORIA, type Categoria } from '../../domain/modelo';
import { MENSAJES } from '../../domain/mensajes';
import type { CampoCategoria } from '../../domain/validacionCategoria';
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarRespuesta } from '../avisos';
import { boton } from '../componentes/boton';
import { pildoraCategoria } from '../componentes/etiquetas';
import { abrirDialogo, confirmar } from '../dialogo';
import { el, idUnico } from '../dom';
import { campoEntrada, campoSelector, grupoDeCampos, marcarError, mostrarErrores, type CampoFormulario } from '../formulario';
import { cantidadDeTareas, NOMBRE_COLOR } from '../textos';

function formularioCategoria(aplicacion: Aplicacion, categoria: Categoria | null, alGuardar: () => void): HTMLFormElement {
  const nombre = campoEntrada('Nombre', { type: 'text', value: categoria?.nombre ?? '', placeholder: 'Ej. Proyectos' });
  const grupoColor = idUnico('color');
  const colorElegido = categoria?.color ?? 'azul';
  // RF-CAT-04: solo la paleta COLORES_CATEGORIA.
  const color = grupoDeCampos(
    'Color',
    COLORES_CATEGORIA.map((valor) =>
      el(
        'label',
        { clase: 'muestra-color' },
        el('input', {
          atributos: { type: 'radio', name: grupoColor, value: valor, checked: valor === colorElegido, 'aria-label': NOMBRE_COLOR[valor] },
        }),
        el('span', { clase: `muestra-color__circulo pildora--${valor}` }),
      ),
    ),
    'grupo--colores',
  );
  const campos: Record<CampoCategoria, CampoFormulario> = { nombre, color };

  const formulario = el(
    'form',
    { clase: 'formulario', atributos: { novalidate: true } },
    nombre.contenedor,
    color.contenedor,
    el('div', { clase: 'acciones' }, boton('Guardar', { variante: 'primario', tipo: 'submit' })),
  );
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const elegido = formulario.querySelector<HTMLInputElement>(`input[name="${grupoColor}"]:checked`)?.value ?? '';
    const respuesta = aplicacion.guardarCategoria({ nombre: nombre.control.value, color: elegido }, categoria?.id ?? null);
    if (respuesta.tipo === 'invalido') {
      mostrarErrores(campos, respuesta.errores, ['nombre', 'color']);
      return;
    }
    mostrarRespuesta(respuesta);
    if (respuesta.tipo === 'ok') alGuardar();
  });
  return formulario;
}

/** RN-04: con tareas, primero se elige a qué categoría moverlas. */
function eliminarCategoria(aplicacion: Aplicacion, categoria: Categoria): void {
  const { tareas, categorias } = aplicacion.obtenerEstado();
  const cantidad = tareas.filter((tarea) => tarea.categoriaId === categoria.id).length;

  if (cantidad === 0) {
    void confirmar('Eliminar categoría', `¿Eliminar «${categoria.nombre}»?`, 'Eliminar').then((aceptado) => {
      if (aceptado) mostrarRespuesta(aplicacion.eliminarCategoria(categoria.id, null));
    });
    return;
  }

  abrirDialogo(`Eliminar «${categoria.nombre}»`, (cerrar) => {
    const destino = campoSelector(
      'Mover tareas a',
      [
        { valor: '', texto: 'Elija una categoría' },
        ...categorias.filter((otra) => otra.id !== categoria.id).map((otra) => ({ valor: otra.id, texto: otra.nombre })),
      ],
      '',
    );
    const formulario = el(
      'form',
      { clase: 'formulario', atributos: { novalidate: true } },
      el('p', { clase: 'dialogo__mensaje' }, `Esta categoría tiene ${cantidadDeTareas(cantidad)}. Elija a qué categoría moverlas antes de eliminarla.`),
      destino.contenedor,
      el(
        'div',
        { clase: 'acciones' },
        boton('Cancelar', { variante: 'fantasma', alHacerClic: cerrar }),
        boton('Mover y eliminar', { variante: 'peligro', tipo: 'submit' }),
      ),
    );
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const respuesta = aplicacion.eliminarCategoria(categoria.id, destino.control.value || null);
      if (respuesta.tipo === 'invalido' && respuesta.errores.destino !== undefined) {
        marcarError(destino, respuesta.errores.destino);
        destino.control.focus();
        return;
      }
      cerrar();
      mostrarRespuesta(respuesta);
    });
    return [formulario];
  });
}

export function pantallaCategorias(aplicacion: Aplicacion): HTMLElement {
  const { categorias, tareas } = aplicacion.obtenerEstado();
  const esLaUnica = categorias.length === 1;

  const filas = categorias.map((categoria) =>
    el(
      'li',
      { clase: 'lista-simple__fila' },
      el(
        'div',
        { clase: 'lista-simple__texto lista-simple__texto--en-linea' },
        pildoraCategoria(categoria),
        el('span', { clase: 'texto-tenue' }, cantidadDeTareas(tareas.filter((tarea) => tarea.categoriaId === categoria.id).length)),
      ),
      el(
        'div',
        { clase: 'acciones acciones--compactas' },
        boton('Editar', {
          alHacerClic: () => abrirDialogo('Editar categoría', (cerrar) => [formularioCategoria(aplicacion, categoria, cerrar)]),
        }),
        // RF-CAT-03: con una sola categoría la acción queda deshabilitada.
        boton('Eliminar', {
          variante: 'peligro',
          deshabilitado: esLaUnica,
          alHacerClic: () => eliminarCategoria(aplicacion, categoria),
        }),
      ),
    ),
  );

  return el(
    'main',
    { clase: 'pantalla pantalla--seccion' },
    el('h1', { clase: 'titulo-grande' }, 'Categorías'),
    el(
      'div',
      { clase: 'dos-columnas' },
      el(
        'section',
        { atributos: { 'aria-label': 'Lista de categorías' } },
        el('ul', { clase: 'lista-simple lista-simple--subrayada' }, ...filas),
        esLaUnica ? el('p', { clase: 'texto-tenue' }, MENSAJES.unaCategoriaComoMinimo) : null,
      ),
      el(
        'section',
        { clase: 'tarjeta', atributos: { 'aria-labelledby': 'nueva-categoria' } },
        el('h2', { clase: 'subtitulo', atributos: { id: 'nueva-categoria' } }, 'Nueva categoría'),
        formularioCategoria(aplicacion, null, () => {}),
      ),
    ),
  );
}
