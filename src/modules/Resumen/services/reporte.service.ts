import { api } from '../../../shared/api';
import type { EstadoPedido, MedioPago } from '../../Pedido/services/pedido.service';

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

/** Lo que muestra un cierre de caja (del día o de un turno). */
export interface ResumenCaja {
  cobrado: {
    total: string;
    cantidad: number;
    por_medio: { medio: MedioPago | 'SIN_MEDIO'; cantidad: number; total: string }[];
    efectivo_en_caja: string;
    cuentas: { nombre: string; cuit: string | null; cantidad: number; total: string }[];
    /** Los pedidos por QR aparecen como "Sin mozo (QR)". */
    por_mozo: { nombre: string; cantidad: number; total: string }[];
  };
  sin_cobrar: {
    cantidad: number;
    total: string;
    pedidos: {
      id_pedido: number;
      fecha_hora_ingreso: string;
      precio_total: string;
      mesa: { numero_mesa: number };
      cliente: { nombre: string };
    }[];
  };
  en_curso: { cantidad: number; total: string };
  cancelados: { cantidad: number; total: string };
}

/** Cierre de caja de un día (por fecha de cobro). */
export interface CierreDeCaja extends ResumenCaja {
  fecha: string;
}

export type DiasEstadisticas = 7 | 30 | 90;

export interface Estadisticas {
  desde: string;
  hasta: string;
  dias: number;
  total: string;
  cantidad_pedidos: number;
  ventas_por_dia: { fecha: string; total: string; cantidad: number }[];
  ventas_por_hora: { hora: number; total: string; cantidad: number }[];
  ventas_por_mozo: { nombre: string; total: string; cantidad: number }[];
  top_productos: { id_producto: number; nombre: string; unidades: number; total: string }[];
}

export const reporteCajaService = {
  cierreDeCaja: (fecha: string) =>
    api.get<CierreDeCaja>('/reportes/cierre-caja', { params: { fecha } }).then((res) => res.data),
  estadisticas: (dias: DiasEstadisticas) =>
    api.get<Estadisticas>('/reportes/estadisticas', { params: { dias } }).then((res) => res.data),
};
