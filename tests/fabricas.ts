// Datos de prueba compartidos. Escenario: viernes 23 oct 2026, 9:22, horario lun–vie 08:00–17:00.
import type { Categoria, HorarioTrabajo, Preferencias, Tarea } from '../src/domain/modelo';
import type { BorradorTarea, ContextoTarea } from '../src/domain/validacionTarea';

/** Viernes 23 de octubre de 2026, 9:22 hora local. */
export const AHORA = new Date(2026, 9, 23, 9, 22);
export const HOY = '2026-10-23';

export function instante(dia: number, hora: number, minuto = 0): string {
  return new Date(2026, 9, dia, hora, minuto).toISOString();
}

export const HORARIO_LV_8_17: HorarioTrabajo = {
  diasLaborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  entrada: '08:00',
  salida: '17:00',
};

export const CATEGORIA_GENERAL: Categoria = {
  id: 'cat-general',
  nombre: 'General',
  color: 'gris',
  creadaEn: '2026-10-01T00:00:00.000Z',
};

let contador = 0;

export function unaTarea(cambios: Partial<Tarea> = {}): Tarea {
  contador += 1;
  return {
    id: `t-${contador}`,
    titulo: `Tarea ${contador}`,
    descripcion: '',
    categoriaId: CATEGORIA_GENERAL.id,
    prioridad: 'media',
    fecha: HOY,
    horaInicio: '13:00',
    metaMinutos: 60,
    estado: 'pendiente',
    creadaEn: '2026-10-20T12:00:00.000Z',
    actualizadaEn: '2026-10-20T12:00:00.000Z',
    completadaEn: null,
    segundosMedidos: 0,
    cronometroIniciadoEn: null,
    ...cambios,
  };
}

/** Borrador válido: lunes 26 oct, 09:00, meta 1 h 30 min. */
export function unBorrador(cambios: Partial<BorradorTarea> = {}): BorradorTarea {
  return {
    titulo: 'Preparar informe',
    descripcion: '',
    fecha: '2026-10-26',
    horaInicio: '09:00',
    metaHoras: '1',
    metaMinutos: '30',
    prioridad: 'media',
    categoriaId: CATEGORIA_GENERAL.id,
    ...cambios,
  };
}

export function unContexto(cambios: Partial<ContextoTarea> = {}): ContextoTarea {
  return {
    tareas: [],
    categorias: [CATEGORIA_GENERAL],
    horario: HORARIO_LV_8_17,
    hoy: HOY,
    tareaEnEdicion: null,
    ...cambios,
  };
}

export function unasPreferencias(cambios: Partial<Preferencias> = {}): Preferencias {
  return {
    nombreUsuario: 'Ana',
    horarioTrabajo: HORARIO_LV_8_17,
    pasoPrimerUso: 'completo',
    recordatorios: {
      principal: { hora: null, ultimoAviso: null },
      secundario: { hora: null, ultimoAviso: null },
    },
    vistaPreferida: 'dia',
    ordenPreferido: 'prioridad',
    ...cambios,
  };
}
