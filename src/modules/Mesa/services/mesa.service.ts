import { api } from '../../../shared/api';

export interface Mesa {
  id_mesa: number;
  numero_mesa: number;
  hash_codigo_qr: string;
  activa: boolean;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface MesaInput {
  numero_mesa: number;
  activa?: boolean;
}

/** URL que se codifica en el QR impreso de la mesa (RF-02). */
export function urlMesa(hashCodigoQr: string) {
  return `${import.meta.env.VITE_PUBLIC_APP_URL}/m/${hashCodigoQr}`;
}

export const mesaService = {
  getAll: () => api.get<Mesa[]>('/mesas').then((res) => res.data),
  create: (data: MesaInput) => api.post<Mesa>('/mesas', data).then((res) => res.data),
  update: (id: number, data: MesaInput) => api.patch<Mesa>(`/mesas/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/mesas/${id}`),
  regenerarQr: (id: number) => api.post<Mesa>(`/mesas/${id}/regenerar-qr`).then((res) => res.data),
};
