import type { ReactNode } from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FireOutlined } from '@ant-design/icons';
import { Card, Flex, Statistic, Typography } from 'antd';
import type { EstadoPedido } from '../../Pedido/services/pedido.service';

/** Mismos colores que las etiquetas de estado (EstadoPedidoTag): gold, blue, green, red de AntD. */
const ESTILO_ESTADO: Record<EstadoPedido, { titulo: string; color: string; icono: ReactNode }> = {
  PENDIENTE: { titulo: 'Pendientes', color: '#faad14', icono: <ClockCircleOutlined /> },
  EN_PREPARACION: { titulo: 'En preparación', color: '#1677ff', icono: <FireOutlined /> },
  SERVIDO: { titulo: 'Servidos', color: '#52c41a', icono: <CheckCircleOutlined /> },
  CANCELADO: { titulo: 'Cancelados', color: '#ff4d4f', icono: <CloseCircleOutlined /> },
};

interface EstadoStatCardProps {
  estado: EstadoPedido;
  cantidad: number;
  loading?: boolean;
}

export function EstadoStatCard({ estado, cantidad, loading }: EstadoStatCardProps) {
  const { titulo, color, icono } = ESTILO_ESTADO[estado];

  return (
    <Card style={{ height: '100%', borderTop: `3px solid ${color}` }}>
      <Statistic
        loading={loading}
        title={
          <Flex align="center" gap={6} style={{ whiteSpace: 'nowrap' }}>
            <span style={{ color }}>{icono}</span>
            <Typography.Text type="secondary" ellipsis>
              {titulo}
            </Typography.Text>
          </Flex>
        }
        value={cantidad}
      />
    </Card>
  );
}
