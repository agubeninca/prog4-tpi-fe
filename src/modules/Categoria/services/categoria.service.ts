import { api } from '../../../shared/api';

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  _count?: { producto: number };
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
}

export const categoriaService = {
  getAll: () => api.get<Categoria[]>('/categorias').then((res) => res.data),
  create: (data: CategoriaInput) => api.post<Categoria>('/categorias', data).then((res) => res.data),
  update: (id: number, data: CategoriaInput) => api.patch<Categoria>(`/categorias/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/categorias/${id}`),
};
