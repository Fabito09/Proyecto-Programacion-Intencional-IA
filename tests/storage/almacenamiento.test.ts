import { describe, expect, it } from 'vitest';
import { crearEstadoInicial } from '../../src/domain/estadoInicial';
import { CLAVE_ALMACENAMIENTO } from '../../src/domain/modelo';
import { guardarEstado, leerEstado } from '../../src/storage/almacenamiento';
import { AlmacenEnMemoria } from '../almacenEnMemoria';
import { AHORA, HORARIO_LV_8_17, instante, unaTarea } from '../fabricas';

function estadoDePrueba() {
  const estado = crearEstadoInicial('Ana', HORARIO_LV_8_17, AHORA, () => 'cat-general');
  return { ...estado, tareas: [unaTarea()] };
}

function almacenCon(contenido: string): AlmacenEnMemoria {
  const almacen = new AlmacenEnMemoria();
  almacen.datos.set(CLAVE_ALMACENAMIENTO, contenido);
  return almacen;
}

describe('almacenamiento (RF-PER)', () => {
  it('RF-PER-02: sin clave guardada no hay datos', () => {
    expect(leerEstado(new AlmacenEnMemoria())).toEqual({ tipo: 'sin_datos' });
  });

  it('RF-PER-05: lo guardado se lee exactamente igual', () => {
    const almacen = new AlmacenEnMemoria();
    const estado = estadoDePrueba();
    expect(guardarEstado(almacen, estado)).toBe(true);
    expect(leerEstado(almacen)).toEqual({ tipo: 'ok', estado });
  });

  it('CB-39: un JSON corrupto se informa como ilegible sin tocar lo guardado (RF-PER-03)', () => {
    const almacen = almacenCon('{"version":1,');
    expect(leerEstado(almacen)).toEqual({ tipo: 'ilegible' });
    expect(almacen.datos.get(CLAVE_ALMACENAMIENTO)).toBe('{"version":1,');
  });

  it('CB-39: dos cronómetros corriendo a la vez son datos ilegibles (RF-PER-03)', () => {
    const estado = estadoDePrueba();
    const corriendo = { cronometroIniciadoEn: instante(23, 9) };
    const conDos = { ...estado, tareas: [unaTarea(corriendo), unaTarea(corriendo)] };
    expect(leerEstado(almacenCon(JSON.stringify(conDos)))).toEqual({ tipo: 'ilegible' });
  });

  it('RF-PER-03: rechaza otra versión o una tarea con categoría inexistente', () => {
    const estado = estadoDePrueba();
    expect(leerEstado(almacenCon(JSON.stringify({ ...estado, version: 2 })))).toEqual({ tipo: 'ilegible' });
    const huerfana = { ...estado, tareas: [unaTarea({ categoriaId: 'no-existe' })] };
    expect(leerEstado(almacenCon(JSON.stringify(huerfana)))).toEqual({ tipo: 'ilegible' });
  });

  it('CB-40: devuelve false si LocalStorage está lleno (RF-PER-04)', () => {
    const almacen = new AlmacenEnMemoria();
    almacen.fallarAlGuardar = true;
    expect(guardarEstado(almacen, estadoDePrueba())).toBe(false);
  });
});
