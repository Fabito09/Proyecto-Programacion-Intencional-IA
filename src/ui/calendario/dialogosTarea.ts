// Diálogos de tarea: formulario, detalle con acciones y lista de un grupo superpuesto (RN-08).
import { MENSAJES } from '../../domain/mensajes';
import type { FechaISO, HoraDelDia, Tarea } from '../../domain/modelo';
import { cronometroCorriendo, segundosMedidos } from '../../domain/cronometro';
import { ordenarTareas } from '../../domain/orden';
import { alertaDe, estaAbierta, extremosDelGrupo } from '../../domain/tareas';
import { formatearDuracion } from '../../domain/tiempo';
import type { Aplicacion } from '../../services/aplicacion';
import { mostrarRespuesta } from '../avisos';
import { boton } from '../componentes/boton';
import { etiquetaAlerta, iconoPrioridad, pildoraCategoria, textoCronometro } from '../componentes/etiquetas';
import { formularioTarea } from '../componentes/formularioTarea';
import { abrirDialogo, confirmar } from '../dialogo';
import { el } from '../dom';
import { fechaLarga, NOMBRE_ESTADO, NOMBRE_PRIORIDAD, rango, rangoDeTarea } from '../textos';

const SEGUNDOS_MINIMOS_PARA_REAL = 60;

export function abrirFormularioTarea(aplicacion: Aplicacion, tarea: Tarea | null, fecha: FechaISO, hora: HoraDelDia | ''): void {
  abrirDialogo(tarea === null ? 'Nueva tarea' : 'Editar tarea', (cerrar) => [
    formularioTarea({ aplicacion, tarea, fecha, hora, textoBoton: 'Guardar', alGuardar: cerrar, alCancelar: cerrar }),
  ]);
}

/** RF-CRO-01 y RF-CRO-06: tiempo medido junto a la meta. */
function lineaDeTiempos(tarea: Tarea, ahora: Date): HTMLElement {
  const meta = `Meta ${formatearDuracion(tarea.metaMinutos)}`;
  if (estaAbierta(tarea)) return el('p', { clase: 'detalle__tiempos' }, `${meta} · Medido `, textoCronometro(tarea, ahora));
  const segundos = segundosMedidos(tarea, ahora);
  if (segundos < SEGUNDOS_MINIMOS_PARA_REAL) return el('p', { clase: 'detalle__tiempos' }, meta);
  return el('p', { clase: 'detalle__tiempos' }, `${meta} · Real ${formatearDuracion(Math.round(segundos / 60))}`);
}

export function abrirDetalleTarea(aplicacion: Aplicacion, tarea: Tarea): void {
  const { categorias } = aplicacion.obtenerEstado();
  const ahora = aplicacion.ahora();
  const abierta = estaAbierta(tarea);
  const corriendo = cronometroCorriendo(tarea);

  abrirDialogo(tarea.titulo, (cerrar) => {
    const ejecutar = (accion: () => Parameters<typeof mostrarRespuesta>[0]) => () => {
      cerrar();
      mostrarRespuesta(accion());
    };
    return [
      el(
        'div',
        { clase: 'detalle' },
        el('p', { clase: 'detalle__fecha' }, `${fechaLarga(tarea.fecha)} · ${rangoDeTarea(tarea)}`),
        el(
          'div',
          { clase: 'detalle__etiquetas' },
          el('span', { clase: 'detalle__prioridad' }, iconoPrioridad(tarea.prioridad), `Prioridad ${NOMBRE_PRIORIDAD[tarea.prioridad].toLowerCase()}`),
          pildoraCategoria(categorias.find((categoria) => categoria.id === tarea.categoriaId)),
          etiquetaAlerta(alertaDe(tarea, ahora)),
          el('span', { clase: 'texto-tenue' }, NOMBRE_ESTADO[tarea.estado]),
        ),
        tarea.descripcion !== '' ? el('p', { clase: 'detalle__descripcion' }, tarea.descripcion) : null,
        lineaDeTiempos(tarea, ahora),
      ),
      el(
        'div',
        { clase: 'acciones acciones--envolver' },
        boton('Eliminar', {
          variante: 'peligro',
          alHacerClic: () => {
            cerrar();
            // RF-TAR-11
            void confirmar('Eliminar tarea', MENSAJES.confirmarEliminarTarea, 'Eliminar').then((aceptado) => {
              if (aceptado) mostrarRespuesta(aplicacion.eliminarTarea(tarea.id));
            });
          },
        }),
        boton('Editar', {
          alHacerClic: () => {
            cerrar();
            abrirFormularioTarea(aplicacion, tarea, tarea.fecha, tarea.horaInicio);
          },
        }),
        abierta
          ? boton(corriendo ? 'Pausar' : 'Iniciar', {
              iconoInicial: corriendo ? 'pausar' : 'iniciar',
              alHacerClic: ejecutar(() =>
                corriendo ? aplicacion.pausarCronometro(tarea.id) : aplicacion.iniciarCronometro(tarea.id),
              ),
            })
          : null,
        abierta
          ? boton('Completar', { variante: 'primario', iconoInicial: 'completar', alHacerClic: ejecutar(() => aplicacion.completarTarea(tarea.id)) })
          : boton('Reabrir', { variante: 'primario', alHacerClic: ejecutar(() => aplicacion.reabrirTarea(tarea.id)) }),
      ),
    ];
  });
}

/** RN-08: lista de todas las tareas del grupo, en el orden activo (RF-CAL-11). */
export function abrirListaDeGrupo(aplicacion: Aplicacion, grupo: Tarea[]): void {
  const { categorias, preferencias } = aplicacion.obtenerEstado();
  const ahora = aplicacion.ahora();
  const { inicio, fin } = extremosDelGrupo(grupo);

  abrirDialogo(`${grupo.length} tareas · ${rango(inicio, fin)}`, (cerrar) => [
    el(
      'ul',
      { clase: 'lista-simple' },
      ...ordenarTareas(grupo, preferencias.ordenPreferido).map((tarea) =>
        el(
          'li',
          {},
          el(
            'button',
            {
              clase: 'fila-tarea',
              atributos: { type: 'button' },
              alHacerClic: () => {
                cerrar();
                abrirDetalleTarea(aplicacion, tarea);
              },
            },
            el(
              'span',
              { clase: 'fila-tarea__texto' },
              el('span', { clase: `fila-tarea__titulo alerta--${alertaDe(tarea, ahora) ?? 'ninguna'}` }, tarea.titulo),
              el('span', { clase: 'texto-tenue' }, `${NOMBRE_PRIORIDAD[tarea.prioridad]} · ${rangoDeTarea(tarea)}`),
            ),
            pildoraCategoria(categorias.find((categoria) => categoria.id === tarea.categoriaId)),
          ),
        ),
      ),
    ),
  ]);
}
