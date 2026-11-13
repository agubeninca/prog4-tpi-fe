import { api } from '../../../shared/api';

export interface Mozo {
  id_mozo: number;
  nombre: string;
  /** Inactivo: no aparece para elegir al cargar una comanda. */
  activo: boolean;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  /** Números de las mesas que atiende ahora (con pedidos sin pagar ni cancelar). */
  mesas_atendiendo: number[];
}

export interface MozoInput {
  nombre?: string;
  activo?: boolean;
}

/** Lo que se muestra de un mozo en pedidos y mesas. */
export type MozoResumen = Pick<Mozo, 'id_mozo' | 'nombre'>;

export const mozoService = {
  getAll: () => api.get<Mozo[]>('/mozos').then((res) => res.data),
  create: (data: MozoInput) => api.post<Mozo>('/mozos', data).then((res) => res.data),
  update: (id: number, data: MozoInput) => api.patch<Mozo>(`/mozos/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/mozos/${id}`),
};
