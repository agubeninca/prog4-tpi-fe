/** Copia de la lista con el elemento de `indice` movido `delta` posiciones (-1 sube, +1 baja). */
export function moverElemento<T>(lista: T[], indice: number, delta: number): T[] {
  const destino = indice + delta;
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}
