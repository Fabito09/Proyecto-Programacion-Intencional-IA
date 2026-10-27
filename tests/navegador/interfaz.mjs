// Pruebas de la interfaz en Chrome real: las reglas y casos de borde que dependen del navegador.
// Uso: npm run test:navegador (compila la app, la sirve con Vite y la recorre en Chrome sin ventana).
// El reloj queda fijo en el viernes 23 de octubre de 2026 a las 9:22, como en los wireframes.
import { preview } from 'vite';
import { abrirChrome, esperar } from './chrome.mjs';
import { estadoDeDemostracion } from './datosDeDemostracion.mjs';

const RELOJ_FIJO = `(() => {
  const base = new Date(2026, 9, 23, 9, 22).getTime();
  const arranque = Date.now();
  const Original = Date;
  class Fijo extends Original {
    constructor(...partes) { if (partes.length === 0) super(base + (Original.now() - arranque)); else super(...partes); }
    static now() { return base + (Original.now() - arranque); }
  }
  window.Date = Fijo;
})();`;

// Ayudantes que se cargan en la página para encontrar y llenar controles por su texto.
const AYUDANTES = `
window.__control = (texto) => {
  const etiqueta = [...document.querySelectorAll('label')].find((l) => l.htmlFor && l.textContent.trim().startsWith(texto));
  return etiqueta ? document.getElementById(etiqueta.htmlFor) : null;
};
window.__poner = (control, valor) => {
  control.value = valor;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
};
window.__hora = (etiqueta, valor) => {
  __poner(document.querySelector('[aria-label="' + etiqueta + ': horas"]'), valor.slice(0, 2));
  __poner(document.querySelector('[aria-label="' + etiqueta + ': minutos"]'), valor.slice(3, 5));
};
window.__boton = (texto) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === texto);
window.__errores = () => [...document.querySelectorAll('.campo__error:not([hidden])')].map((e) => e.textContent);
window.__avisos = () => [...document.querySelectorAll('.aviso__texto')].map((a) => a.textContent);
window.__titulo = () => document.querySelector('h1')?.textContent ?? '';
window.__enviar = () => document.querySelector('form').requestSubmit();
`;

let fallas = 0;

function verificar(cumple, descripcion, detalle = '') {
  console.log(`${cumple ? '✔' : '✘'} ${descripcion}${!cumple && detalle ? ` → ${detalle}` : ''}`);
  if (!cumple) fallas += 1;
}

const servidor = await preview({ preview: { port: 4180 }, logLevel: 'silent' });
const url = servidor.resolvedUrls.local[0];
const chrome = await abrirChrome();
const { enviar, evaluar } = chrome;

async function abrirApp() {
  await enviar('Page.navigate', { url });
  await esperar(900);
  await evaluar(AYUDANTES);
}

async function agregarTarea(titulo, hora, horas, minutos) {
  await evaluar(`__poner(__control('Título'), ${JSON.stringify(titulo)})`);
  await evaluar(`__poner(__control('Fecha'), '2026-10-23'); __hora('Hora de inicio', '${hora}')`);
  await evaluar(`__poner(document.querySelector('[aria-label="Horas"]'), '${horas}'); __poner(document.querySelector('[aria-label="Minutos"]'), '${minutos}')`);
  await evaluar('__enviar()');
  await esperar(150);
}

try {
  await enviar('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await enviar('Page.addScriptToEvaluateOnNewDocument', { source: RELOJ_FIJO });
  await enviar('Browser.setPermission', { permission: { name: 'notifications' }, setting: 'denied' });

  // ── Primer uso ──
  await abrirApp();
  verificar((await evaluar('__titulo()')) === 'Do It', 'RF-INI-01: sin datos arranca en la bienvenida');
  await evaluar('__enviar()');
  const erroresBienvenida = await evaluar('__errores()');
  verificar(
    erroresBienvenida.includes('El nombre es obligatorio') && erroresBienvenida.includes('Marque al menos un día'),
    'CB-32 y CB-33: errores en línea en la bienvenida',
    JSON.stringify(erroresBienvenida),
  );
  verificar(await evaluar(`document.activeElement === __control('Ingrese su nombre')`), 'RF-UI-03: el foco va al primer campo con error');

  await evaluar(`__poner(__control('Ingrese su nombre'), 'Ana')`);
  await evaluar(`['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach((d) => document.querySelector('input[value="' + d + '"]').click())`);
  await evaluar(`__hora('Hora de entrada', '08:00'); __hora('Hora de salida', '17:00')`);
  await evaluar('__enviar()');
  await esperar(150);
  verificar((await evaluar('__titulo()')) === 'Agregue sus tareas', 'RF-INI-04: pasa al paso "Agregue sus tareas"');

  await agregarTarea('Tarea temprano', '07:30', '1', '0');
  verificar(
    (await evaluar('__errores()')).includes('La tarea debe quedar entre las 08:00 y las 17:00'),
    'CB-05: una tarea antes de la entrada muestra el error de RN-09',
  );
  await agregarTarea('Llamada con cliente', '09:00', '2', '0');
  await agregarTarea('Revisar correos', '13:00', '0', '45');
  await agregarTarea('  LLAMADA con cliente ', '15:00', '1', '0');
  verificar(
    (await evaluar('__errores()')).includes('Ya tiene una tarea con ese título esta semana'),
    'CB-09: un título duplicado muestra el error de RN-01',
  );

  await abrirApp();
  verificar((await evaluar('__titulo()')) === 'Agregue sus tareas', 'CB-35: tras recargar sigue en el mismo paso');
  verificar(
    (await evaluar(`document.querySelector('.subtitulo').textContent`)) === 'Tareas agregadas (2)',
    'RF-PER-05: las tareas sobreviven a F5',
  );

  await evaluar(`__boton('Continuar').click()`);
  await esperar(150);
  verificar(
    await evaluar(`document.querySelector('[aria-label="Primer recordatorio: horas"]').options.length === 25`),
    'RF-UI-07: la lista de horas tiene "Ninguno" y 00–23, sin dar la vuelta',
  );
  verificar(
    await evaluar(`[...document.querySelector('[aria-label="Primer recordatorio: minutos"]').options].at(-1).value === '59'`),
    'RF-UI-07: la lista de minutos termina en 59',
  );
  await evaluar(`__hora('Primer recordatorio', '08:00'); __hora('Segundo recordatorio', '08:00')`);
  await evaluar('__enviar()');
  verificar(
    (await evaluar('__errores()')).includes('Los dos recordatorios no pueden tener la misma hora'),
    'CB-27: dos recordatorios a la misma hora se rechazan',
  );
  await evaluar(`__hora('Segundo recordatorio', '')`);
  await evaluar('__enviar()');
  await esperar(300);
  verificar(await evaluar(`!!document.querySelector('.encabezado')`), 'RF-INI-07: al terminar muestra el calendario');
  verificar(
    (await evaluar(`document.querySelector('.encabezado__saludo').textContent`)) === 'Hola, Ana',
    'RF-INI-08: el encabezado saluda con el nombre',
  );
  const avisos = await evaluar('__avisos()');
  verificar(
    avisos.includes('Los recordatorios aparecerán solo dentro de la app'),
    'CB-31: con el permiso de notificaciones denegado se avisa que todo será dentro de la app',
    JSON.stringify(avisos),
  );
  verificar(
    !avisos.some((aviso) => aviso.startsWith('Resumen del día')),
    'CB-41: un recordatorio con hora ya pasada no avisa hoy',
    JSON.stringify(avisos),
  );

  // ── Calendario con datos de demostración ──
  await evaluar(`localStorage.setItem('do-it:v1', ${JSON.stringify(JSON.stringify(estadoDeDemostracion()))})`);
  await abrirApp();
  verificar((await evaluar(`document.querySelectorAll('.bloque').length`)) === 7, 'RN-08: nueve tareas se dibujan en siete bloques');
  verificar((await evaluar(`document.querySelector('.bloque--grupo .insignia')?.textContent`)) === '+2', 'CB-14: el grupo superpuesto lleva "+2"');
  verificar(
    (await evaluar(`document.querySelector('.vencidas__resumen')?.textContent`)) === 'Vencidas (1)' &&
      (await evaluar(`document.querySelector('.vencidas .fila-tarea__titulo')?.textContent`)) === 'Enviar cotización',
    'RN-05: la tarea vencida del miércoles aparece en "Vencidas" arriba del calendario',
  );
  const cronometro = await evaluar(`document.querySelector('.cronometro-en-curso .cronometro')?.textContent ?? ''`);
  verificar(/^0:2[2-3]:\d\d$/.test(cronometro), 'RF-CRO-04: el encabezado muestra el cronómetro en curso', cronometro);

  await evaluar(`document.querySelector('.bloque--grupo .bloque__abrir').click()`);
  await esperar(150);
  verificar((await evaluar(`document.querySelectorAll('dialog .fila-tarea').length`)) === 3, 'RN-08: el grupo despliega sus tres tareas');
  await evaluar(`document.querySelector('dialog').close()`);

  // RN-12 y CB-23: la meta sugerida solo se escribe si el usuario no escribió una.
  await evaluar(`__boton('Nueva tarea').click()`);
  await esperar(150);
  await evaluar(`__poner(__control('Título'), 'informe SEMANAL')`);
  verificar(
    (await evaluar(`document.querySelector('.sugerencia').textContent`)).includes('La última vez le tomó 1 h 20 min'),
    'RN-12: sugiere la meta de una tarea repetida',
  );
  verificar(
    (await evaluar(`document.querySelector('[aria-label="Horas"]').value + ':' + document.querySelector('[aria-label="Minutos"]').value`)) === '1:20',
    'RN-12: con la meta vacía la escribe',
  );
  await evaluar(`document.querySelector('dialog').close()`);

  await evaluar(`__boton('Nueva tarea').click()`);
  await esperar(150);
  await evaluar(`__poner(document.querySelector('[aria-label="Horas"]'), '0'); __poner(document.querySelector('[aria-label="Minutos"]'), '45')`);
  await evaluar(`__poner(__control('Título'), 'Informe semanal')`);
  verificar(!(await evaluar(`document.querySelector('.sugerencia').hidden`)), 'CB-23: muestra la sugerencia aunque ya haya una meta');
  verificar(
    (await evaluar(`document.querySelector('[aria-label="Horas"]').value + ':' + document.querySelector('[aria-label="Minutos"]').value`)) === '0:45',
    'CB-23: no sobrescribe la meta que escribió el usuario',
  );
  await evaluar(`document.querySelector('dialog').close()`);

  // ── Teléfono de 360 px (RF-UI-04, RF-UI-06) ──
  await enviar('Emulation.setDeviceMetricsOverride', { width: 360, height: 780, deviceScaleFactor: 2, mobile: true });
  await esperar(300);
  const anchoDePagina = await evaluar('document.documentElement.scrollWidth');
  verificar(anchoDePagina <= 360, 'RF-UI-04: sin desplazamiento horizontal de la página a 360 px', `${anchoDePagina} px`);
  verificar(
    (await evaluar(`getComputedStyle(document.querySelector('.cuadricula__horas')).position`)) === 'sticky',
    'RF-UI-06: en la Semana la columna de horas queda fija',
  );

  // ── Datos dañados (CB-39) ──
  await enviar('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluar(`localStorage.setItem('do-it:v1', '{"version":1,')`);
  await abrirApp();
  verificar((await evaluar('__titulo()')) === 'No se pudieron leer sus datos', 'CB-39: con datos dañados muestra el error');
  verificar((await evaluar(`localStorage.getItem('do-it:v1')`)) === '{"version":1,', 'RF-PER-03: los datos dañados no se sobrescriben');

  verificar(chrome.erroresDeLaPagina.length === 0, 'Sin errores en la consola de la página', chrome.erroresDeLaPagina.join(' | '));
} finally {
  chrome.cerrar();
  await servidor.close();
}

console.log(fallas === 0 ? '\nTodas las pruebas del navegador pasaron.' : `\n${fallas} prueba(s) del navegador fallaron.`);
process.exitCode = fallas === 0 ? 0 : 1;
