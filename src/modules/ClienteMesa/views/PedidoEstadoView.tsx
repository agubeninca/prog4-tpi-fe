import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Rate, Result, Spin, Steps, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { ESTADOS_FINALES, type EstadoPedido } from '../../Pedido/services/pedido.service';
import { ReviewForm } from '../components/ReviewForm';
import { clienteMesaService, type PedidoCliente } from '../services/clienteMesa.service';

const INTERVALO_ACTUALIZACION_MS = 10_000;

const PASOS: { estado: EstadoPedido; titulo: string; detalle: string }[] = [
  { estado: 'PENDIENTE', titulo: 'Recibido', detalle: 'La cocina recibió tu pedido' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', detalle: 'Lo están preparando' },
  { estado: 'SERVIDO', titulo: 'Servido', detalle: '¡Que lo disfrutes!' },
];

export function PedidoEstadoView() {
  const { hash, id } = useParams();
  const idPedido = Number(id);
  const navigate = useNavigate();
  const cliente = useSesionClienteStore((state) => state.cliente);
  const [pedido, setPedido] = useState<PedidoCliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Se incrementa para volver a consultar el pedido (polling o review nueva). */
  const [consultas, setConsultas] = useState(0);
  const recargar = () => setConsultas((n) => n + 1);

  useEffect(() => {
    if (!cliente) return;
    let vigente = true;
    clienteMesaService
      .getPedido(idPedido, cliente.dni)
      .then((encontrado) => {
        if (!vigente) return;
        setPedido(encontrado);
        setError(null);
      })
      .catch((err: unknown) => vigente && setError(getErrorMessage(err)));
    return () => {
      vigente = false;
    };
  }, [cliente, idPedido, consultas]);

  // Mientras el pedido no termine, se consulta su estado cada 10 segundos.
  const terminado = pedido ? ESTADOS_FINALES.includes(pedido.estado) : false;
  useEffect(() => {
    if (terminado) return;
    const intervalo = setInterval(() => setConsultas((n) => n + 1), INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
  }, [terminado]);

  const volverAlMenu = () => navigate(`/m/${hash}/menu`);

  if (error && !pedido) {
    return <Result status="404" title="No encontramos tu pedido" subTitle={error} extra={<Button onClick={volverAlMenu}>Volver al menú</Button>} />;
  }

  if (!pedido || !cliente) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const pasoActual = PASOS.findIndex((paso) => paso.estado === pedido.estado);

  return (
    <Flex vertical gap={16}>
      <Card>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={volverAlMenu} style={{ paddingInline: 0 }}>
          Volver al menú
        </Button>
        <Typography.Title level={4} style={{ marginBottom: 0 }}>
          Pedido #{pedido.id_pedido}
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Mesa {pedido.mesa.numero_mesa} · {dayjs(pedido.fecha_hora_ingreso).format('HH:mm')}
        </Typography.Paragraph>

        {pedido.estado === 'CANCELADO' ? (
          <Result
            status="warning"
            title="Tu pedido fue cancelado"
            subTitle={pedido.motivo_cancelacion ?? undefined}
            style={{ padding: '16px 0' }}
          />
        ) : (
          <Steps
            orientation="vertical"
            current={pasoActual}
            status={pedido.estado === 'SERVIDO' ? 'finish' : 'process'}
            items={PASOS.map((paso) => ({ title: paso.titulo, content: paso.detalle }))}
          />
        )}

        <Divider style={{ margin: '8px 0 12px' }} />
        <Flex vertical gap={6}>
          {pedido.detalle_pedido.map((detalle) => (
            <Flex key={detalle.id_detalle} justify="space-between" gap={12}>
              <Typography.Text>
                {detalle.cantidad} × {detalle.producto.nombre}
              </Typography.Text>
              <Typography.Text style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(detalle.subtotal)}</Typography.Text>
            </Flex>
          ))}
        </Flex>
        <Flex justify="space-between" style={{ marginTop: 8 }}>
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong>{formatearMoneda(pedido.precio_total)}</Typography.Text>
        </Flex>
      </Card>

      {/* RF-09: la review se puede dejar en cualquier momento */}
      <Card title="Dejanos tu opinión">
        {pedido.review.length > 0 && (
          <Flex vertical gap={12} style={{ marginBottom: 16 }}>
            {pedido.review.map((review) => (
              <Flex key={review.id_review} vertical>
                <Rate disabled value={review.puntuacion} style={{ fontSize: 14 }} />
                {review.comentario && <Typography.Text>{review.comentario}</Typography.Text>}
              </Flex>
            ))}
            <Divider style={{ margin: 0 }} />
          </Flex>
        )}
        <ReviewForm idPedido={pedido.id_pedido} dni={cliente.dni} onCreada={recargar} />
      </Card>
    </Flex>
  );
}
