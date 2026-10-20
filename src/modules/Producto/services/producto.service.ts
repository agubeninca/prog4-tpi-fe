import { api } from '../../../shared/api';

export interface Producto {
  id_producto: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  estado_pausado: boolean;
  ruta_imagen: string | null;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  categoria: { id_categoria: number; nombre: string };
}

export interface ProductoInput {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  precio: number;
}

export const productoService = {
  getAll: () => api.get<Producto[]>('/productos').then((res) => res.data),
  create: (data: ProductoInput) => api.post<Producto>('/productos', data).then((res) => res.data),
  update: (id: number, data: ProductoInput) => api.patch<Producto>(`/productos/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/productos/${id}`),
  pausar: (id: number, estado_pausado: boolean) =>
    api.patch<Producto>(`/productos/${id}/pausa`, { estado_pausado }).then((res) => res.data),
  subirImagen: (id: number, archivo: File) => {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return api
      .post<Producto>(`/productos/${id}/imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};
