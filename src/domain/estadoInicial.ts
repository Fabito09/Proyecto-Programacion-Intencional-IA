// RF-INI-03 + RF-CAT-01: el estado que se guarda al confirmar la bienvenida.
import type { EstadoPersistido, HorarioTrabajo, Id } from './modelo';

export function crearEstadoInicial(
  nombreUsuario: string,
  horarioTrabajo: HorarioTrabajo,
  ahora: Date,
  generarId: () => Id,
): EstadoPersistido {
  return {
    version: 1,
    categorias: [{ id: generarId(), nombre: 'General', color: 'gris', creadaEn: ahora.toISOString() }],
    tareas: [],
    preferencias: {
      nombreUsuario,
      horarioTrabajo,
      pasoPrimerUso: 'tareas',
      recordatorios: {
        principal: { hora: null, ultimoAviso: null },
        secundario: { hora: null, ultimoAviso: null },
      },
      vistaPreferida: 'dia',
      ordenPreferido: 'prioridad',
    },
  };
}
