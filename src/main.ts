// Punto de entrada: solo conecta las capas.
import './styles/base.css';
import './styles/componentes.css';
import './styles/pantallas.css';
import './styles/calendario.css';
import './styles/brillo.css';
import './styles/fondo.css';
import { Aplicacion } from './services/aplicacion';
import { iniciarInterfaz } from './ui/app';
import { activarBrilloDeBordes } from './ui/brillo';

const raiz = document.getElementById('app');
if (raiz === null) throw new Error('Falta el elemento #app en index.html');

const aplicacion = new Aplicacion({
  almacen: window.localStorage,
  reloj: () => new Date(),
  generarId: () => crypto.randomUUID(),
});
aplicacion.cargar();
iniciarInterfaz(raiz, aplicacion);
activarBrilloDeBordes();
