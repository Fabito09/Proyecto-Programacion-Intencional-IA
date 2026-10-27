import { describe, expect, it } from 'vitest';
import { crearTarea, reabrirTarea } from '../../src/domain/cicloDeVida';
import { tareasFueraDelHorario } from '../../src/domain/horario';
import { ordenarTareas, tareasVencidas } from '../../src/domain/orden';
import { numeroDeSemanaISO, formatearDuracion, formatearCronometro, mismaSemana } from '../../src/domain/tiempo';
import { AHORA, HORARIO_LV_8_17, unaTarea } from '../fabricas';

describe('ordenarTareas (RF-CAL-11)', () => {
  const baja = unaTarea({ prioridad: 'baja', fecha: '2026-10-26', metaMinutos: 15 });
  const altaTarde = unaTarea({ prioridad: 'alta', fecha: '2026-10-27', metaMinutos: 90 });
  const altaTemprano = unaTarea({ prioridad: 'alta', fecha: '2026-10-26', metaMinutos: 60 });

  it('por prioridad, desempatando por fecha', () => {
    expect(ordenarTareas([baja, altaTarde, altaTemprano], 'prioridad')).toEqual([altaTemprano, altaTarde, baja]);
  });

  it('por fecha, desempatando por prioridad', () => {
    expect(ordenarTareas([baja, altaTarde, altaTemprano], 'fecha')).toEqual([altaTemprano, baja, altaTarde]);
  });

  it('por meta más corta', () => {
    expect(ordenarTareas([altaTarde, altaTemprano, baja], 'meta')).toEqual([baja, altaTemprano, altaTarde]);
  });
});

describe('tareasVencidas (RN-05)', () => {
  it('reúne las vencidas de cualquier semana, sin completadas ni pendientes a futuro, en el orden activo', () => {
    const deLaSemanaPasada = unaTarea({ titulo: 'Semana pasada', fecha: '2026-10-14', prioridad: 'baja' });
    const deHoyYaTerminada = unaTarea({ titulo: 'Hoy 8:00', horaInicio: '08:00', metaMinutos: 60, prioridad: 'alta' });
    const completada = unaTarea({ fecha: '2026-10-20', estado: 'completada' });
    const deEstaTarde = unaTarea({ horaInicio: '13:00' });
    const resultado = tareasVencidas([deLaSemanaPasada, completada, deEstaTarde, deHoyYaTerminada], AHORA, 'prioridad');
    expect(resultado).toEqual([deHoyYaTerminada, deLaSemanaPasada]);
  });
});

describe('tareasFueraDelHorario (RF-AJU-03)', () => {
  it('CB-34: detecta las tareas abiertas que un nuevo horario deja afuera', () => {
    const nuevoHorario = { ...HORARIO_LV_8_17, entrada: '09:00', salida: '15:00' };
    const tareas = [
      unaTarea({ horaInicio: '16:00' }),
      unaTarea({ horaInicio: '16:00', estado: 'completada' }),
      unaTarea({ horaInicio: '10:00' }),
    ];
    expect(tareasFueraDelHorario(tareas, nuevoHorario)).toHaveLength(1);
  });
});

describe('ciclo de vida de la tarea', () => {
  it('RF-TAR-08: una tarea nueva empieza pendiente y sin tiempo medido', () => {
    const datos = {
      titulo: 'Informe',
      descripcion: '',
      fecha: '2026-10-26',
      horaInicio: '09:00',
      metaMinutos: 60,
      prioridad: 'alta' as const,
      categoriaId: 'cat-general',
    };
    expect(crearTarea(datos, 'nueva', AHORA)).toMatchObject({
      id: 'nueva',
      estado: 'pendiente',
      segundosMedidos: 0,
      cronometroIniciadoEn: null,
      completadaEn: null,
    });
  });

  it('RF-TAR-10: reabrir una tarea vuelve a pendiente y conserva su tiempo medido', () => {
    const tarea = unaTarea({ titulo: 'Informe', estado: 'completada', completadaEn: AHORA.toISOString(), segundosMedidos: 900 });
    expect(reabrirTarea(tarea, [tarea], AHORA)).toMatchObject({
      ok: true,
      valor: { estado: 'pendiente', completadaEn: null, segundosMedidos: 900 },
    });
  });

  it('RF-TAR-10: no reabre si generaría un duplicado (RN-01)', () => {
    const completada = unaTarea({ titulo: 'Informe', estado: 'completada' });
    const abierta = unaTarea({ titulo: 'informe' });
    expect(reabrirTarea(completada, [completada, abierta], AHORA)).toEqual({
      ok: false,
      errores: { titulo: 'Ya tiene una tarea con ese título esta semana' },
    });
  });
});

describe('utilidades de tiempo', () => {
  it('RF-EST-02: el 23 de octubre de 2026 cae en la semana S43', () => {
    expect(numeroDeSemanaISO('2026-10-23')).toBe(43);
  });

  it('domingo y el lunes siguiente están en semanas distintas', () => {
    expect(mismaSemana('2026-10-25', '2026-10-26')).toBe(false);
    expect(mismaSemana('2026-10-19', '2026-10-25')).toBe(true);
  });

  it('formatea duraciones y cronómetros', () => {
    expect(formatearDuracion(225)).toBe('3 h 45 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(45)).toBe('45 min');
    expect(formatearCronometro(1330)).toBe('0:22:10');
  });
});
