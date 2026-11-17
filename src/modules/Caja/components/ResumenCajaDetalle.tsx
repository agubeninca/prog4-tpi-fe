import { Card, Col, Empty, Row, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { formatearMoneda } from '../../../shared/moneda';
import { ETIQUETA_MEDIO_PAGO } from '../../Pedido/services/pedido.service';
import type { ResumenCaja } from '../../Resumen/services/reporte.service';

const pedidos = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;

interface ResumenCajaDetalleProps {
  resumen: ResumenCaja;
  /** Texto para "todavía no se cobró nada …" (ej. "en este turno"). */
  periodo: string;
}

/** Detalle de un cierre de caja: por medio de pago, por mozo, cuentas y lo que falta cobrar. */
export function ResumenCajaDetalle({ resumen, periodo }: ResumenCajaDetalleProps) {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Cobrado por medio de pago" style={{ height: '100%' }}>
            {resumen.cobrado.por_medio.length === 0 ? (
              <Empty description={`Todavía no se cobró nada ${periodo}`} />
            ) : (
              <Table
                rowKey="medio"
                size="small"
                pagination={false}
                dataSource={resumen.cobrado.por_medio}
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Medio',
                    dataIndex: 'medio',
                    render: (medio: string) =>
                      medio === 'SIN_MEDIO'
                        ? 'Sin medio cargado'
                        : ETIQUETA_MEDIO_PAGO[medio as keyof typeof ETIQUETA_MEDIO_PAGO],
                  },
                  { title: 'Pedidos', dataIndex: 'cantidad', align: 'center', width: 100 },
                  { title: 'Total', dataIndex: 'total', align: 'right', width: 150, render: formatearMoneda },
                ]}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Cobrado por mozo" style={{ height: '100%' }}>
            {(resumen.cobrado.por_mozo ?? []).length === 0 ? (
              <Empty description="Sin cobros" />
            ) : (
              <Table
                rowKey="nombre"
                size="small"
                pagination={false}
                dataSource={resumen.cobrado.por_mozo}
                columns={[
                  { title: 'Mozo', dataIndex: 'nombre' },
                  { title: 'Pedidos', dataIndex: 'cantidad', align: 'center', width: 90 },
                  { title: 'Total', dataIndex: 'total', align: 'right', width: 130, render: formatearMoneda },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      {resumen.cobrado.cuentas.length > 0 && (
        <Card title="Facturado a nombre de una cuenta">
          <Table
            rowKey={(c) => `${c.nombre}|${c.cuit ?? ''}`}
            size="small"
            pagination={false}
            dataSource={resumen.cobrado.cuentas}
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
        title={`Servidos sin cobrar (${resumen.sin_cobrar.cantidad})`}
        extra={<Typography.Text strong>{formatearMoneda(resumen.sin_cobrar.total)}</Typography.Text>}
      >
        {resumen.sin_cobrar.pedidos.length === 0 ? (
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
              dataSource={resumen.sin_cobrar.pedidos}
              scroll={{ x: 'max-content' }}
              columns={[
                { title: '#', dataIndex: 'id_pedido', width: 70 },
                {
                  title: 'Ingresó',
                  dataIndex: 'fecha_hora_ingreso',
                  width: 130,
                  render: (v: string) => dayjs(v).format('DD/MM HH:mm'),
                },
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
            <Statistic title="En curso (pendientes y en preparación)" value={formatearMoneda(resumen.en_curso.total)} />
            <Typography.Text type="secondary">{pedidos(resumen.en_curso.cantidad)} · todavía no se sirvieron</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Cancelados" value={formatearMoneda(resumen.cancelados.total)} />
            <Typography.Text type="secondary">{pedidos(resumen.cancelados.cantidad)} · no suman a la caja</Typography.Text>
          </Card>
        </Col>
      </Row>
    </>
  );
}
