// Lectura y escritura del estado completo en LocalStorage (RF-PER).
import { CLAVE_ALMACENAMIENTO, type EstadoPersistido } from '../domain/modelo';
import { esEstadoValido } from './validarEstadoGuardado';

/** Lo que se usa de Storage, para poder probarlo sin navegador. */
export type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type Lectura =
  | { tipo: 'sin_datos' }
  | { tipo: 'ok'; estado: EstadoPersistido }
  | { tipo: 'ilegible' };

/** RF-PER-02, RF-PER-03: nunca modifica lo guardado, solo lo lee. */
export function leerEstado(almacen: Almacen): Lectura {
  let texto: string | null;
  let valor: unknown;
  try {
    texto = almacen.getItem(CLAVE_ALMACENAMIENTO);
    if (texto === null) return { tipo: 'sin_datos' };
    valor = JSON.parse(texto);
  } catch {
    return { tipo: 'ilegible' };
  }
  return esEstadoValido(valor) ? { tipo: 'ok', estado: valor } : { tipo: 'ilegible' };
}

/** RF-PER-01, RF-PER-04: devuelve false si LocalStorage rechazó la escritura. */
export function guardarEstado(almacen: Almacen, estado: EstadoPersistido): boolean {
  try {
    almacen.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/** RF-PER-03: "Restablecer datos". La interfaz pide la confirmación antes de llamarla. */
export function borrarEstado(almacen: Almacen): void {
  almacen.removeItem(CLAVE_ALMACENAMIENTO);
}
