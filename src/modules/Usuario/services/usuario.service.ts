import { api } from '../../../shared/api';
import type { UsuarioRol } from '../../Auth/services/auth.service';

export interface Usuario {
  id_usuario: number;
  firebase_uid: string;
  email: string;
  nombre: string;
  rol: UsuarioRol;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface UsuarioInput {
  email: string;
  nombre: string;
  rol: UsuarioRol;
  /** Obligatoria al crear; al editar, solo si se quiere cambiar. */
  password?: string;
}

export const usuarioService = {
  getAll: () => api.get<Usuario[]>('/usuarios').then((res) => res.data),
  create: (data: UsuarioInput) => api.post<Usuario>('/usuarios', data).then((res) => res.data),
  // El email no se edita (identifica la cuenta en Firebase Auth).
  update: (id: number, { nombre, rol, password }: UsuarioInput) =>
    api
      .patch<Usuario>(`/usuarios/${id}`, { nombre, rol, ...(password && { password }) })
      .then((res) => res.data),
  remove: (id: number) => api.delete(`/usuarios/${id}`),
};
