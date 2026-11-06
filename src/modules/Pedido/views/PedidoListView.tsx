import { useEffect, useMemo, useState } from 'react';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, DatePicker, Flex, Input, InputNumber, Popconfirm, Row, Segmented, Statistic, Table, Tag, Tooltip, Typography, message } from 'antd';
import Decimal from 'decimal.js';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { ElegirMedioPagoModal } from '../components/ElegirMedioPagoModal';
import { EstadoPagoTag } from '../components/EstadoPagoTag';
import { EstadoPedidoTag } from '../components/EstadoPedidoTag';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_MEDIO_PAGO,
  ETIQUETA_PAGO,
  LIMITE_PEDIDOS,
  medioEnFrase,
  pedidoService,
  type DetallePedido,
  type EstadoPago,
  type EstadoPedido,
  type MedioPago,
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
  /** Pedido que se está marcando como pagado: primero se elige el medio de pago. */
  const [aCobrar, setACobrar] = useState<Pedido | null>(null);

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

  const cambiarPago = async (pedido: Pedido, pagado: EstadoPago, medio?: MedioPago) => {
    setCobrando(pedido.id_pedido);
    try {
      const actualizado = await pedidoService.cambiarPago(pedido.id_pedido, pagado, medio);
      setDatos((actual) =>
        actual && {
          ...actual,
          pedidos: actual.pedidos.map((p) => (p.id_pedido === actualizado.id_pedido ? actualizado : p)),
        },
      );
      message.success(
        medio
          ? `Pedido #${pedido.id_pedido}: pagó con ${medioEnFrase(medio)}`
          : `Pedido #${pedido.id_pedido}: ${ETIQUETA_PAGO[pagado].toLowerCase()}`,
      );
      setACobrar(null);
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

  const primeraCarga = datos === null;
  const columnaMetrica = { xs: 12, md: 6, xl: 4 };
  const tarjetas = [
    { titulo: 'Pedidos', valor: metricas.cantidad },
    { titulo: 'Servidos', valor: metricas.servidos },
    { titulo: 'Cancelados', valor: metricas.cancelados },
    { titulo: 'Pendientes de pago', valor: metricas.pendientesPago, color: '#d46b08' },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Pedidos</h1>
        <Button icon={<ReloadOutlined />} onClick={() => setRecargas((n) => n + 1)} loading={loading}>
          Actualizar
        </Button>
      </Flex>

      <Flex vertical gap={12} style={{ marginBottom: 20 }}>
        <Flex wrap gap={12}>
          <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Segmented value={estado} onChange={(valor) => setEstado(valor)} options={OPCIONES_ESTADO} />
          </div>
          <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Segmented value={pago} onChange={(valor) => setPago(valor)} options={OPCIONES_PAGO} />
          </div>
        </Flex>
        <Flex wrap gap={12} align="center">
          <DatePicker.RangePicker
            value={rango}
            onChange={(valor) => setRango(valor)}
            format="DD/MM/YYYY"
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
            style={{ width: 280 }}
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
            placeholder="N.º de mesa"
            style={{ width: 130 }}
            value={mesa}
            onChange={(valor) => setMesa(valor)}
          />
          {hayFiltros && (
            <Button type="link" onClick={limpiarFiltros} style={{ paddingInline: 4 }}>
              Limpiar filtros
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Mientras se recarga, las métricas se atenúan en vez de saltar a 0. */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20, opacity: loading && !primeraCarga ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {tarjetas.map((tarjeta) => (
          <Col key={tarjeta.titulo} {...columnaMetrica}>
            <Card size="small" style={{ height: '100%' }}>
              <Statistic
                title={tarjeta.titulo}
                value={tarjeta.valor}
                loading={primeraCarga}
                styles={tarjeta.color ? { content: { color: tarjeta.color } } : undefined}
              />
            </Card>
          </Col>
        ))}
        <Col xs={24} md={24} xl={8}>
          <Card size="small" style={{ height: '100%' }}>
            <Statistic
              title="Total vendido (servidos)"
              value={formatearMoneda(metricas.vendido.toString())}
              loading={primeraCarga}
              styles={{ content: { color: '#389e0d', whiteSpace: 'nowrap' } }}
            />
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
        // Entra completa desde ~1100 px; en pantallas más chicas se desplaza horizontalmente.
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        locale={{
          // Mientras carga no se muestra "no hay pedidos" debajo del spinner.
          emptyText: loading ? (
            <div style={{ height: 120 }} />
          ) : hayFiltros ? (
            'Ningún pedido coincide con los filtros'
          ) : (
            'Todavía no hay pedidos'
          ),
        }}
        expandable={{
          expandedRowRender: (pedido: Pedido) => (
            <Flex vertical gap={4} style={{ maxWidth: 640 }}>
              {pedido.detalle_pedido.map((detalle: DetallePedido) => (
                <Flex key={detalle.id_detalle} justify="space-between" gap={12}>
                  <span>
                    {detalle.cantidad} × {detalle.producto.nombre}
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>
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
            width: 100,
            render: (id: number, pedido: Pedido) => (
              <Flex align="center" gap={6} style={{ whiteSpace: 'nowrap' }}>
                <span>{id}</span>
                {pedido.origen === 'MANUAL' && (
                  <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                    Manual
                  </Tag>
                )}
              </Flex>
            ),
          },
          {
            title: 'Fecha',
            dataIndex: 'fecha_hora_ingreso',
            width: 135,
            render: (valor: string) => <span style={{ whiteSpace: 'nowrap' }}>{dayjs(valor).format('DD/MM/YYYY HH:mm')}</span>,
          },
          { title: 'Mesa', width: 70, align: 'center', render: (_, pedido: Pedido) => pedido.mesa.numero_mesa },
          {
            title: 'Cliente',
            ellipsis: true,
            render: (_, pedido: Pedido) => (
              <div style={{ minWidth: 0 }}>
                <Typography.Text ellipsis={{ tooltip: pedido.cliente.nombre }} style={{ display: 'block' }}>
                  {pedido.cliente.nombre}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  DNI {formatearDni(pedido.cliente.dni)}
                </Typography.Text>
              </div>
            ),
          },
          {
            title: 'Ítems',
            width: 70,
            align: 'center',
            render: (_, pedido: Pedido) => pedido.detalle_pedido.reduce((total, detalle) => total + detalle.cantidad, 0),
          },
          {
            title: 'Estado',
            width: 145,
            // El motivo de cancelación va en un tooltip (y en el detalle) para no estirar la fila.
            render: (_, pedido: Pedido) =>
              pedido.motivo_cancelacion ? (
                <Tooltip title={`Motivo: ${pedido.motivo_cancelacion}`}>
                  <span style={{ cursor: 'help', whiteSpace: 'nowrap' }}>
                    <EstadoPedidoTag estado={pedido.estado} />
                    <InfoCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
                  </span>
                </Tooltip>
              ) : (
                <EstadoPedidoTag estado={pedido.estado} />
              ),
          },
          {
            title: 'Pago',
            width: 200,
            render: (_, pedido: Pedido) => {
              // Un pedido cancelado no se cobra: solo se puede volver a "pendiente" si había quedado pagado.
              if (pedido.estado === 'CANCELADO' && pedido.pagado === 'PENDIENTE') {
                return <Typography.Text type="secondary">—</Typography.Text>;
              }
              if (pedido.pagado === 'PENDIENTE') {
                return (
                  <Flex align="center" gap={4} style={{ whiteSpace: 'nowrap' }}>
                    <EstadoPagoTag pagado={pedido.pagado} corto />
                    <Button
                      size="small"
                      type="link"
                      loading={cobrando === pedido.id_pedido}
                      style={{ paddingInline: 4 }}
                      onClick={() => setACobrar(pedido)}
                    >
                      Marcar pagado
                    </Button>
                  </Flex>
                );
              }
              return (
                <div>
                  <Flex align="center" gap={4} style={{ whiteSpace: 'nowrap' }}>
                    <EstadoPagoTag pagado={pedido.pagado} corto />
                    <Popconfirm
                      title={`¿Volver el pedido #${pedido.id_pedido} a pendiente de pago?`}
                      okText="Sí"
                      cancelText="No"
                      onConfirm={() => cambiarPago(pedido, 'PENDIENTE')}
                    >
                      <Button size="small" type="link" loading={cobrando === pedido.id_pedido} style={{ paddingInline: 4 }}>
                        Deshacer
                      </Button>
                    </Popconfirm>
                  </Flex>
                  {/* Los pagados antes del registro de medios no tienen medio. */}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {pedido.medio_pago ? ETIQUETA_MEDIO_PAGO[pedido.medio_pago] : 'Medio sin registrar'}
                  </Typography.Text>
                </div>
              );
            },
          },
          {
            title: 'Total',
            dataIndex: 'precio_total',
            width: 120,
            align: 'right',
            render: (valor: string) => <strong style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(valor)}</strong>,
          },
        ]}
      />

      <ElegirMedioPagoModal
        pedido={aCobrar && { id_pedido: aCobrar.id_pedido, numero_mesa: aCobrar.mesa.numero_mesa, precio_total: aCobrar.precio_total }}
        loading={aCobrar !== null && cobrando === aCobrar.id_pedido}
        onCancel={() => setACobrar(null)}
        onConfirm={(medio) => aCobrar && cambiarPago(aCobrar, 'PAGADO', medio)}
      />
    </div>
  );
}
