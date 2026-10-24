import type { Almacen } from '../src/storage/almacenamiento';

/** Sustituto de LocalStorage para las pruebas; puede simular que el espacio se llenó. */
export class AlmacenEnMemoria implements Almacen {
  readonly datos = new Map<string, string>();
  fallarAlGuardar = false;

  getItem(clave: string): string | null {
    return this.datos.get(clave) ?? null;
  }

  setItem(clave: string, valor: string): void {
    if (this.fallarAlGuardar) throw new Error('QuotaExceededError');
    this.datos.set(clave, valor);
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }
}
