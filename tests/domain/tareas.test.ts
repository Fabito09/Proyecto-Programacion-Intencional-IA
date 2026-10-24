import { describe, expect, it } from 'vitest';
import {
  agruparPorSuperposicion,
  alertaDe,
  seSuperponen,
  sumaDeMetasAbiertas,
  tareaPrincipal,
  tareasQueSeSuperponen,
} from '../../src/domain/tareas';
import { AHORA, HOY, unaTarea } from '../fabricas';

describe('superposiciones (RN-07, RN-08)', () => {
  it('CB-13: una tarea 9:00–10:00 choca con otra 9:30–11:00 (RN-07)', () => {
    const nueva = unaTarea({ horaInicio: '09:00', metaMinutos: 60 });
    const existente = unaTarea({ horaInicio: '09:30', metaMinutos: 90 });
    expect(tareasQueSeSuperponen(nueva, [nueva, existente])).toEqual([existente]);
  });

  it('RN-07: las tareas completadas no cuentan como choque', () => {
    const nueva = unaTarea({ horaInicio: '09:00', metaMinutos: 60 });
    const completada = unaTarea({ horaInicio: '09:30', metaMinutos: 30, estado: 'completada' });
    expect(tareasQueSeSuperponen(nueva, [completada])).toEqual([]);
  });

  it('CB-14: tres tareas superpuestas forman un solo grupo encabezado por la de mayor prioridad (RN-08)', () => {
    const llamada = unaTarea({ prioridad: 'alta', horaInicio: '09:00', metaMinutos: 120 });
    const contrato = unaTarea({ prioridad: 'media', horaInicio: '09:30', metaMinutos: 30 });
    const crm = unaTarea({ prioridad: 'baja', horaInicio: '10:00', metaMinutos: 30 });
    const grupos = agruparPorSuperposicion([crm, contrato, llamada]);
    expect(grupos).toHaveLength(1);
    expect(tareaPrincipal(grupos[0] ?? [])).toBe(llamada);
  });

  it('RN-08: con igual prioridad, representa al grupo la que empieza antes', () => {
    const temprana = unaTarea({ prioridad: 'alta', horaInicio: '09:00' });
    const tardia = unaTarea({ prioridad: 'alta', horaInicio: '09:30' });
    expect(tareaPrincipal([tardia, temprana])).toBe(temprana);
  });

  it('CB-15: 9:00–10:00 y 10:00–11:00 no se superponen (RN-08)', () => {
    const primera = unaTarea({ horaInicio: '09:00', metaMinutos: 60 });
    const segunda = unaTarea({ horaInicio: '10:00', metaMinutos: 60 });
    expect(seSuperponen(primera, segunda)).toBe(false);
    expect(agruparPorSuperposicion([primera, segunda])).toHaveLength(2);
  });

  it('RN-08: agrupa en cadena tareas conectadas por superposición', () => {
    const a = unaTarea({ horaInicio: '09:00', metaMinutos: 60 });
    const b = unaTarea({ horaInicio: '09:45', metaMinutos: 45 });
    const c = unaTarea({ horaInicio: '10:15', metaMinutos: 45 });
    expect(agruparPorSuperposicion([a, b, c])).toEqual([[a, b, c]]);
  });

  it('las tareas de días distintos nunca se superponen', () => {
    const hoy = unaTarea({ horaInicio: '09:00' });
    const manana = unaTarea({ horaInicio: '09:00', fecha: '2026-10-24' });
    expect(seSuperponen(hoy, manana)).toBe(false);
  });
});

describe('señalización por vencer y vencida (RN-06)', () => {
  it('CB-36: una tarea abierta de mañana está por vencer', () => {
    expect(alertaDe(unaTarea({ fecha: '2026-10-24' }), AHORA)).toBe('por_vencer');
  });

  it('CB-37: una tarea de hoy 8:00–9:00 está vencida a las 9:22 y conserva su estado (RF-TAR-12)', () => {
    const tarea = unaTarea({ horaInicio: '08:00', metaMinutos: 60 });
    expect(alertaDe(tarea, AHORA)).toBe('vencida');
    expect(tarea.estado).toBe('pendiente');
  });

  it('CB-38: una tarea completada cuyo horario pasó no lleva alerta', () => {
    expect(alertaDe(unaTarea({ horaInicio: '08:00', estado: 'completada' }), AHORA)).toBeNull();
  });

  it('una tarea de la semana próxima no lleva alerta', () => {
    expect(alertaDe(unaTarea({ fecha: '2026-10-28' }), AHORA)).toBeNull();
  });
});

describe('RF-CAL-08: suma de metas', () => {
  it('suma solo las tareas abiertas del día', () => {
    const tareas = [
      unaTarea({ metaMinutos: 120 }),
      unaTarea({ metaMinutos: 45 }),
      unaTarea({ metaMinutos: 30, estado: 'completada' }),
      unaTarea({ metaMinutos: 60, fecha: '2026-10-22' }),
    ];
    expect(sumaDeMetasAbiertas(tareas, HOY)).toBe(165);
  });
});
