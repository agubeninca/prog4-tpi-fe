import { Tag } from 'antd';
import Decimal from 'decimal.js';
import { formatearMoneda } from '../../../shared/moneda';

/** "Coincide", "Sobran $X" o "Faltan $X" según contado − esperado. */
export function DiferenciaCaja({ diferencia }: { diferencia: string | number | null }) {
  if (diferencia === null || diferencia === '') return <>—</>;
  const valor = new Decimal(diferencia);
  if (valor.isZero()) return <Tag color="green">Coincide</Tag>;
  return valor.isPositive() ? (
    <Tag color="gold">Sobran {formatearMoneda(valor.toString())}</Tag>
  ) : (
    <Tag color="red">Faltan {formatearMoneda(valor.abs().toString())}</Tag>
  );
}
