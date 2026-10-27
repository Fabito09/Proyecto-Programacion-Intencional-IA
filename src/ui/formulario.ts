// Campos de formulario con su mensaje de error en línea (glosario) y foco en el primer error (RF-UI-03).
import type { ErroresDeCampo } from '../domain/resultado';
import { el, idUnico, type Hijo } from './dom';

type ValorAtributo = string | number | boolean | null | undefined;

export interface CampoFormulario {
  contenedor: HTMLElement;
  /** Recibe el foco cuando el campo tiene el primer error. */
  enfocable: HTMLElement;
  error: HTMLElement;
}

export interface CampoDeControl<Control extends HTMLElement> extends CampoFormulario {
  control: Control;
}

export function marcarError(campo: CampoFormulario, mensaje: string | undefined): void {
  campo.error.textContent = mensaje ?? '';
  campo.error.hidden = mensaje === undefined;
  campo.contenedor.classList.toggle('tiene-error', mensaje !== undefined);
  campo.enfocable.setAttribute('aria-invalid', String(mensaje !== undefined));
}

/** Glosario: el mensaje desaparece cuando el campo se corrige. */
function limpiarAlCorregir<Campo extends CampoFormulario>(campo: Campo): Campo {
  const limpiar = () => marcarError(campo, undefined);
  campo.contenedor.addEventListener('input', limpiar);
  campo.contenedor.addEventListener('change', limpiar);
  return campo;
}

function mensajeDeError(): HTMLParagraphElement {
  return el('p', { clase: 'campo__error', atributos: { id: idUnico('error'), hidden: true } });
}

function campoConControl<Control extends HTMLElement>(etiqueta: string, control: Control, error: HTMLElement): CampoDeControl<Control> {
  const contenedor = el(
    'div',
    { clase: 'campo' },
    el('label', { clase: 'campo__etiqueta', atributos: { for: control.id } }, etiqueta),
    control,
    error,
  );
  return limpiarAlCorregir({ contenedor, enfocable: control, error, control });
}

export function campoEntrada(etiqueta: string, atributos: Record<string, ValorAtributo>): CampoDeControl<HTMLInputElement> {
  const error = mensajeDeError();
  const control = el('input', {
    clase: 'campo__control',
    atributos: { id: idUnico('campo'), 'aria-describedby': error.id, ...atributos },
  });
  return campoConControl(etiqueta, control, error);
}

export interface Opcion {
  valor: string;
  texto: string;
}

export function campoSelector(etiqueta: string, opciones: Opcion[], seleccionado: string): CampoDeControl<HTMLSelectElement> {
  const error = mensajeDeError();
  const control = el(
    'select',
    { clase: 'campo__control', atributos: { id: idUnico('campo'), 'aria-describedby': error.id } },
    ...opciones.map((opcion) =>
      el('option', { atributos: { value: opcion.valor, selected: opcion.valor === seleccionado } }, opcion.texto),
    ),
  );
  return campoConControl(etiqueta, control, error);
}

export function campoAreaDeTexto(etiqueta: string, valor: string): CampoDeControl<HTMLTextAreaElement> {
  const error = mensajeDeError();
  const control = el(
    'textarea',
    { clase: 'campo__control', atributos: { id: idUnico('campo'), rows: 3, 'aria-describedby': error.id } },
    valor,
  );
  return campoConControl(etiqueta, control, error);
}

/** Un grupo de controles bajo una leyenda: días, prioridad, meta, color. */
export function grupoDeCampos(leyenda: string, controles: Hijo[], claseExtra = ''): CampoFormulario {
  const error = mensajeDeError();
  const contenedor = el(
    'fieldset',
    { clase: `campo grupo ${claseExtra}`.trim(), atributos: { 'aria-describedby': error.id } },
    el('legend', { clase: 'campo__etiqueta' }, leyenda),
    el('div', { clase: 'grupo__controles' }, ...controles),
    error,
  );
  const enfocable = contenedor.querySelector<HTMLElement>('input, select, textarea') ?? contenedor;
  return limpiarAlCorregir({ contenedor, enfocable, error });
}

export interface CampoHora extends CampoFormulario {
  /** "HH:MM", o '' si falta la hora o los minutos. */
  leer(): string;
}

function opcionesNumericas(cantidad: number, seleccionado: string, textoVacio: string): HTMLOptionElement[] {
  const numeros = Array.from({ length: cantidad }, (_, numero) => String(numero).padStart(2, '0'));
  return [
    el('option', { atributos: { value: '', selected: seleccionado === '' } }, textoVacio),
    ...numeros.map((valor) => el('option', { atributos: { value: valor, selected: valor === seleccionado } }, valor)),
  ];
}

/**
 * RF-UI-07: hora con dos listas finitas (00–23 y 00–59) en lugar del selector circular
 * del navegador. textoVacio es lo que muestra la opción sin hora ("Ninguno" en recordatorios).
 */
export function campoHora(etiqueta: string, valor: string, textoVacio = '--'): CampoHora {
  const horaInicial = valor.slice(0, 2);
  const minutoInicial = valor.slice(3, 5);
  const horas = el(
    'select',
    { clase: 'campo__control campo__control--hora', atributos: { 'aria-label': `${etiqueta}: horas` } },
    ...opcionesNumericas(24, horaInicial, textoVacio),
  );
  const minutos = el(
    'select',
    { clase: 'campo__control campo__control--hora', atributos: { 'aria-label': `${etiqueta}: minutos` } },
    ...opcionesNumericas(60, minutoInicial, '--'),
  );
  horas.addEventListener('change', () => {
    if (horas.value === '') minutos.value = '';
    else if (minutos.value === '') minutos.value = '00';
  });

  const campo = grupoDeCampos(
    etiqueta,
    [horas, el('span', { clase: 'campo-hora__separador', atributos: { 'aria-hidden': 'true' } }, ':'), minutos],
    'grupo--hora',
  );
  return { ...campo, leer: () => (horas.value === '' || minutos.value === '' ? '' : `${horas.value}:${minutos.value}`) };
}

/** Muestra los errores devueltos por el dominio y enfoca el primero según el orden visual (RF-UI-03). */
export function mostrarErrores<Campo extends string>(
  campos: Record<Campo, CampoFormulario>,
  errores: ErroresDeCampo<Campo>,
  orden: readonly Campo[],
): void {
  let primerCampoConError: CampoFormulario | null = null;
  for (const nombre of orden) {
    const mensaje = errores[nombre];
    marcarError(campos[nombre], mensaje);
    if (mensaje !== undefined && primerCampoConError === null) primerCampoConError = campos[nombre];
  }
  primerCampoConError?.enfocable.focus();
}
