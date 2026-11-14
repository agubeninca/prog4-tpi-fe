import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Empty, Row, Space, Statistic, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { MARCA } from '../../../theme/marca';
import { ETIQUETA_MEDIO_PAGO } from '../../Pedido/services/pedido.service';
import { reporteCajaService, type CierreDeCaja } from '../../Resumen/services/reporte.service';

const pedidos = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;
const cobrados = (n: number) => `${n} ${n === 1 ? 'pedido cobrado' : 'pedidos cobrados'}`;

export function CajaView() {
  const [fecha, setFecha] = useState<Dayjs>(dayjs());
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; cierre: CierreDeCaja | null } | null>(null);

  const fechaConsulta = fecha.format('YYYY-MM-DD');
  const clave = `${fechaConsulta}#${recargas}`;
  const loading = datos?.clave !== clave;
  const cierre = datos?.cierre ?? null;
  const esHoy = fecha.isSame(dayjs(), 'day');

  useEffect(() => {
    let vigente = true;
    reporteCajaService
      .cierreDeCaja(fechaConsulta)
      .then((resultado) => vigente && setDatos({ clave, cierre: resultado }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, cierre: null });
      });
    return () => {
      vigente = false;
    };
  }, [clave, fechaConsulta]);

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1 style={{ margin: 0 }}>Cierre de caja</h1>
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

      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} md={12}>
            <Card loading={loading && !cierre} style={{ height: '100%', borderTop: `3px solid ${MARCA.verde}` }}>
              <Statistic
                title={esHoy ? 'Cobrado hoy' : `Cobrado el ${fecha.format('DD/MM/YYYY')}`}
                value={cierre ? formatearMoneda(cierre.cobrado.total) : '—'}
                styles={{ content: { color: MARCA.verde, fontSize: 32 } }}
              />
              <Typography.Text type="secondary">{cierre ? `${cobrados(cierre.cobrado.cantidad)} en el día` : ''}</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading && !cierre} style={{ height: '100%', borderTop: `3px solid ${MARCA.negro}` }}>
              <Statistic
                title="Efectivo que tiene que haber en la caja"
                value={cierre ? formatearMoneda(cierre.cobrado.efectivo_en_caja) : '—'}
                styles={{ content: { fontSize: 32 } }}
              />
              <Typography.Text type="secondary">Solo lo cobrado en efectivo</Typography.Text>
            </Card>
          </Col>
        </Row>

        {cierre && (
          <>
            <Card title="Cobrado por medio de pago">
              {cierre.cobrado.por_medio.length === 0 ? (
                <Empty description="Todavía no se cobró nada este día" />
              ) : (
                <Table
                  rowKey="medio"
                  size="small"
                  pagination={false}
                  dataSource={cierre.cobrado.por_medio}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: 'Medio',
                      dataIndex: 'medio',
                      render: (medio: string) => (medio === 'SIN_MEDIO' ? 'Sin medio cargado' : ETIQUETA_MEDIO_PAGO[medio as keyof typeof ETIQUETA_MEDIO_PAGO]),
                    },
                    { title: 'Pedidos', dataIndex: 'cantidad', align: 'center', width: 100 },
                    { title: 'Total', dataIndex: 'total', align: 'right', width: 150, render: formatearMoneda },
                  ]}
                />
              )}
            </Card>

            {cierre.cobrado.cuentas.length > 0 && (
              <Card title="Facturado a nombre de una cuenta">
                <Table
                  rowKey={(c) => `${c.nombre}|${c.cuit ?? ''}`}
                  size="small"
                  pagination={false}
                  dataSource={cierre.cobrado.cuentas}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: 'Nombre / razón social', dataIndex: 'nombre' },
                    { title: 'CUIT', dataIndex: 'cuit', render: (cuit: string | null) => cuit ?? '—' },
                    { title: 'Pedidos', dataIndex: 'cantidad', align: 'center', width: 100 },
                    { title: 'Total', dataIndex: 'total', align: 'right', width: 150, render: formatearMoneda },
                  ]}
                />
              </Card>
            )}

            <Card
              title={`Servidos sin cobrar (${cierre.sin_cobrar.cantidad})`}
              extra={<Typography.Text strong>{formatearMoneda(cierre.sin_cobrar.total)}</Typography.Text>}
            >
              {cierre.sin_cobrar.pedidos.length === 0 ? (
                <Empty description="No hay pedidos pendientes de cobro" />
              ) : (
                <>
                  <Typography.Paragraph type="secondary">
                    Incluye pedidos de cualquier día: son plata que todavía no entró.
                  </Typography.Paragraph>
                  <Table
                    rowKey="id_pedido"
                    size="small"
                    pagination={false}
                    dataSource={cierre.sin_cobrar.pedidos}
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: '#', dataIndex: 'id_pedido', width: 70 },
                      { title: 'Ingresó', dataIndex: 'fecha_hora_ingreso', width: 130, render: (v: string) => dayjs(v).format('DD/MM HH:mm') },
                      { title: 'Mesa', width: 70, align: 'center', render: (_, p) => p.mesa.numero_mesa },
                      { title: 'Cliente', render: (_, p) => p.cliente.nombre },
                      { title: 'Total', dataIndex: 'precio_total', align: 'right', width: 130, render: formatearMoneda },
                    ]}
                  />
                </>
              )}
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic title="En curso (pendientes y en preparación)" value={formatearMoneda(cierre.en_curso.total)} />
                  <Typography.Text type="secondary">{pedidos(cierre.en_curso.cantidad)} · todavía no se sirvieron</Typography.Text>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic title="Cancelados" value={formatearMoneda(cierre.cancelados.total)} />
                  <Typography.Text type="secondary">{pedidos(cierre.cancelados.cantidad)} · no suman a la caja</Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </div>
  );
}
