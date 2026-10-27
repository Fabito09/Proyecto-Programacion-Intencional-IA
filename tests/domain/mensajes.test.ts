import { describe, expect, it } from 'vitest';
import { MENSAJES } from '../../src/domain/mensajes';

describe('mensajes con singular y plural', () => {
  it('RN-12: meta sugerida con una o varias tareas anteriores', () => {
    expect(MENSAJES.metaSugerida(1, '45 min')).toBe('La última vez le tomó 45 min');
    expect(MENSAJES.metaSugerida(3, '1 h 20 min')).toBe('Las últimas 3 veces le tomó en promedio 1 h 20 min');
  });

  it('RF-AJU-03: tareas que quedan fuera del nuevo horario', () => {
    expect(MENSAJES.tareasFueraDeHorario(1)).toBe('1 tarea queda fuera de su nuevo horario. Ajústela cuando la edite.');
    expect(MENSAJES.tareasFueraDeHorario(4)).toBe('4 tareas quedan fuera de su nuevo horario. Ajústelas cuando las edite.');
  });
});
