import { create } from 'zustand';
import type { EstadoPedido } from '../Pedido/services/pedido.service';

interface EstadoEnVivo {
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
}

interface SeguimientoState {
  /** Último estado conocido de cada pedido de la sesión, según los eventos en vivo (SSE). */
  estados: Record<number, EstadoEnVivo>;
  registrar: (idPedido: number, estado: EstadoPedido, motivo: string | null) => void;
}

/**
 * Memoria de los estados recibidos en vivo. La usa el seguimiento para saber si algo cambió
 * (y avisar) y las pantallas del pedido para volver a consultarlo al instante. No se persiste:
 * al recargar la página el primer evento de cada pedido es el punto de partida y no avisa.
 */
export const useSeguimientoStore = create<SeguimientoState>((set) => ({
  estados: {},
  registrar: (idPedido, estado, motivo) =>
    set((state) => ({
      estados: { ...state.estados, [idPedido]: { estado, motivo_cancelacion: motivo } },
    })),
}));
