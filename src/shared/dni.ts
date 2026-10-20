export function limpiarDni(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 8);
}

export function formatearDni(valor: string): string {
  return limpiarDni(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
