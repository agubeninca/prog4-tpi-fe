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

export type EstadoPago = 'PENDIENTE' | 'PAGADO';

export const ETIQUETA_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente de pago',
  PAGADO: 'Pagado',
};

export const COLOR_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: 'orange',
  PAGADO: 'green',
};

/** QR: lo hizo el cliente desde la mesa. MANUAL: lo cargó la Barra. */
export type OrigenPedido = 'QR' | 'MANUAL';

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
  pagado: EstadoPago;
  origen: OrigenPedido;
  motivo_cancelacion: string | null;
  precio_total: string;
  fecha_actualizacion: string;
  mesa: { id_mesa: number; numero_mesa: number };
  cliente: { dni: string; nombre: string };
  detalle_pedido: DetallePedido[];
}

export interface FiltroPedidos {
  estado?: EstadoPedido;
  pagado?: EstadoPago;
  /** Un solo día, AAAA-MM-DD (lo usa el Resumen). */
  fecha?: string;
  /** Rango, AAAA-MM-DD. */
  desde?: string;
  hasta?: string;
  /** Nombre o DNI del cliente (parcial). */
  q?: string;
  numero_mesa?: number;
}

export interface NuevoPedidoManual {
  id_mesa: number;
  dni: string;
  /** Solo si el cliente es nuevo; si el DNI ya está registrado se ignora. */
  nombre?: string;
  items: { id_producto: number; cantidad: number }[];
  observacion?: string;
}

/** Comanda cargada a mano: cuándo, quién la cargó y qué se pidió. */
export interface RegistroComandaManual {
  id_registro: number;
  id_pedido: number;
  id_usuario: number;
  fecha_hora: string;
  /** Copia de la comanda al momento de cargarla, ej.: "2 × Café, 1 × Medialuna". */
  detalle: string;
  observacion: string | null;
  usuario: { id_usuario: number; nombre: string; nombre_usuario: string };
  pedido: Pedido;
}

/** El backend devuelve como máximo esta cantidad de pedidos por consulta. */
export const LIMITE_PEDIDOS = 500;

export const pedidoService = {
  getAll: (filtro: FiltroPedidos = {}) => api.get<Pedido[]>('/pedidos', { params: filtro }).then((res) => res.data),
  cambiarEstado: (id: number, estado: EstadoPedido, motivo_cancelacion?: string) =>
    api.patch<Pedido>(`/pedidos/${id}/estado`, { estado, motivo_cancelacion }).then((res) => res.data),
  crearManual: (pedido: NuevoPedidoManual) => api.post<Pedido>('/pedidos/manual', pedido).then((res) => res.data),
  getRegistroManual: (filtro: { desde?: string; hasta?: string } = {}) =>
    api.get<RegistroComandaManual[]>('/pedidos/manuales', { params: filtro }).then((res) => res.data),
  cambiarPago: (id: number, pagado: EstadoPago) =>
    api.patch<Pedido>(`/pedidos/${id}/pago`, { pagado }).then((res) => res.data),
};
