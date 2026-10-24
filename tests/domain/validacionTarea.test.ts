import { describe, expect, it } from 'vitest';
import { validarTarea } from '../../src/domain/validacionTarea';
import { unaTarea, unBorrador, unContexto } from '../fabricas';

function erroresDe(...argumentos: Parameters<typeof validarTarea>) {
  const resultado = validarTarea(...argumentos);
  return resultado.ok ? {} : resultado.errores;
}

describe('validarTarea', () => {
  it('acepta un borrador válido y convierte la meta a minutos (RF-TAR-08)', () => {
    const resultado = validarTarea(unBorrador({ titulo: '  Preparar informe  ' }), unContexto());
    expect(resultado).toEqual({
      ok: true,
      valor: {
        titulo: 'Preparar informe',
        descripcion: '',
        fecha: '2026-10-26',
        horaInicio: '09:00',
        metaMinutos: 90,
        prioridad: 'media',
        categoriaId: 'cat-general',
      },
    });
  });

  it('CB-01: rechaza un título vacío o con solo espacios (RF-TAR-01)', () => {
    expect(erroresDe(unBorrador({ titulo: '   ' }), unContexto()).titulo).toBe('El título es obligatorio');
  });

  it('RF-TAR-02: rechaza títulos de más de 100 caracteres', () => {
    expect(erroresDe(unBorrador({ titulo: 'x'.repeat(101) }), unContexto()).titulo).toBe('Máximo 100 caracteres');
  });

  it.each([
    ['-1', '0'],
    ['0', '75'],
    ['1.5', '0'],
    ['abc', '0'],
  ])('CB-02: rechaza la meta %s h %s min (RF-TAR-03)', (horas, minutos) => {
    expect(erroresDe(unBorrador({ metaHoras: horas, metaMinutos: minutos }), unContexto()).meta).toBe(
      'La meta debe estar entre 1 minuto y 24 horas',
    );
  });

  it.each([
    ['0', '0'],
    ['', ''],
    ['24', '30'],
  ])('CB-03: rechaza la meta %s h %s min (RF-TAR-03)', (horas, minutos) => {
    expect(erroresDe(unBorrador({ metaHoras: horas, metaMinutos: minutos }), unContexto()).meta).toBeDefined();
  });

  it('CB-04: rechaza una hora de inicio vacía (RF-TAR-06)', () => {
    expect(erroresDe(unBorrador({ horaInicio: '' }), unContexto()).horaInicio).toBe('Elija una hora de inicio');
  });

  it('CB-05: rechaza una tarea que empieza antes de la entrada (RN-09)', () => {
    expect(erroresDe(unBorrador({ horaInicio: '07:30' }), unContexto()).horaInicio).toBe(
      'La tarea debe quedar entre las 08:00 y las 17:00',
    );
  });

  it('CB-06: rechaza una tarea que termina después de la salida (RN-09)', () => {
    const borrador = unBorrador({ horaInicio: '16:00', metaHoras: '2', metaMinutos: '0' });
    expect(erroresDe(borrador, unContexto()).horaInicio).toBe('La tarea debe quedar entre las 08:00 y las 17:00');
  });

  it('CB-07: acepta una tarea que termina justo a la hora de salida (RN-09)', () => {
    const borrador = unBorrador({ horaInicio: '15:00', metaHoras: '2', metaMinutos: '0' });
    expect(validarTarea(borrador, unContexto()).ok).toBe(true);
  });

  it('CB-08: rechaza una tarea en un día no laboral (RN-09)', () => {
    expect(erroresDe(unBorrador({ fecha: '2026-10-24' }), unContexto()).fecha).toBe(
      'Ese día no está en su horario de trabajo',
    );
  });

  it('CB-09: detecta duplicados sin importar mayúsculas, espacios ni tildes (RN-01)', () => {
    const existentes = [unaTarea({ titulo: 'Revisión informe', fecha: '2026-10-28' })];
    const errores = erroresDe(unBorrador({ titulo: '  REVISION   informe ' }), unContexto({ tareas: existentes }));
    expect(errores.titulo).toBe('Ya tiene una tarea con ese título esta semana');
  });

  it('CB-10: permite repetir el título de una tarea completada (RN-01)', () => {
    const existentes = [unaTarea({ titulo: 'Preparar informe', fecha: '2026-10-27', estado: 'completada' })];
    expect(validarTarea(unBorrador(), unContexto({ tareas: existentes })).ok).toBe(true);
  });

  it('CB-11: permite repetir el título en otra semana (RN-01)', () => {
    const existentes = [unaTarea({ titulo: 'Preparar informe', fecha: '2026-10-23' })];
    expect(validarTarea(unBorrador(), unContexto({ tareas: existentes })).ok).toBe(true);
  });

  it('RN-01: al editar, la tarea no choca consigo misma', () => {
    const original = unaTarea({ titulo: 'Preparar informe', fecha: '2026-10-26', horaInicio: '09:00' });
    const contexto = unContexto({ tareas: [original], tareaEnEdicion: original });
    expect(validarTarea(unBorrador(), contexto).ok).toBe(true);
  });

  it('CB-12: rechaza crear una tarea con fecha pasada (RF-TAR-05)', () => {
    expect(erroresDe(unBorrador({ fecha: '2026-10-22' }), unContexto()).fecha).toBe(
      'La fecha no puede estar en el pasado',
    );
  });

  it('RF-TAR-05: al editar una tarea vencida se puede conservar su fecha original', () => {
    const vencida = unaTarea({ fecha: '2026-10-21', horaInicio: '14:00' });
    const borrador = unBorrador({ fecha: '2026-10-21', horaInicio: '14:00', metaHoras: '1', metaMinutos: '0' });
    expect(validarTarea(borrador, unContexto({ tareaEnEdicion: vencida })).ok).toBe(true);
  });

  it('RF-TAR-05: al editar no se puede mover la tarea a otra fecha pasada', () => {
    const vencida = unaTarea({ fecha: '2026-10-21' });
    const errores = erroresDe(unBorrador({ fecha: '2026-10-20' }), unContexto({ tareaEnEdicion: vencida }));
    expect(errores.fecha).toBe('La fecha no puede estar en el pasado');
  });

  it('RF-TAR-04: rechaza una fecha inexistente', () => {
    expect(erroresDe(unBorrador({ fecha: '2026-02-30' }), unContexto()).fecha).toBe('Elija una fecha válida');
  });

  it('RF-TAR-07: pide prioridad y categoría cuando faltan', () => {
    const errores = erroresDe(unBorrador({ prioridad: '', categoriaId: 'no-existe' }), unContexto());
    expect(errores.prioridad).toBe('Elija una prioridad');
    expect(errores.categoriaId).toBe('Elija una categoría');
  });
});
