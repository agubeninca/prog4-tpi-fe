import { api } from '../../../shared/api';
import { PUBLIC_APP_URL } from '../../../shared/entorno';
import type { MozoResumen } from '../../Mozo/services/mozo.service';

export interface Mesa {
  id_mesa: number;
  numero_mesa: number;
  hash_codigo_qr: string;
  activa: boolean;
  archivado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/** Mesa habilitada para cargar comandas, con el mozo que la atiende ahora (null: libre). */
export interface MesaActiva {
  id_mesa: number;
  numero_mesa: number;
  mozo: MozoResumen | null;
}

export interface MesaInput {
  numero_mesa: number;
  activa?: boolean;
}

/** URL que se codifica en el QR impreso de la mesa (RF-02). */
export function urlMesa(hashCodigoQr: string) {
  return `${PUBLIC_APP_URL}/m/${hashCodigoQr}`;
}

export const mesaService = {
  getAll: () => api.get<Mesa[]>('/mesas').then((res) => res.data),
  /** Mesas habilitadas y quién las atiende (lo usa la Barra para cargar comandas a mano). */
  getActivas: () => api.get<MesaActiva[]>('/mesas/activas').then((res) => res.data),
  create: (data: MesaInput) => api.post<Mesa>('/mesas', data).then((res) => res.data),
  update: (id: number, data: MesaInput) => api.patch<Mesa>(`/mesas/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/mesas/${id}`),
  regenerarQr: (id: number) => api.post<Mesa>(`/mesas/${id}/regenerar-qr`).then((res) => res.data),
};
