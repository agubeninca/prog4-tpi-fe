import { api } from '../../../shared/api';

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'SERVIDO' | 'CANCELADO';

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  SERVIDO: 'Servido',
  CANCELADO: 'Cancelado',
};

export const COLOR_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'gold',
  EN_PREPARACION: 'blue',
  SERVIDO: 'green',
  CANCELADO: 'red',
};

export const ESTADOS_FINALES: EstadoPedido[] = ['SERVIDO', 'CANCELADO'];

export interface DetallePedido {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  producto: { id_producto: number; nombre: string };
}

export interface Pedido {
  id_pedido: number;
  id_mesa: number;
  dni_cliente: string;
  fecha_hora_ingreso: string;
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
  precio_total: string;
  fecha_actualizacion: string;
  mesa: { id_mesa: number; numero_mesa: number };
  cliente: { dni: string; nombre: string };
  detalle_pedido: DetallePedido[];
}

export interface FiltroPedidos {
  estado?: EstadoPedido;
  /** AAAA-MM-DD */
  fecha?: string;
}

export const pedidoService = {
  getAll: (filtro: FiltroPedidos = {}) => api.get<Pedido[]>('/pedidos', { params: filtro }).then((res) => res.data),
  cambiarEstado: (id: number, estado: EstadoPedido, motivo_cancelacion?: string) =>
    api.patch<Pedido>(`/pedidos/${id}/estado`, { estado, motivo_cancelacion }).then((res) => res.data),
};
