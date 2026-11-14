import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';

interface BotonesOrdenProps {
  /** Posición actual (0 = primera) y cantidad total de la lista. */
  indice: number;
  total: number;
  onSubir: () => void;
  onBajar: () => void;
  /** Motivo por el que no se puede ordenar ahora (ej. "Elegí una categoría"); desactiva los botones. */
  deshabilitadoPor?: string;
  cargando?: boolean;
}

/** Flechas para subir o bajar un elemento en una lista ordenable. */
export function BotonesOrden({ indice, total, onSubir, onBajar, deshabilitadoPor, cargando }: BotonesOrdenProps) {
  const deshabilitado = !!deshabilitadoPor || cargando;
  return (
    <Tooltip title={deshabilitadoPor}>
      <Space.Compact>
        <Button
          size="small"
          icon={<ArrowUpOutlined />}
          aria-label="Subir"
          disabled={deshabilitado || indice === 0}
          onClick={onSubir}
        />
        <Button
          size="small"
          icon={<ArrowDownOutlined />}
          aria-label="Bajar"
          disabled={deshabilitado || indice === total - 1}
          onClick={onBajar}
        />
      </Space.Compact>
    </Tooltip>
  );
}
