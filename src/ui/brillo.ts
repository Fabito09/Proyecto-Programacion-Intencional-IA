// RF-EST-07: publica la posición del mouse en --brillo-x / --brillo-y para que el CSS
// ilumine los bordes cercanos. Una sola escucha para toda la página, una vez por cuadro.
export function activarBrilloDeBordes(): void {
  const raiz = document.documentElement;
  let posicion: { x: number; y: number } | null = null;
  let cuadroPendiente = false;

  const aplicar = () => {
    cuadroPendiente = false;
    if (posicion === null) return;
    raiz.style.setProperty('--brillo-x', `${posicion.x}px`);
    raiz.style.setProperty('--brillo-y', `${posicion.y}px`);
  };

  window.addEventListener(
    'pointermove',
    (evento) => {
      if (evento.pointerType !== 'mouse') return;
      posicion = { x: evento.clientX, y: evento.clientY };
      if (!cuadroPendiente) {
        cuadroPendiente = true;
        window.requestAnimationFrame(aplicar);
      }
    },
    { passive: true },
  );

  // Al salir el mouse de la ventana se apaga el brillo.
  raiz.addEventListener('mouseleave', () => {
    posicion = null;
    raiz.style.removeProperty('--brillo-x');
    raiz.style.removeProperty('--brillo-y');
  });
}
