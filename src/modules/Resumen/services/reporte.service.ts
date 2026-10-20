import { api } from '../../../shared/api';
import type { EstadoPedido } from '../../Pedido/services/pedido.service';

export interface VentasDelDia {
  fecha: string;
  /** Suma de los pedidos SERVIDO del día. */
  total: string;
  cantidad_pedidos: number;
  cantidad_por_estado: Record<EstadoPedido, number>;
}

export const reporteService = {
  ventasDelDia: (fecha: string) =>
    api.get<VentasDelDia>('/reportes/ventas-dia', { params: { fecha } }).then((res) => res.data),
};
