// Validación del formulario de categoría (RF-CAT-02, RF-CAT-04).
import { COLORES_CATEGORIA, LIMITES, type Categoria, type ColorCategoria, type Id } from './modelo';
import { MENSAJES } from './mensajes';
import { exito, fallo, tieneErrores, type ErroresDeCampo, type Resultado } from './resultado';
import { normalizarTexto } from './texto';

export type CampoCategoria = 'nombre' | 'color';

export interface BorradorCategoria {
  nombre: string;
  color: string;
}

export interface DatosCategoria {
  nombre: string;
  color: ColorCategoria;
}

function esColor(texto: string): texto is ColorCategoria {
  return COLORES_CATEGORIA.some((color) => color === texto);
}

export function validarCategoria(
  borrador: BorradorCategoria,
  categorias: Categoria[],
  idEnEdicion: Id | null,
): Resultado<DatosCategoria, CampoCategoria> {
  const errores: ErroresDeCampo<CampoCategoria> = {};
  const nombre = borrador.nombre.trim();
  const nombreNormalizado = normalizarTexto(nombre);

  if (nombre === '') errores.nombre = MENSAJES.categoriaNombreObligatorio;
  else if (nombre.length > LIMITES.nombreCategoriaMaximo) {
    errores.nombre = MENSAJES.maximoCaracteres(LIMITES.nombreCategoriaMaximo);
  } else if (
    categorias.some((otra) => otra.id !== idEnEdicion && normalizarTexto(otra.nombre) === nombreNormalizado)
  ) {
    errores.nombre = MENSAJES.categoriaDuplicada;
  }
  if (!esColor(borrador.color)) errores.color = MENSAJES.elijaColor;

  if (tieneErrores(errores) || !esColor(borrador.color)) return fallo(errores);
  return exito({ nombre, color: borrador.color });
}
