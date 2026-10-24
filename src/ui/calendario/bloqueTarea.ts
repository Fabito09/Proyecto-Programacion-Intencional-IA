// Un bloque del calendario: una tarea, o un grupo superpuesto con insignia "+N" (RF-CAL-07, RN-06, RN-08).
import type { Categoria, Tarea } from '../../domain/modelo';
import { cronometroCorriendo } from '../../domain/cronometro';
import { alertaDe, estaAbierta, extremosDelGrupo, tareaPrincipal } from '../../domain/tareas';
import { formatearDuracion } from '../../domain/tiempo';
import { boton } from '../componentes/boton';
import { iconoPrioridad, pildoraCategoria, textoCronometro } from '../componentes/etiquetas';
import { el } from '../dom';
import { icono } from '../iconos';
import { rango, TEXTO_ALERTA } from '../textos';

export interface AccionesSobreTareas {
  abrirTarea(tarea: Tarea): void;
  abrirGrupo(grupo: Tarea[]): void;
  alternarCronometro(tarea: Tarea): void;
  completar(tarea: Tarea): void;
}

export interface ContextoBloque {
  categorias: Categoria[];
  ahora: Date;
  /** Día y Horas muestran meta, cronómetro y botones; Semana, solo lo esencial. */
  detallado: boolean;
  acciones: AccionesSobreTareas;
}

export function bloqueDeGrupo(grupo: Tarea[], contexto: ContextoBloque): HTMLElement {
  const { ahora, acciones, detallado } = contexto;
  const principal = tareaPrincipal(grupo);
  const restantes = grupo.length - 1;
  const { inicio, fin } = extremosDelGrupo(grupo);
  const alerta = alertaDe(principal, ahora);
  const abierta = estaAbierta(principal);
  const categoria = contexto.categorias.find((candidata) => candidata.id === principal.categoriaId);

  const clases = ['bloque', alerta && `bloque--${alerta}`, !abierta && 'bloque--completada', restantes > 0 && 'bloque--grupo']
    .filter(Boolean)
    .join(' ');
  const detalle = [rango(inicio, fin), alerta && TEXTO_ALERTA[alerta], detallado && `Meta ${formatearDuracion(principal.metaMinutos)}`]
    .filter(Boolean)
    .join(' · ');
  const descripcionAccesible =
    restantes > 0 ? `${principal.titulo} y ${restantes} tareas más, ${rango(inicio, fin)}` : `${principal.titulo}, ${rango(inicio, fin)}`;

  const abrir = el(
    'button',
    {
      clase: 'bloque__abrir',
      atributos: { type: 'button', 'aria-label': descripcionAccesible },
      alHacerClic: () => (restantes > 0 ? acciones.abrirGrupo(grupo) : acciones.abrirTarea(principal)),
    },
    el(
      'span',
      { clase: 'bloque__titulo' },
      abierta ? iconoPrioridad(principal.prioridad) : icono('completar'),
      el('span', { clase: 'bloque__texto-titulo' }, principal.titulo),
      restantes > 0 ? el('span', { clase: 'insignia' }, `+${restantes}`) : null,
    ),
    el('span', { clase: 'bloque__detalle' }, detalle),
    pildoraCategoria(categoria),
    !detallado && cronometroCorriendo(principal) ? textoCronometro(principal, ahora) : null,
  );

  const botones =
    detallado && abierta
      ? el(
          'div',
          { clase: 'bloque__acciones' },
          textoCronometro(principal, ahora),
          boton(cronometroCorriendo(principal) ? 'Pausar' : 'Iniciar', {
            variante: cronometroCorriendo(principal) ? 'primario' : 'secundario',
            iconoInicial: cronometroCorriendo(principal) ? 'pausar' : 'iniciar',
            alHacerClic: () => acciones.alternarCronometro(principal),
          }),
          boton('Completar', { iconoInicial: 'completar', alHacerClic: () => acciones.completar(principal) }),
        )
      : null;

  return el('div', { clase: clases }, abrir, botones);
}
