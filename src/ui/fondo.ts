// RF-EST-08: cada luz del fondo viaja a una posición al azar y, al llegar, elige otra.
// El intervalo coincide con --duracion-luces de fondo.css para que el movimiento no se detenga.
const CANTIDAD_DE_LUCES = 3;
const DURACION_DEL_VIAJE_MS = 14_000;
const MARGEN_PORCENTUAL = 5;

function porcentajeAlAzar(): string {
  return `${MARGEN_PORCENTUAL + Math.random() * (100 - 2 * MARGEN_PORCENTUAL)}%`;
}

export function moverLucesDelFondo(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const raiz = document.documentElement;
  const viajar = () => {
    for (let luz = 1; luz <= CANTIDAD_DE_LUCES; luz += 1) {
      raiz.style.setProperty(`--luz-${luz}-x`, porcentajeAlAzar());
      raiz.style.setProperty(`--luz-${luz}-y`, porcentajeAlAzar());
    }
  };
  // Primer viaje en el cuadro siguiente, para que la transición parta de la posición inicial.
  window.requestAnimationFrame(viajar);
  window.setInterval(viajar, DURACION_DEL_VIAJE_MS);
}
