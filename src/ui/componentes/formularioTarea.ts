// Formulario de tarea (RF-UI-02) con la meta sugerida para tareas repetidas (RN-12).
import { MENSAJES } from '../../domain/mensajes';
import { PRIORIDADES, type FechaISO, type HoraDelDia, type Tarea } from '../../domain/modelo';
import { sugerirMeta } from '../../domain/sugerencias';
import { formatearDuracion } from '../../domain/tiempo';
import type { BorradorTarea, CampoTarea } from '../../domain/validacionTarea';
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarAviso, mostrarAvisos } from '../avisos';
import { el, idUnico } from '../dom';
import { campoAreaDeTexto, campoEntrada, campoSelector, grupoDeCampos, mostrarErrores, type CampoFormulario } from '../formulario';
import { icono } from '../iconos';
import { NOMBRE_PRIORIDAD } from '../textos';
import { boton } from './boton';

/** Orden visual de RF-UI-02, usado para enfocar el primer error (RF-UI-03). */
const ORDEN_DE_CAMPOS: readonly CampoTarea[] = [
  'titulo',
  'fecha',
  'horaInicio',
  'meta',
  'prioridad',
  'categoriaId',
  'descripcion',
];

export interface OpcionesFormularioTarea {
  aplicacion: Aplicacion;
  /** null al crear. */
  tarea: Tarea | null;
  fecha: FechaISO;
  hora: HoraDelDia | '';
  textoBoton: string;
  alGuardar: () => void;
  alCancelar?: () => void;
}

function casillaDeMeta(etiqueta: string, valor: string): HTMLInputElement {
  return el('input', {
    clase: 'campo__control campo__control--corto',
    atributos: { type: 'text', inputmode: 'numeric', 'aria-label': etiqueta, value: valor, placeholder: '0' },
  });
}

export function formularioTarea(opciones: OpcionesFormularioTarea): HTMLFormElement {
  const { aplicacion, tarea } = opciones;
  const { categorias } = aplicacion.obtenerEstado();

  const titulo = campoEntrada('Título', {
    type: 'text',
    value: tarea?.titulo ?? '',
    placeholder: 'Ej. Preparar informe',
    autocomplete: 'off',
    autofocus: true,
  });
  const sugerencia = el('p', { clase: 'sugerencia', atributos: { role: 'status', hidden: true } });
  titulo.contenedor.append(sugerencia);

  const fecha = campoEntrada('Fecha', { type: 'date', value: tarea?.fecha ?? opciones.fecha });
  const horaInicio = campoEntrada('Hora de inicio', { type: 'time', value: tarea?.horaInicio ?? opciones.hora });

  const metaHoras = casillaDeMeta('Horas', tarea ? String(Math.floor(tarea.metaMinutos / 60)) : '');
  const metaMinutos = casillaDeMeta('Minutos', tarea ? String(tarea.metaMinutos % 60) : '');
  const meta = grupoDeCampos(
    '¿En cuánto tiempo se propone terminarla?',
    [el('label', { clase: 'unidad' }, metaHoras, 'h'), el('label', { clase: 'unidad' }, metaMinutos, 'min')],
    'grupo--en-linea',
  );

  const grupoPrioridad = idUnico('prioridad');
  const prioridad = grupoDeCampos(
    'Prioridad',
    PRIORIDADES.map((valor) =>
      el(
        'label',
        { clase: 'segmento' },
        el('input', {
          atributos: { type: 'radio', name: grupoPrioridad, value: valor, checked: (tarea?.prioridad ?? 'media') === valor },
        }),
        NOMBRE_PRIORIDAD[valor],
      ),
    ),
    'grupo--segmentado',
  );

  const categoriaId = campoSelector(
    'Categoría',
    [{ valor: '', texto: 'Elija una categoría' }, ...categorias.map((c) => ({ valor: c.id, texto: c.nombre }))],
    tarea?.categoriaId ?? categorias[0]?.id ?? '',
  );
  const descripcion = campoAreaDeTexto('Descripción (opcional)', tarea?.descripcion ?? '');

  const campos: Record<CampoTarea, CampoFormulario> = {
    titulo,
    fecha,
    horaInicio,
    meta,
    prioridad,
    categoriaId,
    descripcion,
  };

  // RN-12: solo en tareas nuevas y sin pisar una meta que el usuario ya escribió.
  let metaEscritaPorElUsuario = tarea !== null;
  meta.contenedor.addEventListener('input', () => {
    metaEscritaPorElUsuario = true;
  });
  if (tarea === null) {
    titulo.control.addEventListener('change', () => {
      const sugerida = sugerirMeta(titulo.control.value, aplicacion.obtenerEstado().tareas);
      sugerencia.hidden = sugerida === null;
      if (sugerida === null) return;
      sugerencia.replaceChildren(
        icono('reloj'),
        MENSAJES.metaSugerida(sugerida.veces, formatearDuracion(sugerida.minutos)),
      );
      if (!metaEscritaPorElUsuario) {
        metaHoras.value = String(Math.floor(sugerida.minutos / 60));
        metaMinutos.value = String(sugerida.minutos % 60);
      }
    });
  }

  const formulario = el(
    'form',
    { clase: 'formulario', atributos: { novalidate: true } },
    titulo.contenedor,
    el('div', { clase: 'fila-campos' }, fecha.contenedor, horaInicio.contenedor),
    meta.contenedor,
    el('div', { clase: 'fila-campos' }, prioridad.contenedor, categoriaId.contenedor),
    descripcion.contenedor,
    el(
      'div',
      { clase: 'acciones' },
      opciones.alCancelar ? boton('Cancelar', { variante: 'fantasma', alHacerClic: opciones.alCancelar }) : null,
      boton(opciones.textoBoton, { variante: 'primario', tipo: 'submit' }),
    ),
  );

  const leerBorrador = (): BorradorTarea => ({
    titulo: titulo.control.value,
    descripcion: descripcion.control.value,
    fecha: fecha.control.value,
    horaInicio: horaInicio.control.value,
    metaHoras: metaHoras.value,
    metaMinutos: metaMinutos.value,
    prioridad: formulario.querySelector<HTMLInputElement>(`input[name="${grupoPrioridad}"]:checked`)?.value ?? '',
    categoriaId: categoriaId.control.value,
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const respuesta = aplicacion.guardarTarea(leerBorrador(), tarea?.id ?? null);
    if (respuesta.tipo === 'invalido') {
      mostrarErrores(campos, respuesta.errores, ORDEN_DE_CAMPOS);
      return;
    }
    if (respuesta.tipo === 'sin_guardar') {
      mostrarAviso(respuesta.mensaje, 'error');
      return;
    }
    opciones.alGuardar();
    mostrarAvisos(respuesta.avisos);
  });

  return formulario;
}
