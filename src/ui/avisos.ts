// Avisos breves (informativos o de error) que no bloquean la pantalla.
import { MENSAJES } from '../domain/mensajes';
import type { Respuesta } from '../services/aplicacion';
import { botonIcono } from './componentes/boton';
import { el } from './dom';

export type TipoAviso = 'info' | 'error' | 'resumen';

/** RF-TAR-08: "Tarea guardada" dura 3 s; RN-07 y el resto de los avisos, 5 s. */
const DURACION_TAREA_GUARDADA = 3000;
const DURACION_AVISO = 5000;

let contenedor: HTMLElement | null = null;

function contenedorDeAvisos(): HTMLElement {
  if (contenedor === null) {
    contenedor = el('div', { clase: 'avisos', atributos: { role: 'status', 'aria-live': 'polite' } });
    document.body.append(contenedor);
  }
  return contenedor;
}

/** duracion null = queda hasta que el usuario lo cierre. */
export function mostrarAviso(texto: string, tipo: TipoAviso = 'info', duracion: number | null = DURACION_AVISO): void {
  const aviso = el('div', { clase: `aviso aviso--${tipo}` });
  const cerrar = () => aviso.remove();
  aviso.append(el('p', { clase: 'aviso__texto' }, texto), botonIcono('cerrar', 'Cerrar aviso', cerrar));
  contenedorDeAvisos().append(aviso);
  if (duracion !== null) window.setTimeout(cerrar, duracion);
}

export function mostrarAvisos(avisos: string[]): void {
  for (const aviso of avisos) {
    mostrarAviso(aviso, 'info', aviso === MENSAJES.tareaGuardada ? DURACION_TAREA_GUARDADA : DURACION_AVISO);
  }
}

/** Traduce la respuesta de un caso de uso a avisos: informativos si salió bien, de error si no. */
export function mostrarRespuesta(respuesta: Respuesta<string>): void {
  if (respuesta.tipo === 'ok') mostrarAvisos(respuesta.avisos);
  else if (respuesta.tipo === 'sin_guardar') mostrarAviso(respuesta.mensaje, 'error');
  else Object.values(respuesta.errores).forEach((mensaje) => mensaje && mostrarAviso(mensaje, 'error'));
}
