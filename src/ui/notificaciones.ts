// Notificaciones del sistema para los recordatorios (RN-02, RF-AJU-07, RF-AJU-08).
import { MENSAJES } from '../domain/mensajes';
import { FRANJAS_RECORDATORIO, type Preferencias } from '../domain/modelo';
import { textoDelResumen, type ResumenDelDia } from '../domain/recordatorios';
import { mostrarAviso } from './avisos';

type Recordatorios = Preferencias['recordatorios'];

function notificacionesDisponibles(): boolean {
  return 'Notification' in window;
}

/**
 * RF-AJU-07: pide permiso al configurar una franja que estaba en "Ninguno".
 * RF-AJU-08: sin permiso o sin soporte, la hora se guarda igual y se avisa que todo será dentro de la app.
 */
export function prepararNotificaciones(antes: Recordatorios, despues: Recordatorios): void {
  const hayFranjaConfigurada = FRANJAS_RECORDATORIO.some((franja) => despues[franja].hora !== null);
  if (!hayFranjaConfigurada) return;
  if (!notificacionesDisponibles() || Notification.permission === 'denied') {
    mostrarAviso(MENSAJES.soloDentroDeLaApp);
    return;
  }
  const seActivoUnaFranja = FRANJAS_RECORDATORIO.some(
    (franja) => antes[franja].hora === null && despues[franja].hora !== null,
  );
  if (seActivoUnaFranja && Notification.permission === 'default') {
    void Notification.requestPermission().then((permiso) => {
      if (permiso === 'denied') mostrarAviso(MENSAJES.soloDentroDeLaApp);
    });
  }
}

/** RN-02: notificación del sistema si la pestaña está oculta y hay permiso; si no, aviso dentro de la app. */
export function mostrarResumenDelDia(resumen: ResumenDelDia): void {
  const texto = textoDelResumen(resumen);
  if (document.hidden && notificacionesDisponibles() && Notification.permission === 'granted') {
    new Notification('Do It — Resumen del día', { body: texto });
    return;
  }
  mostrarAviso(`Resumen del día: ${texto}`, 'resumen', null);
}
