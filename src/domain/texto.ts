/** Texto normalizado del glosario: sin espacios sobrantes, en minúsculas y sin tildes. */
export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
