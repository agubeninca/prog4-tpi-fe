import { Tag } from 'antd';
import { COLOR_ESTADO, ETIQUETA_ESTADO, type EstadoPedido } from '../services/pedido.service';

export function EstadoPedidoTag({ estado }: { estado: EstadoPedido }) {
  return <Tag color={COLOR_ESTADO[estado]}>{ETIQUETA_ESTADO[estado]}</Tag>;
}
