// Textos visibles que requirements.md cita literalmente. Un solo lugar para no repetirlos.

export const MENSAJES = {
  nombreObligatorio: 'El nombre es obligatorio',
  maximoCaracteres: (maximo: number) => `Máximo ${maximo} caracteres`,
  marqueUnDia: 'Marque al menos un día',
  indiqueEntrada: 'Indique la hora de entrada',
  indiqueSalida: 'Indique la hora de salida',
  salidaDespuesDeEntrada: 'La salida debe ser después de la entrada',

  tituloObligatorio: 'El título es obligatorio',
  tareaDuplicada: 'Ya tiene una tarea con ese título esta semana',
  metaFueraDeRango: 'La meta debe estar entre 1 minuto y 24 horas',
  fechaInvalida: 'Elija una fecha válida',
  fechaEnElPasado: 'La fecha no puede estar en el pasado',
  horaInicioInvalida: 'Elija una hora de inicio',
  elijaPrioridad: 'Elija una prioridad',
  elijaCategoria: 'Elija una categoría',
  diaNoLaboral: 'Ese día no está en su horario de trabajo',
  fueraDeJornada: (entrada: string, salida: string) => `La tarea debe quedar entre las ${entrada} y las ${salida}`,

  categoriaNombreObligatorio: 'El nombre es obligatorio',
  categoriaDuplicada: 'Ya existe una categoría con ese nombre',
  elijaColor: 'Elija un color',

  horaInvalida: 'Hora inválida',
  soloDentroDeLaApp: 'Los recordatorios aparecerán solo dentro de la app',
  datosIlegibles: 'No se pudieron leer sus datos',
  confirmarEliminarTarea: '¿Eliminar esta tarea? No se puede deshacer.',
  sinTareas: 'Todavía no tiene tareas',
  sinCoincidencias: 'No hay tareas que coincidan',
  recordatoriosIguales: 'Los dos recordatorios no pueden tener la misma hora',

  unaCategoriaComoMinimo: 'Debe existir al menos una categoría',
  noSePudoGuardar: 'No se pudo guardar. Sus datos anteriores siguen intactos.',
  tareaGuardada: 'Tarea guardada',
  superposicion: (titulo: string, inicio: string, fin: string, otras: number) =>
    `Esta tarea comparte horario con '${titulo}' (${inicio}–${fin})${otras > 0 ? ` y ${otras} más` : ''}`,
  cronometroPausado: (titulo: string) => `Se pausó el cronómetro de '${titulo}'`,
  pausaAutomatica: (titulo: string) => `El cronómetro de '${titulo}' se pausó solo al terminar su jornada`,
  tareasFueraDeHorario: (cantidad: number) =>
    cantidad === 1
      ? '1 tarea queda fuera de su nuevo horario. Ajústela cuando la edite.'
      : `${cantidad} tareas quedan fuera de su nuevo horario. Ajústelas cuando las edite.`,
  metaSugerida: (veces: number, duracion: string) =>
    veces === 1
      ? `La última vez le tomó ${duracion}`
      : `Las últimas ${veces} veces le tomó en promedio ${duracion}`,
} as const;
