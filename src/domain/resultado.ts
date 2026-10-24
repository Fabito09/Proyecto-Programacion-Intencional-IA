// Resultado tipado de una validación: los errores de usuario no lanzan excepciones.

/** Mensaje de error por campo del formulario. */
export type ErroresDeCampo<Campo extends string> = Partial<Record<Campo, string>>;

export type Resultado<Valor, Campo extends string> =
  | { ok: true; valor: Valor }
  | { ok: false; errores: ErroresDeCampo<Campo> };

export function exito<Valor>(valor: Valor): { ok: true; valor: Valor } {
  return { ok: true, valor };
}

export function fallo<Campo extends string>(errores: ErroresDeCampo<Campo>): { ok: false; errores: ErroresDeCampo<Campo> } {
  return { ok: false, errores };
}

export function tieneErrores<Campo extends string>(errores: ErroresDeCampo<Campo>): boolean {
  return Object.keys(errores).length > 0;
}
