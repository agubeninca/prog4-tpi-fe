import { useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, DatePicker, Flex, Input, InputNumber, Popconfirm, Row, Segmented, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import Decimal from 'decimal.js';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { EstadoPagoTag } from '../components/EstadoPagoTag';
import { EstadoPedidoTag } from '../components/EstadoPedidoTag';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_PAGO,
  LIMITE_PEDIDOS,
  pedidoService,
  type DetallePedido,
  type EstadoPago,
  type EstadoPedido,
  type Pedido,
} from '../services/pedido.service';

type Rango = [Dayjs | null, Dayjs | null] | null;
type FiltroEstado = 'TODOS' | EstadoPedido;
type FiltroPago = 'TODOS' | EstadoPago;

const OPCIONES_ESTADO: { label: string; value: FiltroEstado }[] = [
  { label: 'Todos', value: 'TODOS' },
  ...(Object.keys(ETIQUETA_ESTADO) as EstadoPedido[]).map((estado) => ({ label: ETIQUETA_ESTADO[estado], value: estado })),
];

const OPCIONES_PAGO: { label: string; value: FiltroPago }[] = [
  { label: 'Todos los pagos', value: 'TODOS' },
  ...(Object.keys(ETIQUETA_PAGO) as EstadoPago[]).map((pago) => ({ label: ETIQUETA_PAGO[pago], value: pago })),
];

// Referencia estable mientras no hay datos (evita recalcular las métricas en cada render).
const SIN_PEDIDOS: Pedido[] = [];

export function PedidoListView() {
  const [estado, setEstado] = useState<FiltroEstado>('TODOS');
  const [pago, setPago] = useState<FiltroPago>('TODOS');
  const [rango, setRango] = useState<Rango>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mesa, setMesa] = useState<number | null>(null);
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; pedidos: Pedido[] } | null>(null);
  const [cobrando, setCobrando] = useState<number | null>(null);

  const desde = rango?.[0]?.format('YYYY-MM-DD');
  const hasta = rango?.[1]?.format('YYYY-MM-DD');
  const clave = `${estado}|${pago}|${desde}|${hasta}|${busqueda}|${mesa}|${recargas}`;
  const loading = datos?.clave !== clave;
  const pedidos = datos?.pedidos ?? SIN_PEDIDOS;

  useEffect(() => {
    let vigente = true;
    pedidoService
      .getAll({
        estado: estado === 'TODOS' ? undefined : estado,
        pagado: pago === 'TODOS' ? undefined : pago,
        desde,
        hasta,
        q: busqueda || undefined,
        numero_mesa: mesa ?? undefined,
      })
      .then((resultado) => vigente && setDatos({ clave, pedidos: resultado }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, pedidos: [] });
      });
    return () => {
      vigente = false;
    };
  }, [clave, estado, pago, desde, hasta, busqueda, mesa]);

  // Métricas de lo que se está viendo. El total vendido suma solo los servidos (mismo criterio que RF-08).
  const metricas = useMemo(() => {
    const servidos = pedidos.filter((pedido) => pedido.estado === 'SERVIDO');
    const vendido = servidos.reduce((total, pedido) => total.plus(pedido.precio_total), new Decimal(0));
    return {
      cantidad: pedidos.length,
      servidos: servidos.length,
      vendido,
      cancelados: pedidos.filter((pedido) => pedido.estado === 'CANCELADO').length,
      // Los cancelados no se cobran: no cuentan como deuda.
      pendientesPago: pedidos.filter((pedido) => pedido.pagado === 'PENDIENTE' && pedido.estado !== 'CANCELADO').length,
    };
  }, [pedidos]);

  const cambiarPago = async (pedido: Pedido, pagado: EstadoPago) => {
    setCobrando(pedido.id_pedido);
    try {
      const actualizado = await pedidoService.cambiarPago(pedido.id_pedido, pagado);
      setDatos((actual) =>
        actual && {
          ...actual,
          pedidos: actual.pedidos.map((p) => (p.id_pedido === actualizado.id_pedido ? actualizado : p)),
        },
      );
      message.success(`Pedido #${pedido.id_pedido}: ${ETIQUETA_PAGO[pagado].toLowerCase()}`);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCobrando(null);
    }
  };

  const hayFiltros = estado !== 'TODOS' || pago !== 'TODOS' || !!desde || !!hasta || !!busqueda || mesa !== null;
  const limpiarFiltros = () => {
    setEstado('TODOS');
    setPago('TODOS');
    setRango(null);
    setBusqueda('');
    setMesa(null);
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Pedidos</h1>
        <Button icon={<ReloadOutlined />} onClick={() => setRecargas((n) => n + 1)} loading={loading}>
          Actualizar
        </Button>
      </Space>

      <Flex vertical gap={12} style={{ marginBottom: 16 }}>
        <Flex wrap gap={12}>
          <Segmented value={estado} onChange={(valor) => setEstado(valor)} options={OPCIONES_ESTADO} />
          <Segmented value={pago} onChange={(valor) => setPago(valor)} options={OPCIONES_PAGO} />
        </Flex>
        <Flex wrap gap={12}>
          <DatePicker.RangePicker
            value={rango}
            onChange={(valor) => setRango(valor)}
            format="DD/MM/YYYY"
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
          />
          <Input.Search
            allowClear
            placeholder="Cliente (nombre o DNI)"
            style={{ width: 260 }}
            onSearch={(valor) => setBusqueda(valor.trim())}
          />
          <InputNumber
            min={1}
            max={999}
            precision={0}
            placeholder="Mesa"
            style={{ width: 110 }}
            value={mesa}
            onChange={(valor) => setMesa(valor)}
          />
          {hayFiltros && <Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
        </Flex>
      </Flex>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Pedidos" value={metricas.cantidad} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Servidos" value={metricas.servidos} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Cancelados" value={metricas.cancelados} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Pendientes de pago" value={metricas.pendientesPago} styles={{ content: { color: '#d46b08' } }} />
          </Card>
        </Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic title="Total vendido (servidos)" value={formatearMoneda(metricas.vendido.toString())} styles={{ content: { color: '#389e0d' } }} />
          </Card>
        </Col>
      </Row>

      {pedidos.length >= LIMITE_PEDIDOS && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Se muestran los ${LIMITE_PEDIDOS} pedidos más recientes. Acotá el período o el cliente para ver el resto.`}
        />
      )}

      <Table
        rowKey="id_pedido"
        loading={loading}
        dataSource={pedidos}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        locale={{ emptyText: hayFiltros ? 'Ningún pedido coincide con los filtros' : 'Todavía no hay pedidos' }}
        expandable={{
          expandedRowRender: (pedido: Pedido) => (
            <Flex vertical gap={4}>
              {pedido.detalle_pedido.map((detalle: DetallePedido) => (
                <Flex key={detalle.id_detalle} justify="space-between" gap={12}>
                  <span>
                    {detalle.cantidad} × {detalle.producto.nombre}
                  </span>
                  <span>
                    {formatearMoneda(detalle.precio_unitario)} c/u · <strong>{formatearMoneda(detalle.subtotal)}</strong>
                  </span>
                </Flex>
              ))}
              {pedido.motivo_cancelacion && (
                <Typography.Text type="danger">Motivo de cancelación: {pedido.motivo_cancelacion}</Typography.Text>
              )}
            </Flex>
          ),
        }}
        columns={[
          {
            title: '#',
            dataIndex: 'id_pedido',
            width: 90,
            render: (id: number, pedido: Pedido) => (
              <div>
                <div>{id}</div>
                {pedido.origen === 'MANUAL' && (
                  <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                    Manual
                  </Tag>
                )}
              </div>
            ),
          },
          {
            title: 'Fecha',
            dataIndex: 'fecha_hora_ingreso',
            width: 150,
            render: (valor: string) => dayjs(valor).format('DD/MM/YYYY HH:mm'),
          },
          { title: 'Mesa', width: 70, align: 'center', render: (_, pedido: Pedido) => pedido.mesa.numero_mesa },
          {
            title: 'Cliente',
            width: 240,
            render: (_, pedido: Pedido) => (
              <div>
                <div>{pedido.cliente.nombre}</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  DNI {formatearDni(pedido.cliente.dni)}
                </Typography.Text>
              </div>
            ),
          },
          {
            title: 'Productos',
            width: 90,
            align: 'center',
            render: (_, pedido: Pedido) => pedido.detalle_pedido.reduce((total, detalle) => total + detalle.cantidad, 0),
          },
          {
            title: 'Estado',
            width: 170,
            render: (_, pedido: Pedido) => (
              <div>
                <EstadoPedidoTag estado={pedido.estado} />
                {pedido.motivo_cancelacion && (
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {pedido.motivo_cancelacion}
                    </Typography.Text>
                  </div>
                )}
              </div>
            ),
          },
          {
            title: 'Pago',
            width: 190,
            render: (_, pedido: Pedido) => {
              // Un pedido cancelado no se cobra: solo se puede volver a "pendiente" si había quedado pagado.
              if (pedido.estado === 'CANCELADO' && pedido.pagado === 'PENDIENTE') {
                return <Typography.Text type="secondary">—</Typography.Text>;
              }
              const siguiente: EstadoPago = pedido.pagado === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
              return (
                <Flex align="center" gap={4} wrap>
                  <EstadoPagoTag pagado={pedido.pagado} />
                  <Popconfirm
                    title={siguiente === 'PAGADO' ? `¿Marcar el pedido #${pedido.id_pedido} como pagado?` : `¿Volver el pedido #${pedido.id_pedido} a pendiente de pago?`}
                    okText="Sí"
                    cancelText="No"
                    onConfirm={() => cambiarPago(pedido, siguiente)}
                  >
                    <Button size="small" type="link" loading={cobrando === pedido.id_pedido} style={{ paddingInline: 0 }}>
                      {siguiente === 'PAGADO' ? 'Marcar pagado' : 'Deshacer'}
                    </Button>
                  </Popconfirm>
                </Flex>
              );
            },
          },
          {
            title: 'Total',
            dataIndex: 'precio_total',
            width: 120,
            align: 'right',
            render: (valor: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(valor)}</span>,
          },
        ]}
      />
    </div>
  );
}
