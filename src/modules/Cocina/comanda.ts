import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import type { EstadoPedido } from '../Pedido/services/pedido.service';

export const COLECCION_COMANDAS = 'pedidos_activos';

/** Documento que el backend escribe en Firestore por cada pedido (ver ComandasService). */
export interface Comanda {
  id_pedido: number;
  numero_mesa: number;
  cliente: { dni: string; nombre: string };
  estado: EstadoPedido;
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
