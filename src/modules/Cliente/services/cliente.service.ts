import { api } from '../../../shared/api';
import type { DetallePedido, EstadoPedido } from '../../Pedido/services/pedido.service';
import type { Review } from '../../Review/services/review.service';

export interface ClienteResumen {
  dni: string;
  nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  cantidad_pedidos: number;
  /** Suma de los pedidos SERVIDO (mismo criterio que el resumen de ventas). */
  total_gastado: string;
  ultima_visita: string | null;
  cantidad_reviews: number;
  promedio_puntuacion: number | null;
}

export interface PedidoDeCliente {
  id_pedido: number;
  fecha_hora_ingreso: string;
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
  precio_total: string;
  mesa: { id_mesa: number; numero_mesa: number };
  detalle_pedido: DetallePedido[];
  review: Review[];
}

export interface ReviewDeCliente extends Review {
  numero_mesa: number;
}

export interface ClienteDetalle {
  dni: string;
  nombre: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  metricas: {
    cantidad_pedidos: number;
    cantidad_por_estado: Record<EstadoPedido, number>;
    total_gastado: string;
    ticket_promedio: string | null;
    primera_visita: string | null;
    ultima_visita: string | null;
    cantidad_reviews: number;
    promedio_puntuacion: number | null;
    producto_favorito: { nombre: string; unidades: number } | null;
  };
  pedidos: PedidoDeCliente[];
  reviews: ReviewDeCliente[];
}

export const clienteService = {
  getAll: (q?: string) => api.get<ClienteResumen[]>('/clientes', { params: { q: q || undefined } }).then((res) => res.data),
  getOne: (dni: string) => api.get<ClienteDetalle>(`/clientes/${dni}`).then((res) => res.data),
};
