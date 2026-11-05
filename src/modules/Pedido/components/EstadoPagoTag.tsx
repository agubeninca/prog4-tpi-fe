import { Tag } from 'antd';
import { COLOR_PAGO, ETIQUETA_PAGO, type EstadoPago } from '../services/pedido.service';

export function EstadoPagoTag({ pagado }: { pagado: EstadoPago }) {
  return <Tag color={COLOR_PAGO[pagado]}>{ETIQUETA_PAGO[pagado]}</Tag>;
}
