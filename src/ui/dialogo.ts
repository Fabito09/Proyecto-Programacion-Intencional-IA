// Diálogos modales con <dialog>: Escape y clic afuera los cierran.
import { boton, botonIcono } from './componentes/boton';
import { agregarHijos, el, idUnico, type Hijo } from './dom';

export function abrirDialogo(titulo: string, construir: (cerrar: () => void) => Hijo[], alCerrar?: () => void): void {
  const idTitulo = idUnico('dialogo');
  const dialogo = el('dialog', { clase: 'dialogo', atributos: { 'aria-labelledby': idTitulo } });
  const cerrar = () => dialogo.close();
  dialogo.addEventListener('close', () => {
    dialogo.remove();
    alCerrar?.();
  });
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) cerrar();
  });

  const contenido = el(
    'div',
    { clase: 'dialogo__contenido' },
    el(
      'div',
      { clase: 'dialogo__encabezado' },
      el('h2', { clase: 'dialogo__titulo', atributos: { id: idTitulo } }, titulo),
      botonIcono('cerrar', 'Cerrar', cerrar),
    ),
  );
  agregarHijos(contenido, construir(cerrar));
  dialogo.append(contenido);
  document.body.append(dialogo);
  dialogo.showModal();
}

/** Pide una confirmación explícita (RF-TAR-11, RF-PER-03). */
export function confirmar(titulo: string, mensaje: string, textoAceptar: string): Promise<boolean> {
  return new Promise((resolver) => {
    let aceptado = false;
    abrirDialogo(
      titulo,
      (cerrar) => [
        el('p', { clase: 'dialogo__mensaje' }, mensaje),
        el(
          'div',
          { clase: 'acciones' },
          boton('Cancelar', { variante: 'fantasma', alHacerClic: cerrar }),
          boton(textoAceptar, {
            variante: 'peligro',
            alHacerClic: () => {
              aceptado = true;
              cerrar();
            },
          }),
        ),
      ],
      () => resolver(aceptado),
    );
  });
}
