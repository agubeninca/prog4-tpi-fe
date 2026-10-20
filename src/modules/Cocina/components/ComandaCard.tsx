import { CheckOutlined, CloseOutlined, FireOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Comanda } from '../comanda';

interface ComandaCardProps {
  comanda: Comanda;
  /** Momento de referencia para "hace X minutos" (se actualiza periódicamente). */
  ahora: Date;
  procesando: boolean;
  onAvanzar: () => void;
  onCancelar: () => void;
}

/** Más de 15 minutos sin servirse: se resalta. */
const MINUTOS_DEMORA = 15;

export function ComandaCard({ comanda, ahora, procesando, onAvanzar, onCancelar }: ComandaCardProps) {
  const ingreso = dayjs(comanda.fecha_hora_ingreso);
  const demorada = dayjs(ahora).diff(ingreso, 'minute') >= MINUTOS_DEMORA;
  const pendiente = comanda.estado === 'PENDIENTE';

  return (
    <Card
      title={<span style={{ fontSize: 20 }}>Mesa {comanda.numero_mesa}</span>}
      extra={<Typography.Text type="secondary">#{comanda.id_pedido}</Typography.Text>}
      style={{ borderColor: demorada ? '#ff7875' : undefined }}
      styles={{ body: { paddingTop: 12 } }}
    >
      <Flex justify="space-between" wrap gap={8} style={{ marginBottom: 8 }}>
        <Typography.Text strong>{comanda.cliente.nombre}</Typography.Text>
        <Typography.Text type={demorada ? 'danger' : 'secondary'}>
          {ingreso.format('HH:mm')} · {ingreso.isAfter(ahora) ? 'recién' : ingreso.from(ahora)}
        </Typography.Text>
      </Flex>
      <Flex vertical gap={4}>
        {comanda.items.map((item) => (
          <Typography.Text key={item.nombre} style={{ fontSize: 16 }}>
            <strong>{item.cantidad} ×</strong> {item.nombre}
          </Typography.Text>
        ))}
      </Flex>
      <Flex gap={8} style={{ marginTop: 12 }}>
        <Button
          type="primary"
          size="large"
          style={{ flex: 1 }}
          icon={pendiente ? <FireOutlined /> : <CheckOutlined />}
          loading={procesando}
          onClick={onAvanzar}
        >
          {pendiente ? 'Tomar' : 'Servido'}
        </Button>
        <Button size="large" danger icon={<CloseOutlined />} disabled={procesando} onClick={onCancelar}>
          Cancelar
        </Button>
      </Flex>
    </Card>
  );
}
