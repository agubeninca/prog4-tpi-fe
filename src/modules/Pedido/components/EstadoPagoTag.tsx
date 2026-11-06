import { Tag } from 'antd';
import { COLOR_PAGO, ETIQUETA_PAGO, type EstadoPago } from '../services/pedido.service';

/** `corto`: "Pendiente" en vez de "Pendiente de pago" (ej. en una columna titulada "Pago"). */
export function EstadoPagoTag({ pagado, corto }: { pagado: EstadoPago; corto?: boolean }) {
  const etiqueta = corto && pagado === 'PENDIENTE' ? 'Pendiente' : ETIQUETA_PAGO[pagado];
  return (
    <Tag color={COLOR_PAGO[pagado]} style={{ marginInlineEnd: 0 }}>
      {etiqueta}
    </Tag>
  );
}
