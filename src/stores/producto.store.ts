import { createCrudStore } from '../shared/createCrudStore';
import { productoService, type Producto, type ProductoInput } from '../modules/Producto/services/producto.service';

export const useProductoStore = createCrudStore<Producto, ProductoInput>(productoService);

/** Reemplaza un producto en el listado sin volver a pedir todo (ej. después de pausar o subir imagen). */
export function reemplazarProducto(producto: Producto) {
  useProductoStore.setState((state) => ({
    items: state.items.map((item) => (item.id_producto === producto.id_producto ? producto : item)),
  }));
}
