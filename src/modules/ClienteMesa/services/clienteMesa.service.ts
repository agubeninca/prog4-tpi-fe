import { api } from '../../../shared/api';
import type { Pedido } from '../../Pedido/services/pedido.service';
import type { Review } from '../../Review/services/review.service';

export interface MesaPublica {
  id_mesa: number;
  numero_mesa: number;
}

export interface ClienteSesion {
  dni: string;
  /** null si el DNI ya estaba registrado: por privacidad, el nombre completo no se devuelve a la mesa. */
  nombre: string | null;
}

export interface ConsultaDni {
  registrado: boolean;
  /** "A*** B***": para que la persona se reconozca sin exponer el nombre de otros. */
  nombre_enmascarado: string | null;
}

export interface Identificacion {
  dni: string;
  /** Solo al registrarse por primera vez. */
  nombre?: string;
}

export interface ProductoMenu {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  ruta_imagen: string | null;
  fecha_actualizacion: string;
}

export interface CategoriaMenu {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  productos: ProductoMenu[];
}

export interface PedidoCliente extends Pedido {
  review: Review[];
}

export interface NuevoPedido {
  hash_codigo_qr: string;
  dni: string;
  /** Solo hace falta si el cliente es nuevo; si ya existe, se ignora. */
  nombre?: string;
  items: { id_producto: number; cantidad: number }[];
}

export interface NuevaReview {
  dni: string;
  puntuacion: number;
  comentario?: string;
}

// Endpoints públicos: la Vista Cliente no tiene login (RF-02).
export const clienteMesaService = {
  getMesa: (hash: string) => api.get<MesaPublica>(`/mesas/qr/${hash}`).then((res) => res.data),
  consultarDni: (dni: string) => api.get<ConsultaDni>(`/clientes/consulta/${dni}`).then((res) => res.data),
  identificar: (datos: Identificacion) =>
    api.post<ClienteSesion & { registrado: boolean }>('/clientes/identificar', datos).then((res) => res.data),
  getMenu: () => api.get<CategoriaMenu[]>('/menu').then((res) => res.data),
  crearPedido: (pedido: NuevoPedido) => api.post<Pedido>('/pedidos', pedido).then((res) => res.data),
  getPedido: (id: number, dni: string) =>
    api.get<PedidoCliente>(`/pedidos/${id}`, { params: { dni } }).then((res) => res.data),
  crearReview: (idPedido: number, review: NuevaReview) =>
    api.post<Review>(`/pedidos/${idPedido}/reviews`, review).then((res) => res.data),
};
