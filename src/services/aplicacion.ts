// Casos de uso: conectan el dominio con la persistencia y avisan a la interfaz de cada cambio.
import { completarTarea, crearTarea, editarTarea, reabrirTarea } from '../domain/cicloDeVida';
import { aplicarPausaAutomatica, iniciarCronometro, pausarCronometro } from '../domain/cronometro';
import { crearEstadoInicial } from '../domain/estadoInicial';
import { tareasFueraDelHorario } from '../domain/horario';
import { MENSAJES } from '../domain/mensajes';
import type {
  CriterioOrden,
  EstadoPersistido,
  FranjaRecordatorio,
  Id,
  Preferencias,
  Tarea,
  VistaCalendario,
} from '../domain/modelo';
import { actualizarRecordatorios, evaluarRecordatorios, type ResumenDelDia } from '../domain/recordatorios';
import type { ErroresDeCampo } from '../domain/resultado';
import { finEnMinutos, tareasQueSeSuperponen } from '../domain/tareas';
import { fechaLocal, minutosAHora } from '../domain/tiempo';
import { validarCategoria, type BorradorCategoria, type CampoCategoria } from '../domain/validacionCategoria';
import {
  validarHorario,
  validarNombre,
  validarRecordatorios,
  type BorradorHorario,
  type BorradorRecordatorios,
  type CampoHorario,
} from '../domain/validacionPreferencias';
import { validarTarea, type BorradorTarea, type CampoTarea } from '../domain/validacionTarea';
import { borrarEstado, guardarEstado, leerEstado, type Almacen } from '../storage/almacenamiento';

export interface Dependencias {
  almacen: Almacen;
  reloj: () => Date;
  generarId: () => Id;
}

export type Pantalla = 'bienvenida' | 'agregar_tareas' | 'recordatorios' | 'calendario' | 'datos_ilegibles';

export type Respuesta<Campo extends string = never> =
  | { tipo: 'ok'; avisos: string[] }
  | { tipo: 'invalido'; errores: ErroresDeCampo<Campo> }
  | { tipo: 'sin_guardar'; mensaje: string };

export interface Evaluacion {
  avisos: string[];
  /** Resumen para el único aviso de RN-02/RN-03, o null si no corresponde. */
  resumen: ResumenDelDia | null;
}

/** RN-07: aviso informativo que nombra la primera tarea con la que se choca. */
function avisosDeSuperposicion(tarea: Tarea, tareas: Tarea[]): string[] {
  const [primera, ...otras] = tareasQueSeSuperponen(tarea, tareas);
  if (primera === undefined) return [];
  return [MENSAJES.superposicion(primera.titulo, primera.horaInicio, minutosAHora(finEnMinutos(primera)), otras.length)];
}

export class Aplicacion {
  private estado: EstadoPersistido | null = null;
  private datosIlegibles = false;
  private readonly oyentes = new Set<() => void>();
  private readonly almacen: Almacen;
  private readonly reloj: () => Date;
  private readonly generarId: () => Id;

  constructor({ almacen, reloj, generarId }: Dependencias) {
    this.almacen = almacen;
    this.reloj = reloj;
    this.generarId = generarId;
  }

  /** RF-PER-02, RF-PER-03 */
  cargar(): void {
    const lectura = leerEstado(this.almacen);
    this.estado = lectura.tipo === 'ok' ? lectura.estado : null;
    this.datosIlegibles = lectura.tipo === 'ilegible';
  }

  /** RF-PER-02: la pantalla que corresponde a lo guardado, incluido el paso del primer uso. */
  pantalla(): Pantalla {
    if (this.datosIlegibles) return 'datos_ilegibles';
    if (this.estado === null) return 'bienvenida';
    switch (this.estado.preferencias.pasoPrimerUso) {
      case 'tareas':
        return 'agregar_tareas';
      case 'recordatorios':
        return 'recordatorios';
      case 'completo':
        return 'calendario';
    }
  }

  obtenerEstado(): EstadoPersistido {
    if (this.estado === null) throw new Error('No hay datos cargados todavía');
    return this.estado;
  }

  ahora(): Date {
    return this.reloj();
  }

  suscribir(oyente: () => void): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  /** RF-PER-01 y RF-PER-04: primero se guarda; si falla, nada cambia. */
  private confirmar(nuevo: EstadoPersistido, avisos: string[] = []): Respuesta {
    if (!guardarEstado(this.almacen, nuevo)) return { tipo: 'sin_guardar', mensaje: MENSAJES.noSePudoGuardar };
    this.estado = nuevo;
    this.datosIlegibles = false;
    this.oyentes.forEach((oyente) => oyente());
    return { tipo: 'ok', avisos };
  }

  private confirmarPreferencias(cambios: Partial<Preferencias>): Respuesta {
    const estado = this.obtenerEstado();
    return this.confirmar({ ...estado, preferencias: { ...estado.preferencias, ...cambios } });
  }

  private reemplazarTarea(id: Id, cambiar: (tarea: Tarea) => Tarea): Respuesta {
    const estado = this.obtenerEstado();
    return this.confirmar({ ...estado, tareas: estado.tareas.map((tarea) => (tarea.id === id ? cambiar(tarea) : tarea)) });
  }

  private buscarTarea(id: Id): Tarea {
    const tarea = this.obtenerEstado().tareas.find((candidata) => candidata.id === id);
    if (tarea === undefined) throw new Error(`No existe la tarea ${id}`);
    return tarea;
  }

  // ── Primer uso ──────────────────────────────────────────────

  /** RF-INI-02, RF-INI-03, RF-INI-04, RF-CAT-01 */
  confirmarBienvenida(nombre: string, horario: BorradorHorario): Respuesta<'nombre' | CampoHorario> {
    const nombreValidado = validarNombre(nombre);
    const horarioValidado = validarHorario(horario);
    if (!nombreValidado.ok || !horarioValidado.ok) {
      return {
        tipo: 'invalido',
        errores: {
          ...(nombreValidado.ok ? {} : nombreValidado.errores),
          ...(horarioValidado.ok ? {} : horarioValidado.errores),
        },
      };
    }
    return this.confirmar(crearEstadoInicial(nombreValidado.valor, horarioValidado.valor, this.reloj(), this.generarId));
  }

  /** RF-INI-06: "Continuar" o "Lo hago después". */
  terminarPasoDeTareas(): Respuesta {
    return this.confirmarPreferencias({ pasoPrimerUso: 'recordatorios' });
  }

  // ── Tareas ──────────────────────────────────────────────────

  /** RF-TAR-08 y RN-07. idEnEdicion es null al crear. */
  guardarTarea(borrador: BorradorTarea, idEnEdicion: Id | null): Respuesta<CampoTarea> {
    const estado = this.obtenerEstado();
    const ahora = this.reloj();
    const tareaEnEdicion = idEnEdicion === null ? null : this.buscarTarea(idEnEdicion);
    const validado = validarTarea(borrador, {
      tareas: estado.tareas,
      categorias: estado.categorias,
      horario: estado.preferencias.horarioTrabajo,
      hoy: fechaLocal(ahora),
      tareaEnEdicion,
    });
    if (!validado.ok) return { tipo: 'invalido', errores: validado.errores };

    const guardada =
      tareaEnEdicion === null
        ? crearTarea(validado.valor, this.generarId(), ahora)
        : editarTarea(tareaEnEdicion, validado.valor, ahora);
    const tareas =
      tareaEnEdicion === null
        ? [...estado.tareas, guardada]
        : estado.tareas.map((tarea) => (tarea.id === guardada.id ? guardada : tarea));
    return this.confirmar({ ...estado, tareas }, [MENSAJES.tareaGuardada, ...avisosDeSuperposicion(guardada, tareas)]);
  }

  /** RF-TAR-09 */
  completarTarea(id: Id): Respuesta {
    const ahora = this.reloj();
    return this.reemplazarTarea(id, (tarea) => completarTarea(tarea, ahora));
  }

  /** RF-TAR-10 */
  reabrirTarea(id: Id): Respuesta<'titulo'> {
    const resultado = reabrirTarea(this.buscarTarea(id), this.obtenerEstado().tareas, this.reloj());
    if (!resultado.ok) return { tipo: 'invalido', errores: resultado.errores };
    return this.reemplazarTarea(id, () => resultado.valor);
  }

  /** RF-TAR-11: la interfaz pide la confirmación antes de llamarla. */
  eliminarTarea(id: Id): Respuesta {
    const estado = this.obtenerEstado();
    return this.confirmar({ ...estado, tareas: estado.tareas.filter((tarea) => tarea.id !== id) });
  }

  // ── Cronómetro ──────────────────────────────────────────────

  /** RF-CRO-02 y RN-10 */
  iniciarCronometro(id: Id): Respuesta {
    const estado = this.obtenerEstado();
    const { tareas, pausada } = iniciarCronometro(estado.tareas, id, this.reloj());
    const avisos = pausada === null ? [] : [MENSAJES.cronometroPausado(pausada.titulo)];
    return this.confirmar({ ...estado, tareas }, avisos);
  }

  /** RF-CRO-03 */
  pausarCronometro(id: Id): Respuesta {
    const ahora = this.reloj();
    return this.reemplazarTarea(id, (tarea) => pausarCronometro(tarea, ahora));
  }

  // ── Evaluación periódica ────────────────────────────────────

  /** RF-REC-01: RN-11 (cronómetros olvidados) y luego RN-02/RN-03 (recordatorios). */
  evaluar(): Evaluacion {
    const estado = this.estado;
    if (estado === null || estado.preferencias.pasoPrimerUso !== 'completo') return { avisos: [], resumen: null };
    const ahora = this.reloj();
    const pausa = aplicarPausaAutomatica(estado.tareas, estado.preferencias.horarioTrabajo, ahora);
    const recordatorios = evaluarRecordatorios(estado.preferencias, pausa.tareas, ahora);
    if (pausa.pausadas.length === 0 && recordatorios.aviso === null) return { avisos: [], resumen: null };

    const respuesta = this.confirmar({ ...estado, tareas: pausa.tareas, preferencias: recordatorios.preferencias });
    if (respuesta.tipo === 'sin_guardar') return { avisos: [respuesta.mensaje], resumen: null };
    return { avisos: pausa.pausadas.map((tarea) => MENSAJES.pausaAutomatica(tarea.titulo)), resumen: recordatorios.aviso };
  }

  // ── Vista y orden ───────────────────────────────────────────

  /** RF-CAL-02 */
  cambiarVista(vista: VistaCalendario): Respuesta {
    return this.confirmarPreferencias({ vistaPreferida: vista });
  }

  /** RF-CAL-11 */
  cambiarOrden(criterio: CriterioOrden): Respuesta {
    return this.confirmarPreferencias({ ordenPreferido: criterio });
  }

  // ── Categorías ──────────────────────────────────────────────

  /** RF-CAT-02, RF-CAT-04. idEnEdicion es null al crear. */
  guardarCategoria(borrador: BorradorCategoria, idEnEdicion: Id | null): Respuesta<CampoCategoria> {
    const estado = this.obtenerEstado();
    const validado = validarCategoria(borrador, estado.categorias, idEnEdicion);
    if (!validado.ok) return { tipo: 'invalido', errores: validado.errores };
    const categorias =
      idEnEdicion === null
        ? [...estado.categorias, { ...validado.valor, id: this.generarId(), creadaEn: this.reloj().toISOString() }]
        : estado.categorias.map((categoria) => (categoria.id === idEnEdicion ? { ...categoria, ...validado.valor } : categoria));
    return this.confirmar({ ...estado, categorias });
  }

  /** RF-CAT-03 y RN-04: las tareas pasan a la categoría destino antes de eliminar. */
  eliminarCategoria(id: Id, destinoId: Id | null): Respuesta<'categoria' | 'destino'> {
    const estado = this.obtenerEstado();
    if (estado.categorias.length <= 1) return { tipo: 'invalido', errores: { categoria: MENSAJES.unaCategoriaComoMinimo } };

    const tieneTareas = estado.tareas.some((tarea) => tarea.categoriaId === id);
    const destinoValido = destinoId !== null && destinoId !== id && estado.categorias.some((c) => c.id === destinoId);
    if (tieneTareas && !destinoValido) return { tipo: 'invalido', errores: { destino: MENSAJES.elijaCategoria } };

    const instante = this.reloj().toISOString();
    const tareas =
      destinoId === null
        ? estado.tareas
        : estado.tareas.map((tarea) =>
            tarea.categoriaId === id ? { ...tarea, categoriaId: destinoId, actualizadaEn: instante } : tarea,
          );
    return this.confirmar({ ...estado, tareas, categorias: estado.categorias.filter((categoria) => categoria.id !== id) });
  }

  // ── Ajustes ─────────────────────────────────────────────────

  /** RF-AJU-02 */
  guardarNombre(nombre: string): Respuesta<'nombre'> {
    const validado = validarNombre(nombre);
    if (!validado.ok) return { tipo: 'invalido', errores: validado.errores };
    return this.confirmarPreferencias({ nombreUsuario: validado.valor });
  }

  /** RF-AJU-02 y RF-AJU-03: se guarda aunque deje tareas afuera, con un aviso. */
  guardarHorario(borrador: BorradorHorario): Respuesta<CampoHorario> {
    const validado = validarHorario(borrador);
    if (!validado.ok) return { tipo: 'invalido', errores: validado.errores };
    const fuera = tareasFueraDelHorario(this.obtenerEstado().tareas, validado.valor).length;
    const respuesta = this.confirmarPreferencias({ horarioTrabajo: validado.valor });
    if (respuesta.tipo !== 'ok' || fuera === 0) return respuesta;
    return { tipo: 'ok', avisos: [MENSAJES.tareasFueraDeHorario(fuera)] };
  }

  /** RF-AJU-04 a RF-AJU-06. También cierra el primer uso (RF-INI-07). */
  guardarRecordatorios(borrador: BorradorRecordatorios): Respuesta<FranjaRecordatorio> {
    const validado = validarRecordatorios(borrador);
    if (!validado.ok) return { tipo: 'invalido', errores: validado.errores };
    const estado = this.obtenerEstado();
    const preferencias = actualizarRecordatorios(estado.preferencias, validado.valor, this.reloj());
    return this.confirmar({ ...estado, preferencias: { ...preferencias, pasoPrimerUso: 'completo' } });
  }

  /** RF-PER-03: "Restablecer datos", solo después de la confirmación explícita en la interfaz. */
  restablecerDatos(): void {
    borrarEstado(this.almacen);
    this.estado = null;
    this.datosIlegibles = false;
    this.oyentes.forEach((oyente) => oyente());
  }
}
