/** Deja solo los dígitos del CUIT (hasta 11). */
export function limpiarCuit(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 11);
}

/** "20123456789" → "20-12345678-9" (formatea a medida que se escribe). */
export function formatearCuit(valor: string): string {
  const digitos = limpiarCuit(valor);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 10) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

/** "Acme SRL · CUIT 30-71234567-1", o solo el nombre si no hay CUIT. */
export function describirCuenta(nombre: string | null | undefined, cuit: string | null | undefined): string {
  const partes = [nombre?.trim() || 'Cuenta sin nombre'];
  if (cuit) partes.push(`CUIT ${formatearCuit(cuit)}`);
  return partes.join(' · ');
}
