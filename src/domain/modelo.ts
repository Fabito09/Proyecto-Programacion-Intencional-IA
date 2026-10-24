// Modelo de dominio de Mi Semana.
// Cada tipo y límite de este archivo está definido en requirements.md;
// si algo cambia aquí, primero debe cambiar allá.

/** Identificador único generado con crypto.randomUUID(). */
export type Id = string;

/** Fecha calendario local en formato YYYY-MM-DD. */
export type FechaISO = string;

/** Hora local en formato HH:MM de 24 h. */
export type HoraDelDia = string;

/** Instante en formato ISO 8601 completo (Date.prototype.toISOString). */
export type MarcaDeTiempo = string;

export const PRIORIDADES = ['alta', 'media', 'baja'] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'completada'] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const COLORES_CATEGORIA = ['azul', 'verde', 'amarillo', 'rojo', 'morado', 'gris'] as const;
export type ColorCategoria = (typeof COLORES_CATEGORIA)[number];

export const CRITERIOS_ORDEN = ['prioridad', 'fecha', 'meta'] as const;
export type CriterioOrden = (typeof CRITERIOS_ORDEN)[number];

export const VISTAS_CALENDARIO = ['horas', 'dia', 'semana'] as const;
export type VistaCalendario = (typeof VISTAS_CALENDARIO)[number];

/** Pasos del primer uso, en orden (RF-INI). */
export const PASOS_PRIMER_USO = ['tareas', 'recordatorios', 'completo'] as const;
export type PasoPrimerUso = (typeof PASOS_PRIMER_USO)[number];

export const FRANJAS_RECORDATORIO = ['principal', 'secundario'] as const;
export type FranjaRecordatorio = (typeof FRANJAS_RECORDATORIO)[number];

export const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

/** Límites de validación (RF-INI-02, RF-TAR-02, RF-TAR-03, RF-CAT-02). */
export const LIMITES = {
  nombreUsuarioMaximo: 40,
  tituloMaximo: 100,
  descripcionMaxima: 500,
  nombreCategoriaMaximo: 40,
  metaMinimaMinutos: 1,
  metaMaximaMinutos: 1440,
} as const;

export interface Categoria {
  id: Id;
  /** Único entre categorías según su forma normalizada (RF-CAT-02). */
  nombre: string;
  color: ColorCategoria;
  creadaEn: MarcaDeTiempo;
}

export interface Tarea {
  id: Id;
  /** No vacío; único entre tareas abiertas de la misma semana (RN-01). */
  titulo: string;
  /** Opcional en la interfaz; se guarda como cadena vacía si no se escribe. */
  descripcion: string;
  /** Debe apuntar a una Categoria existente. */
  categoriaId: Id;
  prioridad: Prioridad;
  fecha: FechaISO;
  horaInicio: HoraDelDia;
  /**
   * Meta de tiempo: entero entre LIMITES.metaMinimaMinutos y LIMITES.metaMaximaMinutos.
   * El horario completo debe quedar dentro de la jornada (RN-09).
   */
  metaMinutos: number;
  /** "Por vencer" y "Vencida" no son estados: se derivan del horario y Ahora. */
  estado: EstadoTarea;
  /** Tiempo medido en tramos ya cerrados (pausados) del cronómetro. */
  segundosMedidos: number;
  /** Inicio del tramo en curso; null = cronómetro detenido. Solo una tarea a la vez (RN-10). */
  cronometroIniciadoEn: MarcaDeTiempo | null;
  creadaEn: MarcaDeTiempo;
  actualizadaEn: MarcaDeTiempo;
  /** Solo distinto de null cuando estado === 'completada'. */
  completadaEn: MarcaDeTiempo | null;
}

/** Mismo horario para todos los días laborales (RF-INI-03). */
export interface HorarioTrabajo {
  /** Al menos un día. */
  diasLaborales: DiaSemana[];
  entrada: HoraDelDia;
  /** Estrictamente posterior a la entrada. */
  salida: HoraDelDia;
}

export interface Recordatorio {
  /** null = "Ninguno": la franja no está configurada y nunca avisa (RF-AJU-04). */
  hora: HoraDelDia | null;
  /** Último día en que esta franja mostró un aviso (RN-02, RN-03). */
  ultimoAviso: FechaISO | null;
}

export interface Preferencias {
  /** Nombre con el que se saluda al usuario (RF-INI-02, RF-INI-08). */
  nombreUsuario: string;
  horarioTrabajo: HorarioTrabajo;
  /** Se guarda en cada paso para que F5 retome el mismo paso (RF-PER-02). */
  pasoPrimerUso: PasoPrimerUso;
  recordatorios: Record<FranjaRecordatorio, Recordatorio>;
  vistaPreferida: VistaCalendario;
  ordenPreferido: CriterioOrden;
}

/** Contenido completo guardado en LocalStorage bajo CLAVE_ALMACENAMIENTO. */
export interface EstadoPersistido {
  version: 1;
  categorias: Categoria[];
  tareas: Tarea[];
  preferencias: Preferencias;
}

export const CLAVE_ALMACENAMIENTO = 'mi-semana:v1';
