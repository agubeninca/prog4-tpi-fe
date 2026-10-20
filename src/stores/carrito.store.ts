import Decimal from 'decimal.js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProductoMenu } from '../modules/ClienteMesa/services/clienteMesa.service';

export const CANTIDAD_MAXIMA = 50;

export interface ItemCarrito {
  producto: ProductoMenu;
  cantidad: number;
}

interface CarritoState {
  items: ItemCarrito[];
  agregar: (producto: ProductoMenu) => void;
  cambiarCantidad: (idProducto: number, cantidad: number) => void;
  quitar: (idProducto: number) => void;
  vaciar: () => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set) => ({
      items: [],
      agregar: (producto) =>
        set((state) => {
          const existente = state.items.find((item) => item.producto.id_producto === producto.id_producto);
          if (existente) {
            return {
              items: state.items.map((item) =>
                item === existente ? { ...item, cantidad: Math.min(item.cantidad + 1, CANTIDAD_MAXIMA) } : item,
              ),
            };
          }
          return { items: [...state.items, { producto, cantidad: 1 }] };
        }),
      cambiarCantidad: (idProducto, cantidad) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.producto.id_producto === idProducto
              ? { ...item, cantidad: Math.max(1, Math.min(cantidad, CANTIDAD_MAXIMA)) }
              : item,
          ),
        })),
      quitar: (idProducto) =>
        set((state) => ({ items: state.items.filter((item) => item.producto.id_producto !== idProducto) })),
      vaciar: () => set({ items: [] }),
    }),
    { name: 'kitch-carrito', storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function cantidadEnCarrito(items: ItemCarrito[]) {
  return items.reduce((total, item) => total + item.cantidad, 0);
}

/** Total informativo: el precio real lo calcula siempre el backend al confirmar. */
export function totalCarrito(items: ItemCarrito[]) {
  return items.reduce((total, item) => total.plus(new Decimal(item.producto.precio).times(item.cantidad)), new Decimal(0));
}
