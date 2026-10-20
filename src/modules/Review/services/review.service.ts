import { api } from '../../../shared/api';

export interface Review {
  id_review: number;
  id_pedido: number;
  puntuacion: number;
  comentario: string | null;
  fecha_hora: string;
}

export interface ReviewAdmin extends Review {
  pedido: {
    id_pedido: number;
    mesa: { numero_mesa: number };
    cliente: { dni: string; nombre: string };
  };
}

export interface ListadoReviews {
  promedio: number | null;
  cantidad: number;
  reviews: ReviewAdmin[];
}

export interface FiltroReviews {
  desde?: string;
  hasta?: string;
}

export const reviewService = {
  getAll: (filtro: FiltroReviews = {}) =>
    api.get<ListadoReviews>('/reviews', { params: filtro }).then((res) => res.data),
};
