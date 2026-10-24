// Primer uso en tres pasos: nombre y horario → tareas → recordatorios (RF-INI).
import { MENSAJES } from '../../domain/mensajes';
import { fechaLocal, formatearDuracion } from '../../domain/tiempo';
import type { CampoHorario } from '../../domain/validacionPreferencias';
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarAviso, mostrarRespuesta } from '../avisos';
import { boton } from '../componentes/boton';
import { camposHorario } from '../componentes/camposHorario';
import { camposRecordatorios } from '../componentes/camposRecordatorios';
import { pildoraCategoria } from '../componentes/etiquetas';
import { formularioTarea } from '../componentes/formularioTarea';
import { progresoPrimerUso } from '../componentes/progreso';
import { el } from '../dom';
import { campoEntrada, mostrarErrores, type CampoFormulario } from '../formulario';
import { prepararNotificaciones } from '../notificaciones';
import { fechaCorta, rangoDeTarea, resumenDeHorario } from '../textos';

const ORDEN_BIENVENIDA: readonly ('nombre' | CampoHorario)[] = ['nombre', 'dias', 'entrada', 'salida'];

/** RF-INI-01 a RF-INI-04 */
export function pantallaBienvenida(aplicacion: Aplicacion): HTMLElement {
  const nombre = campoEntrada('Ingrese su nombre', {
    type: 'text',
    placeholder: 'Su nombre',
    autocomplete: 'given-name',
    autofocus: true,
  });
  nombre.contenedor.classList.add('campo--grande');
  const horario = camposHorario('¿Cuál es su horario de trabajo?', null);
  const campos: Record<'nombre' | CampoHorario, CampoFormulario> = { nombre, ...horario.campos };

  const formulario = el(
    'form',
    { clase: 'formulario', atributos: { novalidate: true } },
    progresoPrimerUso(1),
    el('h1', { clase: 'titulo-grande' }, 'Do It'),
    el('p', { clase: 'texto-suave' }, 'Organice sus tareas de trabajo por hora, día y semana.'),
    nombre.contenedor,
    horario.contenedor,
    el('div', { clase: 'acciones' }, boton('Continuar', { variante: 'primario', tipo: 'submit' })),
  );
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const respuesta = aplicacion.confirmarBienvenida(nombre.control.value, horario.leer());
    if (respuesta.tipo === 'invalido') mostrarErrores(campos, respuesta.errores, ORDEN_BIENVENIDA);
    else mostrarRespuesta(respuesta);
  });
  return el('main', { clase: 'pantalla pantalla--centrada' }, formulario);
}

/** RF-INI-05 y RF-INI-06 */
export function pantallaAgregarTareas(aplicacion: Aplicacion): HTMLElement {
  const { tareas, categorias, preferencias } = aplicacion.obtenerEstado();
  const hoy = fechaLocal(aplicacion.ahora());
  const terminar = () => mostrarRespuesta(aplicacion.terminarPasoDeTareas());

  const lista =
    tareas.length === 0
      ? el('p', { clase: 'texto-tenue' }, 'Todavía no agregó tareas.')
      : el(
          'ul',
          { clase: 'lista-simple' },
          ...[...tareas]
            .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))
            .map((tarea) =>
              el(
                'li',
                { clase: 'lista-simple__fila' },
                el(
                  'div',
                  { clase: 'lista-simple__texto' },
                  el('span', { clase: 'lista-simple__titulo' }, tarea.titulo),
                  el(
                    'span',
                    { clase: 'texto-tenue' },
                    `${fechaCorta(tarea.fecha)} · ${rangoDeTarea(tarea)} · Meta ${formatearDuracion(tarea.metaMinutos)}`,
                  ),
                ),
                pildoraCategoria(categorias.find((categoria) => categoria.id === tarea.categoriaId)),
              ),
            ),
        );

  return el(
    'main',
    { clase: 'pantalla' },
    el(
      'div',
      { clase: 'pantalla__ancha' },
      progresoPrimerUso(2),
      el('h1', { clase: 'titulo-grande' }, 'Agregue sus tareas'),
      el('p', { clase: 'texto-suave' }, `Su horario: ${resumenDeHorario(preferencias.horarioTrabajo)}. Puede agregar más tareas después.`),
      el(
        'div',
        { clase: 'dos-columnas' },
        formularioTarea({ aplicacion, tarea: null, fecha: hoy, hora: '', textoBoton: 'Agregar tarea', alGuardar: () => {} }),
        el(
          'section',
          { clase: 'panel-lista', atributos: { 'aria-labelledby': 'tareas-agregadas' } },
          el('h2', { clase: 'subtitulo subtitulo--subrayado', atributos: { id: 'tareas-agregadas' } }, `Tareas agregadas (${tareas.length})`),
          lista,
        ),
      ),
      el(
        'div',
        { clase: 'acciones acciones--pie' },
        boton('Lo hago después', { variante: 'fantasma', alHacerClic: terminar }),
        boton('Continuar', { variante: 'primario', alHacerClic: terminar }),
      ),
    ),
  );
}

/** RF-INI-06 y RF-INI-07 */
export function pantallaRecordatoriosPrimerUso(aplicacion: Aplicacion): HTMLElement {
  const antes = aplicacion.obtenerEstado().preferencias.recordatorios;
  const recordatorios = camposRecordatorios(antes);

  const formulario = el(
    'form',
    { clase: 'formulario', atributos: { novalidate: true } },
    progresoPrimerUso(3),
    el('h1', { clase: 'titulo-grande' }, '¿A qué hora quiere recibir sus recordatorios?'),
    el('p', { clase: 'texto-suave' }, 'Cada recordatorio es un solo resumen de sus tareas del día.'),
    recordatorios.contenedor,
    el('div', { clase: 'acciones' }, boton('Terminar', { variante: 'primario', tipo: 'submit' })),
  );
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const respuesta = aplicacion.guardarRecordatorios(recordatorios.leer());
    if (respuesta.tipo === 'invalido') {
      mostrarErrores(recordatorios.campos, respuesta.errores, ['principal', 'secundario']);
      return;
    }
    if (respuesta.tipo === 'sin_guardar') {
      mostrarAviso(respuesta.mensaje, 'error');
      return;
    }
    prepararNotificaciones(antes, aplicacion.obtenerEstado().preferencias.recordatorios);
  });
  return el('main', { clase: 'pantalla pantalla--centrada' }, formulario);
}

/** RF-PER-03: los datos no se tocan hasta que el usuario confirme "Restablecer datos". */
export function pantallaDatosIlegibles(alRestablecer: () => void): HTMLElement {
  return el(
    'main',
    { clase: 'pantalla pantalla--centrada' },
    el(
      'div',
      { clase: 'formulario' },
      el('h1', { clase: 'titulo-grande' }, MENSAJES.datosIlegibles),
      el('div', { clase: 'acciones' }, boton('Restablecer datos', { variante: 'peligro', alHacerClic: alRestablecer })),
    ),
  );
}
