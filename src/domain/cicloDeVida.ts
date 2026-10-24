// Altas, ediciones y cambios de estado de una tarea (RF-TAR-08 a RF-TAR-10).
import type { Id, Tarea } from './modelo';
import { pausarCronometro } from './cronometro';
import { MENSAJES } from './mensajes';
import { exito, fallo, type Resultado } from './resultado';
import { estaAbierta, existeDuplicado } from './tareas';
import type { DatosTarea } from './validacionTarea';

/** RF-TAR-08 */
export function crearTarea(datos: DatosTarea, id: Id, ahora: Date): Tarea {
  const instante = ahora.toISOString();
  return {
    ...datos,
    id,
    estado: 'pendiente',
    creadaEn: instante,
    actualizadaEn: instante,
    completadaEn: null,
    segundosMedidos: 0,
    cronometroIniciadoEn: null,
  };
}

export function editarTarea(tarea: Tarea, datos: DatosTarea, ahora: Date): Tarea {
  return { ...tarea, ...datos, actualizadaEn: ahora.toISOString() };
}

/** RF-TAR-09: detiene el cronómetro y marca la tarea como completada. */
export function completarTarea(tarea: Tarea, ahora: Date): Tarea {
  if (!estaAbierta(tarea)) return tarea;
  const instante = ahora.toISOString();
  return { ...pausarCronometro(tarea, ahora), estado: 'completada', completadaEn: instante, actualizadaEn: instante };
}

/** RF-TAR-10: vuelve a pendiente salvo que eso genere un duplicado (RN-01). */
export function reabrirTarea(tarea: Tarea, tareas: Tarea[], ahora: Date): Resultado<Tarea, 'titulo'> {
  if (estaAbierta(tarea)) return exito(tarea);
  if (existeDuplicado(tarea.titulo, tarea.fecha, tareas, tarea.id)) return fallo({ titulo: MENSAJES.tareaDuplicada });
  return exito({ ...tarea, estado: 'pendiente', completadaEn: null, actualizadaEn: ahora.toISOString() });
}
