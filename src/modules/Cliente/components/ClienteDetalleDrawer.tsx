import { useEffect, useState } from 'react';
import {
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Rate,
  Result,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { EstadoPedidoTag } from '../../Pedido/components/EstadoPedidoTag';
import {
  COLOR_ESTADO,
  ETIQUETA_ESTADO,
  type DetallePedido,
  type EstadoPedido,
} from '../../Pedido/services/pedido.service';
import { clienteService, type ClienteDetalle, type PedidoDeCliente } from '../services/cliente.service';

const ANCHO_DRAWER = 780;
const ORDEN_ESTADOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'SERVIDO', 'CANCELADO'];

const fechaHora = (valor: string | null) => (valor ? dayjs(valor).format('DD/MM/YYYY HH:mm') : '—');

interface ClienteDetalleDrawerProps {
  /** DNI del cliente a mostrar; null cierra el drawer. */
  dni: string | null;
  onClose: () => void;
}

export function ClienteDetalleDrawer({ dni, onClose }: ClienteDetalleDrawerProps) {
  const [resultado, setResultado] = useState<{ dni: string; detalle?: ClienteDetalle; error?: string } | null>(null);

  useEffect(() => {
    if (!dni) return;
    let vigente = true;
    clienteService
      .getOne(dni)
      .then((detalle) => vigente && setResultado({ dni, detalle }))
      .catch((error: unknown) => vigente && setResultado({ dni, error: getErrorMessage(error) }));
    // Si se abre otro cliente antes de que responda, se descarta la respuesta vieja.
    return () => {
      vigente = false;
    };
  }, [dni]);

  const cargando = !!dni && resultado?.dni !== dni;
  const detalle = resultado?.dni === dni ? resultado.detalle : undefined;
  const error = resultado?.dni === dni ? resultado.error : undefined;

  return (
    <Drawer
      open={!!dni}
      onClose={onClose}
      size={Math.min(ANCHO_DRAWER, window.innerWidth)}
      title={detalle?.nombre ?? 'Cliente'}
      extra={dni && <Typography.Text type="secondary">DNI {formatearDni(dni)}</Typography.Text>}
      destroyOnHidden
    >
      {cargando && <Skeleton active paragraph={{ rows: 10 }} />}
      {error && <Result status="error" title="No se pudo cargar el cliente" subTitle={error} />}
      {detalle && <FichaCliente detalle={detalle} />}
    </Drawer>
  );
}

function FichaCliente({ detalle }: { detalle: ClienteDetalle }) {
  const { metricas } = detalle;

  return (
    <Flex vertical gap={24}>
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Pedidos" value={metricas.cantidad_pedidos} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Total gastado" value={formatearMoneda(metricas.total_gastado)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic
              title="Ticket promedio"
              value={metricas.ticket_promedio ? formatearMoneda(metricas.ticket_promedio) : '—'}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic
              title={`Reviews (${metricas.cantidad_reviews})`}
              value={metricas.promedio_puntuacion ?? '—'}
              suffix={metricas.promedio_puntuacion !== null ? '/ 5' : undefined}
            />
          </Card>
        </Col>
      </Row>

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          { key: 'dni', label: 'DNI', children: formatearDni(detalle.dni) },
          { key: 'nombre', label: 'Nombre y apellido', children: detalle.nombre },
          { key: 'alta', label: 'Cliente desde', children: fechaHora(detalle.fecha_creacion) },
          { key: 'ultima', label: 'Última visita', children: fechaHora(metricas.ultima_visita) },
          { key: 'primera', label: 'Primer pedido', children: fechaHora(metricas.primera_visita) },
          {
            key: 'favorito',
            label: 'Producto favorito',
            children: metricas.producto_favorito
              ? `${metricas.producto_favorito.nombre} (${metricas.producto_favorito.unidades} u.)`
              : '—',
          },
          {
            key: 'estados',
            label: 'Pedidos por estado',
            span: 'filled',
            children: (
              <Flex wrap gap={6}>
                {ORDEN_ESTADOS.map((estado) => (
                  <Tag key={estado} color={COLOR_ESTADO[estado]}>
                    {ETIQUETA_ESTADO[estado]}: {metricas.cantidad_por_estado[estado]}
                  </Tag>
                ))}
              </Flex>
            ),
          },
        ]}
      />

      <Tabs
        items={[
          {
            key: 'pedidos',
            label: `Pedidos (${detalle.pedidos.length})`,
            children: <PedidosDelCliente pedidos={detalle.pedidos} />,
          },
          {
            key: 'reviews',
            label: `Reviews (${detalle.reviews.length})`,
            children:
              detalle.reviews.length === 0 ? (
                <Empty description="Todavía no dejó reviews" />
              ) : (
                <Flex vertical gap={16}>
                  {detalle.reviews.map((review) => (
                    <Card key={review.id_review} size="small">
                      <Flex justify="space-between" wrap gap={8}>
                        <Rate disabled value={review.puntuacion} style={{ fontSize: 14 }} />
                        <Typography.Text type="secondary">
                          Pedido #{review.id_pedido} · Mesa {review.numero_mesa} · {fechaHora(review.fecha_hora)}
                        </Typography.Text>
                      </Flex>
                      <Typography.Paragraph style={{ margin: '8px 0 0' }}>
                        {review.comentario ?? <Typography.Text type="secondary">Sin comentario</Typography.Text>}
                      </Typography.Paragraph>
                    </Card>
                  ))}
                </Flex>
              ),
          },
        ]}
      />
    </Flex>
  );
}

function PedidosDelCliente({ pedidos }: { pedidos: PedidoDeCliente[] }) {
  return (
    <Table
      rowKey="id_pedido"
      size="small"
      dataSource={pedidos}
      pagination={{ pageSize: 8, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: 'Todavía no hizo pedidos' }}
      expandable={{
        expandedRowRender: (pedido: PedidoDeCliente) => (
          <Flex vertical gap={4}>
            {pedido.detalle_pedido.map((detalle: DetallePedido) => (
              <Flex key={detalle.id_detalle} justify="space-between" gap={12}>
                <span>
                  {detalle.cantidad} × {detalle.producto.nombre}
                </span>
                <span>{formatearMoneda(detalle.subtotal)}</span>
              </Flex>
            ))}
            {pedido.motivo_cancelacion && (
              <Typography.Text type="danger">Motivo de cancelación: {pedido.motivo_cancelacion}</Typography.Text>
            )}
          </Flex>
        ),
      }}
      columns={[
        { title: '#', dataIndex: 'id_pedido', width: 60 },
        { title: 'Fecha', dataIndex: 'fecha_hora_ingreso', width: 140, render: fechaHora },
        { title: 'Mesa', width: 60, align: 'center', render: (_, pedido: PedidoDeCliente) => pedido.mesa.numero_mesa },
        { title: 'Estado', width: 130, render: (_, pedido: PedidoDeCliente) => <EstadoPedidoTag estado={pedido.estado} /> },
        {
          title: 'Total',
          dataIndex: 'precio_total',
          width: 110,
          align: 'right',
          render: (valor: string) => formatearMoneda(valor),
        },
      ]}
    />
  );
}
