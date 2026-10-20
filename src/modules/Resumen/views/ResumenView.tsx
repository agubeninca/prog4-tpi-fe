import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Row, Space, Statistic, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { EstadoPedidoTag } from '../../Pedido/components/EstadoPedidoTag';
import { pedidoService, type DetallePedido, type EstadoPedido, type Pedido } from '../../Pedido/services/pedido.service';
import { reporteService, type VentasDelDia } from '../services/reporte.service';

export function ResumenView() {
  const [fecha, setFecha] = useState<Dayjs>(dayjs());
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; ventas: VentasDelDia | null; pedidos: Pedido[] } | null>(null);

  const fechaConsulta = fecha.format('YYYY-MM-DD');
  const clave = `${fechaConsulta}#${recargas}`;
  const loading = datos?.clave !== clave;
  const ventas = datos?.ventas ?? null;
  const pedidos = datos?.pedidos ?? [];

  useEffect(() => {
    let vigente = true;
    Promise.all([reporteService.ventasDelDia(fechaConsulta), pedidoService.getAll({ fecha: fechaConsulta })])
      .then(([resumen, delDia]) => vigente && setDatos({ clave, ventas: resumen, pedidos: delDia }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, ventas: null, pedidos: [] });
      });
    // Si cambia la fecha antes de que responda, se descarta la respuesta vieja.
    return () => {
      vigente = false;
    };
  }, [clave, fechaConsulta]);

  const porEstado = (estado: EstadoPedido) => ventas?.cantidad_por_estado[estado] ?? 0;
  const esHoy = fecha.isSame(dayjs(), 'day');

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Resumen de ventas</h1>
        <Space wrap>
          <DatePicker
            value={fecha}
            onChange={(valor) => setFecha(valor ?? dayjs())}
            format="DD/MM/YYYY"
            allowClear={false}
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setRecargas((n) => n + 1)} loading={loading}>
            Actualizar
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} lg={8}>
          <Card>
            <Statistic
              title={esHoy ? 'Vendido hoy' : `Vendido el ${fecha.format('DD/MM/YYYY')}`}
              value={ventas ? formatearMoneda(ventas.total) : '—'}
              loading={loading && !ventas}
              styles={{ content: { color: '#389e0d' } }}
            />
            <Typography.Text type="secondary">Suma de los pedidos servidos</Typography.Text>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card>
            <Statistic title="Servidos" value={porEstado('SERVIDO')} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card>
            <Statistic title="Pendientes" value={porEstado('PENDIENTE')} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card>
            <Statistic title="En preparación" value={porEstado('EN_PREPARACION')} />
          </Card>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Card>
            <Statistic title="Cancelados" value={porEstado('CANCELADO')} />
          </Card>
        </Col>
      </Row>

      <h2>Pedidos del día</h2>
      <Table
        rowKey="id_pedido"
        loading={loading}
        dataSource={pedidos}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No hubo pedidos este día' }}
        expandable={{
          expandedRowRender: (pedido: Pedido) => (
            <Table
              rowKey="id_detalle"
              size="small"
              pagination={false}
              dataSource={pedido.detalle_pedido}
              columns={[
                { title: 'Producto', render: (_, detalle: DetallePedido) => detalle.producto.nombre },
                { title: 'Cantidad', dataIndex: 'cantidad', align: 'center' },
                { title: 'Precio unitario', dataIndex: 'precio_unitario', align: 'right', render: formatearMoneda },
                { title: 'Subtotal', dataIndex: 'subtotal', align: 'right', render: formatearMoneda },
              ]}
            />
          ),
        }}
        columns={[
          { title: '#', dataIndex: 'id_pedido', width: 70 },
          {
            title: 'Hora',
            dataIndex: 'fecha_hora_ingreso',
            width: 80,
            render: (valor: string) => dayjs(valor).format('HH:mm'),
          },
          { title: 'Mesa', width: 70, align: 'center', render: (_, pedido: Pedido) => pedido.mesa.numero_mesa },
          {
            title: 'Cliente',
            width: 200,
            render: (_, pedido: Pedido) => `${pedido.cliente.nombre} (${pedido.cliente.dni})`,
          },
          {
            title: 'Estado',
            width: 160,
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
            title: 'Total',
            dataIndex: 'precio_total',
            width: 120,
            align: 'right',
            render: (valor: string) => formatearMoneda(valor),
          },
        ]}
      />
    </div>
  );
}
