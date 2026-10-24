import { describe, expect, it } from 'vitest';
import { sugerirMeta } from '../../src/domain/sugerencias';
import { instante, unaTarea } from '../fabricas';

function completada(titulo: string, minutosMedidos: number, diaCompletada: number) {
  return unaTarea({
    titulo,
    estado: 'completada',
    segundosMedidos: minutosMedidos * 60,
    completadaEn: instante(diaCompletada, 12),
  });
}

describe('sugerirMeta (RN-12)', () => {
  it('CB-21: promedia 1:10, 1:20 y 1:30 y sugiere 1 h 20 min', () => {
    const tareas = [
      completada('Informe semanal', 70, 2),
      completada('Informe semanal', 80, 9),
      completada('Informe semanal', 90, 16),
    ];
    expect(sugerirMeta('Informe semanal', tareas)).toEqual({ minutos: 80, veces: 3 });
  });

  it('usa solo las últimas 3 veces', () => {
    const tareas = [
      completada('Informe semanal', 600, 1),
      completada('Informe semanal', 60, 8),
      completada('Informe semanal', 60, 15),
      completada('Informe semanal', 60, 22),
    ];
    expect(sugerirMeta('Informe semanal', tareas)).toEqual({ minutos: 60, veces: 3 });
  });

  it('CB-22: no cuenta tareas completadas sin usar el cronómetro', () => {
    expect(sugerirMeta('Informe semanal', [completada('Informe semanal', 0, 9)])).toBeNull();
  });

  it('reconoce el título normalizado', () => {
    expect(sugerirMeta('  informe SEMANAL ', [completada('Informe semanal', 45, 9)])).toEqual({ minutos: 45, veces: 1 });
  });

  it('no cuenta tareas abiertas ni títulos distintos', () => {
    const tareas = [
      unaTarea({ titulo: 'Informe semanal', segundosMedidos: 3600 }),
      completada('Informe mensual', 30, 9),
    ];
    expect(sugerirMeta('Informe semanal', tareas)).toBeNull();
  });
});
