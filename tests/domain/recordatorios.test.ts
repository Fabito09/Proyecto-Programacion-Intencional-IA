import { describe, expect, it } from 'vitest';
import type { Preferencias } from '../../src/domain/modelo';
import {
  actualizarRecordatorios,
  evaluarRecordatorios,
  resumenDelDia,
  textoDelResumen,
} from '../../src/domain/recordatorios';
import { AHORA, HOY, unaTarea, unasPreferencias } from '../fabricas';

function conRecordatorios(
  principal: string | null,
  secundario: string | null,
  ultimoAviso: string | null = null,
): Preferencias {
  return unasPreferencias({
    recordatorios: {
      principal: { hora: principal, ultimoAviso },
      secundario: { hora: secundario, ultimoAviso },
    },
  });
}

describe('evaluarRecordatorios (RN-02, RN-03)', () => {
  it('CB-29: si no hay tareas para hoy ni vencidas no avisa ni toca ultimoAviso (RF-REC-02)', () => {
    const preferencias = conRecordatorios('08:00', null);
    const resultado = evaluarRecordatorios(preferencias, [], AHORA);
    expect(resultado.aviso).toBeNull();
    expect(resultado.preferencias).toBe(preferencias);
  });

  it('CB-30: dos franjas perdidas generan un solo aviso y quedan marcadas (RN-03)', () => {
    const resultado = evaluarRecordatorios(conRecordatorios('08:00', '09:00'), [unaTarea()], AHORA);
    expect(resultado.aviso).toEqual({ deHoy: 1, deAltaPrioridad: 0, vencidas: 0 });
    expect(resultado.preferencias.recordatorios.principal.ultimoAviso).toBe(HOY);
    expect(resultado.preferencias.recordatorios.secundario.ultimoAviso).toBe(HOY);
  });

  it('RN-02: no repite el aviso de una franja que ya avisó hoy', () => {
    expect(evaluarRecordatorios(conRecordatorios('08:00', null, HOY), [unaTarea()], AHORA).aviso).toBeNull();
  });

  it('RN-02: no avisa antes de la hora configurada', () => {
    expect(evaluarRecordatorios(conRecordatorios('17:00', null), [unaTarea()], AHORA).aviso).toBeNull();
  });

  it('CB-28: las franjas en "Ninguno" nunca avisan', () => {
    expect(evaluarRecordatorios(conRecordatorios(null, null), [unaTarea()], AHORA).aviso).toBeNull();
  });
});

describe('resumen del día', () => {
  it('una tarea vencida de hoy se cuenta solo como vencida', () => {
    const tareas = [
      unaTarea({ horaInicio: '08:00', metaMinutos: 60 }),
      unaTarea({ horaInicio: '13:00', prioridad: 'alta' }),
      unaTarea({ estado: 'completada' }),
    ];
    expect(resumenDelDia(tareas, AHORA)).toEqual({ deHoy: 1, deAltaPrioridad: 1, vencidas: 1 });
  });

  it.each([
    [{ deHoy: 4, deAltaPrioridad: 1, vencidas: 1 }, 'Tiene 4 tareas para hoy (1 de prioridad alta) y 1 vencida.'],
    [{ deHoy: 1, deAltaPrioridad: 0, vencidas: 0 }, 'Tiene 1 tarea para hoy.'],
    [{ deHoy: 0, deAltaPrioridad: 0, vencidas: 2 }, 'Tiene 2 tareas vencidas.'],
  ])('redacta el resumen %o', (resumen, texto) => {
    expect(textoDelResumen(resumen)).toBe(texto);
  });
});

describe('actualizarRecordatorios (RF-AJU-06)', () => {
  it('una nueva hora todavía no alcanzada puede volver a avisar hoy', () => {
    const resultado = actualizarRecordatorios(conRecordatorios('08:00', null, HOY), { principal: '10:00', secundario: null }, AHORA);
    expect(resultado.recordatorios.principal).toEqual({ hora: '10:00', ultimoAviso: null });
  });

  it('una nueva hora que ya pasó conserva el último aviso', () => {
    const resultado = actualizarRecordatorios(conRecordatorios('08:00', null, HOY), { principal: '09:00', secundario: null }, AHORA);
    expect(resultado.recordatorios.principal.ultimoAviso).toBe(HOY);
  });
});
