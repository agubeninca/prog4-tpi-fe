import Decimal from 'decimal.js';

export function formatearMoneda(valor: string | number): string {
  const [entero, decimales] = new Decimal(valor).toFixed(2).split('.');
  const enteroConPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${enteroConPuntos},${decimales}`;
}
