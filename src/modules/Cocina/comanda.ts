import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { EstadoPago, EstadoPedido, Facturacion, MedioPago, OrigenPedido } from '../Pedido/services/pedido.service';

export const COLECCION_COMANDAS = 'pedidos_activos';

/** Documento que el backend escribe en Firestore por cada pedido (ver ComandasService). */
export interface Comanda {
  id_pedido: number;
  numero_mesa: number;
  cliente: { dni: string; nombre: string };
  /** Mozo que atiende la mesa (comandas manuales). Falta en las comandas anteriores a los mozos. */
  mozo?: string | null;
  estado: EstadoPedido;
  /** Puede faltar en comandas anteriores a la carga manual. */
  origen?: OrigenPedido;
  /** Puede faltar en comandas anteriores al estado de pago (se toman como pendientes). */
  pagado?: EstadoPago;
  medio_pago?: MedioPago | null;
  /** Pueden faltar en comandas anteriores al registro de consumidor final / cuenta. */
  facturacion?: Facturacion | null;
  cuenta_nombre?: string | null;
  cuenta_cuit?: string | null;
  motivo_cancelacion: string | null;
  items: { nombre: string; cantidad: number }[];
  precio_total: string;
  fecha_hora_ingreso: Date;
}

export function aComanda(documento: QueryDocumentSnapshot<DocumentData>): Comanda {
  const datos = documento.data();
  return {
    ...(datos as Omit<Comanda, 'fecha_hora_ingreso'>),
    fecha_hora_ingreso: (datos.fecha_hora_ingreso as Timestamp).toDate(),
  };
}
