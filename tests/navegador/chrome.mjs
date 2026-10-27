// Maneja Chrome sin ventana por el protocolo DevTools (CDP), sin dependencias:
// solo child_process, fetch y WebSocket, que ya trae Node 22.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RUTAS_CONOCIDAS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export const esperar = (milisegundos) => new Promise((resolver) => setTimeout(resolver, milisegundos));

function rutaDeChrome() {
  const ruta = RUTAS_CONOCIDAS.find((candidata) => candidata && existsSync(candidata));
  if (!ruta) throw new Error('No se encontró Chrome. Indique su ruta en la variable de entorno CHROME_PATH.');
  return ruta;
}

async function listarPaginas(puerto) {
  for (let intento = 0; intento < 50; intento += 1) {
    try {
      return await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
    } catch {
      await esperar(200); // Chrome todavía está arrancando.
    }
  }
  throw new Error('Chrome no respondió en el puerto de depuración.');
}

/** Abre Chrome sin ventana con un perfil nuevo y devuelve funciones para manejar su única pestaña. */
export async function abrirChrome() {
  const puerto = 9300 + Math.floor(Math.random() * 500);
  const perfil = mkdtempSync(join(tmpdir(), 'do-it-chrome-'));
  const proceso = spawn(
    rutaDeChrome(),
    ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', 'about:blank'],
    { stdio: 'ignore' },
  );

  const pagina = (await listarPaginas(puerto)).find((candidata) => candidata.type === 'page');
  const conexion = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((resolver, rechazar) => {
    conexion.addEventListener('open', resolver);
    conexion.addEventListener('error', rechazar);
  });

  let ultimoId = 0;
  const pendientes = new Map();
  const erroresDeLaPagina = [];
  conexion.addEventListener('message', (evento) => {
    const mensaje = JSON.parse(evento.data);
    if (mensaje.id && pendientes.has(mensaje.id)) {
      pendientes.get(mensaje.id)(mensaje);
      pendientes.delete(mensaje.id);
    }
    if (mensaje.method === 'Runtime.exceptionThrown') {
      erroresDeLaPagina.push(mensaje.params.exceptionDetails.exception?.description ?? 'Excepción sin descripción');
    }
  });

  const enviar = (metodo, parametros = {}) =>
    new Promise((resolver, rechazar) => {
      ultimoId += 1;
      pendientes.set(ultimoId, (mensaje) =>
        mensaje.error ? rechazar(new Error(`${metodo}: ${JSON.stringify(mensaje.error)}`)) : resolver(mensaje.result),
      );
      conexion.send(JSON.stringify({ id: ultimoId, method: metodo, params: parametros }));
    });

  /** Evalúa una expresión en la página y devuelve su valor. */
  const evaluar = async (expresion) => {
    const respuesta = await enviar('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
    if (respuesta.exceptionDetails) {
      throw new Error(`${expresion}\n→ ${respuesta.exceptionDetails.exception?.description}`);
    }
    return respuesta.result.value;
  };

  await enviar('Page.enable');
  await enviar('Runtime.enable');

  return {
    enviar,
    evaluar,
    erroresDeLaPagina,
    cerrar() {
      conexion.close();
      proceso.kill();
    },
  };
}
