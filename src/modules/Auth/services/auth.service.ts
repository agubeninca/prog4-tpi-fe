import { api } from '../../../shared/api';

export type UsuarioRol = 'ADMIN' | 'BARRA' | 'COCINA';

export interface UsuarioSesion {
  id_usuario: number;
  nombre_usuario: string;
  nombre: string;
  rol: UsuarioRol;
}

export const ETIQUETA_ROL: Record<UsuarioRol, string> = {
  ADMIN: 'Administración',
  BARRA: 'Barra',
  COCINA: 'Cocina (solo lectura)',
};

/** Qué puede hacer cada rol, para mostrarlo al elegirlo. */
export const DESCRIPCION_ROL: Record<UsuarioRol, string> = {
  ADMIN: 'Acceso a todo el panel de administración y al de comandas.',
  BARRA: 'Panel de comandas: toma los pedidos, los marca como servidos o los cancela.',
  COCINA: 'Panel de comandas en modo visualización: ve qué hay que preparar, sin cambiar estados.',
};

/** Roles que pueden cambiar el estado de una comanda (COCINA solo la ve). */
export function puedeGestionarComandas(rol: UsuarioRol | undefined) {
  return rol === 'ADMIN' || rol === 'BARRA';
}

// El personal entra con un nombre de usuario (ej. "cocina1", "jperez" o un legajo), pero Firebase Auth
// necesita un email: se usa uno interno que nadie ve. Debe coincidir con el backend (usuarios/cuenta-firebase.ts).
const DOMINIO_CUENTAS = 'kitch.local';

export const NOMBRE_USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;
export const NOMBRE_USUARIO_MENSAJE = 'Entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo, sin espacios';

/** "  JPerez " → "jperez": los usuarios se guardan en minúsculas. */
export function normalizarNombreUsuario(valor: string) {
  return valor.trim().toLowerCase();
}

export function emailInterno(nombreUsuario: string) {
  return `${normalizarNombreUsuario(nombreUsuario)}@${DOMINIO_CUENTAS}`;
}

export function rutaInicioPorRol(rol: UsuarioRol) {
  return rol === 'ADMIN' ? '/admin' : '/cocina';
}

export const authService = {
  me: () => api.get<UsuarioSesion>('/auth/me').then((res) => res.data),
};
