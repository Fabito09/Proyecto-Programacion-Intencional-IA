// Arma la pantalla que corresponde, la vuelve a dibujar en cada cambio y corre los relojes de la app.
import { segundosMedidos } from '../domain/cronometro';
import { horaAMinutos, fechaLocal, formatearCronometro, minutosDelDia } from '../domain/tiempo';
import type { Aplicacion } from '../services/aplicacion';
import { mostrarAvisos, mostrarRespuesta } from './avisos';
import { abrirDetalleTarea, abrirFormularioTarea, abrirListaDeGrupo } from './calendario/dialogosTarea';
import { periodoDe } from './calendario/periodo';
import { vistaCalendario, type ControlCalendario, type EstadoCalendario } from './calendario/vistaCalendario';
import { confirmar } from './dialogo';
import { el, reemplazarContenido } from './dom';
import { encabezado, type Seccion } from './encabezado';
import { mostrarResumenDelDia } from './notificaciones';
import { pantallaAjustes } from './pantallas/ajustes';
import { pantallaCategorias } from './pantallas/categorias';
import {
  pantallaAgregarTareas,
  pantallaBienvenida,
  pantallaDatosIlegibles,
  pantallaRecordatoriosPrimerUso,
} from './pantallas/primerUso';

const UN_SEGUNDO = 1000;
const UN_MINUTO = 60 * UN_SEGUNDO;

export function iniciarInterfaz(raiz: HTMLElement, aplicacion: Aplicacion): void {
  let seccion: Seccion = 'calendario';
  const calendario: EstadoCalendario = {
    fechaReferencia: fechaLocal(aplicacion.ahora()),
    filtroCategoria: '',
    filtroEstado: '',
    vencidasAbiertas: true,
  };
  const desplazamiento = { clave: '', posicion: 0 };

  const control: ControlCalendario = {
    estado: calendario,
    cambiar: (cambios) => {
      Object.assign(calendario, cambios);
      renderizar();
    },
    abrirNuevaTarea: (fecha, hora) => {
      const hoy = fechaLocal(aplicacion.ahora());
      const fechaSugerida = fecha ?? (calendario.fechaReferencia < hoy ? hoy : calendario.fechaReferencia);
      abrirFormularioTarea(aplicacion, null, fechaSugerida, hora ?? '');
    },
    acciones: {
      abrirTarea: (tarea) => abrirDetalleTarea(aplicacion, tarea),
      abrirGrupo: (grupo) => abrirListaDeGrupo(aplicacion, grupo),
      alternarCronometro: (tarea) =>
        mostrarRespuesta(
          tarea.cronometroIniciadoEn === null ? aplicacion.iniciarCronometro(tarea.id) : aplicacion.pausarCronometro(tarea.id),
        ),
      completar: (tarea) => mostrarRespuesta(aplicacion.completarTarea(tarea.id)),
    },
  };

  function restablecer(): void {
    void confirmar('Restablecer datos', '¿Borrar todos sus datos y empezar de nuevo? No se puede deshacer.', 'Restablecer').then(
      (aceptado) => {
        if (aceptado) aplicacion.restablecerDatos();
      },
    );
  }

  function contenidoDeSeccion(): HTMLElement {
    switch (seccion) {
      case 'calendario':
        return vistaCalendario(aplicacion, control);
      case 'categorias':
        return pantallaCategorias(aplicacion);
      case 'ajustes':
        return pantallaAjustes(aplicacion);
    }
  }

  function construirPantalla(): HTMLElement {
    switch (aplicacion.pantalla()) {
      case 'datos_ilegibles':
        return pantallaDatosIlegibles(restablecer);
      case 'bienvenida':
        return pantallaBienvenida(aplicacion);
      case 'agregar_tareas':
        return pantallaAgregarTareas(aplicacion);
      case 'recordatorios':
        return pantallaRecordatoriosPrimerUso(aplicacion);
      case 'calendario':
        return el(
          'div',
          { clase: 'app' },
          encabezado(aplicacion, seccion, (nueva) => {
            seccion = nueva;
            renderizar();
          }),
          contenidoDeSeccion(),
        );
    }
  }

  /** Conserva el desplazamiento al redibujar; la primera vez abre en la hora que corresponde (RF-CAL-04). */
  function ajustarDesplazamiento(): void {
    const desplazable = raiz.querySelector<HTMLElement>('.cuadricula__desplazable');
    if (desplazable === null || aplicacion.pantalla() !== 'calendario') return;
    const { preferencias } = aplicacion.obtenerEstado();
    const clave = `${seccion}|${preferencias.vistaPreferida}|${calendario.fechaReferencia}`;
    if (clave === desplazamiento.clave) {
      desplazable.scrollTop = desplazamiento.posicion;
      return;
    }
    desplazamiento.clave = clave;
    // La vista Horas ya empieza en la hora actual (RF-CAL-03): no se desplaza.
    if (preferencias.vistaPreferida === 'horas') return;
    const ahora = aplicacion.ahora();
    const periodo = periodoDe(preferencias.vistaPreferida, calendario.fechaReferencia, ahora);
    // RF-CAL-04: el Día de Hoy abre en la hora actual; el resto, en la hora de entrada.
    const abrirEnLaHoraActual = preferencias.vistaPreferida === 'dia' && calendario.fechaReferencia === fechaLocal(ahora);
    const minutoInicial = abrirEnLaHoraActual ? minutosDelDia(ahora) : horaAMinutos(preferencias.horarioTrabajo.entrada);
    desplazable.scrollTop = Math.max(0, (minutoInicial / periodo.minutosPorFila - 1) * periodo.altoFila);
  }

  function renderizar(): void {
    const desplazable = raiz.querySelector<HTMLElement>('.cuadricula__desplazable');
    if (desplazable !== null) desplazamiento.posicion = desplazable.scrollTop;
    reemplazarContenido(raiz, construirPantalla());
    ajustarDesplazamiento();
  }

  /** RF-CRO-04, RF-CRO-01: actualiza cada segundo los cronómetros visibles sin redibujar todo. */
  function actualizarCronometros(): void {
    if (aplicacion.pantalla() !== 'calendario') return;
    const ahora = aplicacion.ahora();
    const { tareas } = aplicacion.obtenerEstado();
    document.querySelectorAll<HTMLElement>('[data-cronometro]').forEach((elemento) => {
      const tarea = tareas.find((candidata) => candidata.id === elemento.dataset.cronometro);
      if (tarea !== undefined) elemento.textContent = formatearCronometro(segundosMedidos(tarea, ahora));
    });
  }

  /** RF-REC-01: RN-11 y recordatorios cada minuto y al volver a la pestaña. */
  function evaluar(): void {
    const { avisos, resumen } = aplicacion.evaluar();
    mostrarAvisos(avisos);
    if (resumen !== null) mostrarResumenDelDia(resumen);
  }

  /** Redibuja el calendario cada minuto (línea "Ahora", vencidas); los formularios no se tocan. */
  function alPasarUnMinuto(): void {
    evaluar();
    if (aplicacion.pantalla() === 'calendario' && seccion === 'calendario') renderizar();
  }

  aplicacion.suscribir(renderizar);
  renderizar();
  evaluar();
  window.setInterval(alPasarUnMinuto, UN_MINUTO);
  window.setInterval(actualizarCronometros, UN_SEGUNDO);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') alPasarUnMinuto();
  });
}
