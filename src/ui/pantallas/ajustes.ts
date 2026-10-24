// Sección Ajustes: nombre, horario de trabajo y recordatorios (RF-AJU).
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarAviso, mostrarRespuesta } from '../avisos';
import { boton } from '../componentes/boton';
import { camposHorario } from '../componentes/camposHorario';
import { camposRecordatorios } from '../componentes/camposRecordatorios';
import { el, type Hijo } from '../dom';
import { campoEntrada, mostrarErrores } from '../formulario';
import { prepararNotificaciones } from '../notificaciones';

function seccion(titulo: string, contenido: Hijo[], alEnviar: () => void): HTMLFormElement {
  const formulario = el(
    'form',
    { clase: 'formulario seccion-ajustes', atributos: { novalidate: true } },
    el('h2', { clase: 'subtitulo subtitulo--subrayado' }, titulo),
    ...contenido,
    el('div', { clase: 'acciones' }, boton('Guardar', { variante: 'primario', tipo: 'submit' })),
  );
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    alEnviar();
  });
  return formulario;
}

export function pantallaAjustes(aplicacion: Aplicacion): HTMLElement {
  const { preferencias } = aplicacion.obtenerEstado();

  const nombre = campoEntrada('Nombre', { type: 'text', value: preferencias.nombreUsuario, autocomplete: 'given-name' });
  const formularioNombre = seccion('Su nombre', [nombre.contenedor], () => {
    const respuesta = aplicacion.guardarNombre(nombre.control.value);
    if (respuesta.tipo === 'invalido') mostrarErrores({ nombre }, respuesta.errores, ['nombre']);
    else mostrarRespuesta(respuesta);
  });

  const horario = camposHorario('Días y horas', preferencias.horarioTrabajo);
  const formularioHorario = seccion('Horario de trabajo', [horario.contenedor], () => {
    const respuesta = aplicacion.guardarHorario(horario.leer());
    if (respuesta.tipo === 'invalido') mostrarErrores(horario.campos, respuesta.errores, ['dias', 'entrada', 'salida']);
    else mostrarRespuesta(respuesta);
  });

  const antes = preferencias.recordatorios;
  const recordatorios = camposRecordatorios(antes);
  const formularioRecordatorios = seccion('Recordatorios', [recordatorios.contenedor], () => {
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

  return el(
    'main',
    { clase: 'pantalla pantalla--seccion' },
    el(
      'div',
      { clase: 'pantalla__angosta' },
      el('h1', { clase: 'titulo-grande' }, 'Ajustes'),
      formularioNombre,
      formularioHorario,
      formularioRecordatorios,
    ),
  );
}
