import { api } from '../../../shared/api';

export type UsuarioRol = 'ADMIN' | 'COCINA';

export interface UsuarioSesion {
  id_usuario: number;
  email: string;
  nombre: string;
  rol: UsuarioRol;
}

export const ETIQUETA_ROL: Record<UsuarioRol, string> = {
  ADMIN: 'Administración',
  COCINA: 'Cocina / Barra',
};

export function rutaInicioPorRol(rol: UsuarioRol) {
  return rol === 'ADMIN' ? '/admin' : '/cocina';
}

export const authService = {
  me: () => api.get<UsuarioSesion>('/auth/me').then((res) => res.data),
};
