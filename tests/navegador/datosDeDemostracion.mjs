// Estado guardado para las pruebas del calendario: el mismo escenario de los wireframes.
// Semana del 19 al 25 de octubre de 2026; hoy es viernes 23 a las 9:22.
const instante = (dia, hora, minuto = 0) => new Date(2026, 9, dia, hora, minuto).toISOString();

function tarea(id, titulo, fecha, horaInicio, metaMinutos, prioridad, categoriaId, cambios = {}) {
  return {
    id,
    titulo,
    descripcion: '',
    categoriaId,
    prioridad,
    fecha,
    horaInicio,
    metaMinutos,
    estado: 'pendiente',
    creadaEn: instante(18, 12),
    actualizadaEn: instante(18, 12),
    completadaEn: null,
    segundosMedidos: 0,
    cronometroIniciadoEn: null,
    ...cambios,
  };
}

const completada = (dia, segundosMedidos = 3000) => ({ estado: 'completada', completadaEn: instante(dia, 18), segundosMedidos });

export function estadoDeDemostracion() {
  return {
    version: 1,
    categorias: [
      { id: 'general', nombre: 'General', color: 'gris', creadaEn: instante(1, 8) },
      { id: 'clientes', nombre: 'Clientes', color: 'verde', creadaEn: instante(1, 8) },
      { id: 'reportes', nombre: 'Reportes', color: 'amarillo', creadaEn: instante(1, 8) },
      { id: 'administrativo', nombre: 'Administrativo', color: 'azul', creadaEn: instante(1, 8) },
    ],
    tareas: [
      tarea('t1', 'Planificar semana', '2026-10-19', '08:00', 60, 'media', 'general', completada(19)),
      tarea('t2', 'Informe semanal', '2026-10-19', '09:00', 90, 'media', 'reportes', completada(19, 4800)),
      tarea('t3', 'Revisión de presupuesto', '2026-10-20', '13:00', 120, 'media', 'administrativo', completada(20)),
      tarea('t4', 'Enviar cotización', '2026-10-21', '14:00', 60, 'alta', 'clientes'),
      tarea('t5', 'Reunión de equipo', '2026-10-22', '10:00', 60, 'media', 'general', completada(22)),
      tarea('t6', 'Llamada con cliente', '2026-10-23', '09:00', 120, 'alta', 'clientes', {
        estado: 'en_progreso',
        cronometroIniciadoEn: instante(23, 9),
      }),
      tarea('t7', 'Revisar contrato', '2026-10-23', '09:30', 30, 'media', 'clientes'),
      tarea('t8', 'Actualizar CRM', '2026-10-23', '10:00', 30, 'baja', 'administrativo'),
      tarea('t9', 'Revisar correos', '2026-10-23', '13:00', 45, 'media', 'administrativo'),
    ],
    preferencias: {
      nombreUsuario: 'Ana',
      horarioTrabajo: {
        diasLaborales: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
        entrada: '08:00',
        salida: '17:00',
      },
      pasoPrimerUso: 'completo',
      recordatorios: {
        principal: { hora: '08:00', ultimoAviso: '2026-10-23' },
        secundario: { hora: null, ultimoAviso: null },
      },
      vistaPreferida: 'semana',
      ordenPreferido: 'prioridad',
    },
  };
}
