import { describe, expect, it } from 'vitest';
import { completarTarea } from '../../src/domain/cicloDeVida';
import { aplicarPausaAutomatica, iniciarCronometro, segundosMedidos } from '../../src/domain/cronometro';
import { AHORA, HORARIO_LV_8_17, instante, unaTarea } from '../fabricas';

describe('cronómetro (RF-CRO, RN-10, RN-11)', () => {
  it('CB-16: iniciar B pausa a A sumando su tramo (RN-10)', () => {
    const a = unaTarea({ estado: 'en_progreso', cronometroIniciadoEn: instante(23, 9, 0) });
    const b = unaTarea();
    const { tareas, pausada } = iniciarCronometro([a, b], b.id, AHORA);
    const [aDespues, bDespues] = tareas;
    expect(pausada?.id).toBe(a.id);
    expect(aDespues).toMatchObject({ cronometroIniciadoEn: null, segundosMedidos: 22 * 60 });
    expect(bDespues).toMatchObject({ cronometroIniciadoEn: AHORA.toISOString(), estado: 'en_progreso' });
  });

  it('RF-CRO-02: no inicia el cronómetro de una tarea completada', () => {
    const completada = unaTarea({ estado: 'completada' });
    const resultado = iniciarCronometro([completada], completada.id, AHORA);
    expect(resultado.tareas[0]).toBe(completada);
    expect(resultado.pausada).toBeNull();
  });

  it('CB-17: un cronómetro iniciado a las 16:00 de un día laboral se pausa a las 17:00 (RN-11)', () => {
    const olvidada = unaTarea({ cronometroIniciadoEn: instante(22, 16, 0) });
    const { tareas, pausadas } = aplicarPausaAutomatica([olvidada], HORARIO_LV_8_17, AHORA);
    expect(pausadas).toHaveLength(1);
    expect(tareas[0]).toMatchObject({ cronometroIniciadoEn: null, segundosMedidos: 3600 });
  });

  it('CB-18: un cronómetro iniciado un sábado a las 10:00 se pausa a las 24:00 de ese sábado (RN-11)', () => {
    const olvidada = unaTarea({ cronometroIniciadoEn: instante(24, 10, 0) });
    const lunes = new Date(2026, 9, 26, 9, 0);
    const { tareas } = aplicarPausaAutomatica([olvidada], HORARIO_LV_8_17, lunes);
    expect(tareas[0]?.segundosMedidos).toBe(14 * 3600);
  });

  it('RN-11: iniciado en día laboral después de la salida, el límite es medianoche', () => {
    const olvidada = unaTarea({ cronometroIniciadoEn: instante(22, 18, 0) });
    const { tareas } = aplicarPausaAutomatica([olvidada], HORARIO_LV_8_17, AHORA);
    expect(tareas[0]?.segundosMedidos).toBe(6 * 3600);
  });

  it('RN-11: no toca un cronómetro que todavía no llegó a su límite', () => {
    const enCurso = unaTarea({ cronometroIniciadoEn: instante(23, 9, 0) });
    const { tareas, pausadas } = aplicarPausaAutomatica([enCurso], HORARIO_LV_8_17, AHORA);
    expect(pausadas).toHaveLength(0);
    expect(tareas[0]).toBe(enCurso);
  });

  it('CB-19: el tiempo medido se calcula desde la marca de inicio, sobrevive a F5 (RF-CRO-05)', () => {
    const corriendo = unaTarea({ segundosMedidos: 100, cronometroIniciadoEn: instante(23, 9, 0) });
    expect(segundosMedidos(corriendo, AHORA)).toBe(100 + 22 * 60);
  });

  it('CB-20: completar con el cronómetro corriendo lo detiene y suma el tramo (RF-TAR-09)', () => {
    const corriendo = unaTarea({ estado: 'en_progreso', cronometroIniciadoEn: instante(23, 9, 0) });
    expect(completarTarea(corriendo, AHORA)).toMatchObject({
      estado: 'completada',
      completadaEn: AHORA.toISOString(),
      cronometroIniciadoEn: null,
      segundosMedidos: 22 * 60,
    });
  });
});
