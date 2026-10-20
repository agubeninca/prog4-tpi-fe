import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ClienteSesion, MesaPublica } from '../modules/ClienteMesa/services/clienteMesa.service';

export interface MesaSesion extends MesaPublica {
  hash: string;
}

interface SesionClienteState {
  mesa: MesaSesion | null;
  cliente: ClienteSesion | null;
  /** Ids de los pedidos hechos en esta sesión (para "Mis pedidos"). */
  pedidos: number[];
  /** Devuelve true si se cambió de mesa (y por lo tanto se limpió la sesión anterior). */
  iniciarMesa: (mesa: MesaSesion) => boolean;
  identificar: (cliente: ClienteSesion) => void;
  agregarPedido: (idPedido: number) => void;
}

// sessionStorage: la sesión vive mientras la pestaña esté abierta (sobrevive a recargas).
export const useSesionClienteStore = create<SesionClienteState>()(
  persist(
    (set, get) => ({
      mesa: null,
      cliente: null,
      pedidos: [],
      iniciarMesa: (mesa) => {
        const cambioDeMesa = get().mesa?.hash !== mesa.hash;
        set(cambioDeMesa ? { mesa, cliente: null, pedidos: [] } : { mesa });
        return cambioDeMesa;
      },
      identificar: (cliente) => set({ cliente }),
      agregarPedido: (idPedido) => set((state) => ({ pedidos: [...state.pedidos, idPedido] })),
    }),
    { name: 'kitch-sesion-cliente', storage: createJSONStorage(() => sessionStorage) },
  ),
);
