import { useEffect, useState } from 'react';
import { Card, Col, Empty, Row, Segmented, Space, Spin, Statistic, Table, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { Columnas } from '../../../shared/graficos/Columnas';
import { Filas } from '../../../shared/graficos/Filas';
import { formatearMoneda } from '../../../shared/moneda';
import { MARCA } from '../../../theme/marca';
import { reporteCajaService, type DiasEstadisticas, type Estadisticas } from '../../Resumen/services/reporte.service';

const PERIODOS = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
];

const pedidos = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;

export function EstadisticasView() {
  const [dias, setDias] = useState<DiasEstadisticas>(7);
  const [datos, setDatos] = useState<{ dias: DiasEstadisticas; estadisticas: Estadisticas | null } | null>(null);
  const [verTabla, setVerTabla] = useState(false);

  const loading = datos?.dias !== dias;
  const estadisticas = datos?.estadisticas ?? null;

  useEffect(() => {
    let vigente = true;
    reporteCajaService
      .estadisticas(dias)
      .then((resultado) => vigente && setDatos({ dias, estadisticas: resultado }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ dias, estadisticas: null });
      });
    return () => {
      vigente = false;
    };
  }, [dias]);

  const total = estadisticas ? Number(estadisticas.total) : 0;
  const promedio = estadisticas && estadisticas.cantidad_pedidos > 0 ? total / estadisticas.cantidad_pedidos : 0;
  const sinVentas = !!estadisticas && estadisticas.cantidad_pedidos === 0;

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Estadísticas</h1>
        <Segmented options={PERIODOS} value={dias} onChange={(valor) => setDias(valor as DiasEstadisticas)} />
      </Space>

      <Spin spinning={loading}>
        {!estadisticas ? (
          <Card style={{ minHeight: 200 }} />
        ) : (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={[16, 16]} align="stretch">
              <Col xs={24} md={8}>
                <Card style={{ height: '100%', borderTop: `3px solid ${MARCA.verde}` }}>
                  <Statistic
                    title={`Vendido en los últimos ${estadisticas.dias} días`}
                    value={formatearMoneda(estadisticas.total)}
                    styles={{ content: { color: MARCA.verde, fontSize: 32 } }}
                  />
                  <Typography.Text type="secondary">
                    Del {dayjs(estadisticas.desde).format('DD/MM')} al {dayjs(estadisticas.hasta).format('DD/MM')} · pedidos servidos
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={12} md={8}>
                <Card style={{ height: '100%' }}>
                  <Statistic title="Pedidos servidos" value={estadisticas.cantidad_pedidos} />
                </Card>
              </Col>
              <Col xs={12} md={8}>
                <Card style={{ height: '100%' }}>
                  <Statistic title="Ticket promedio" value={formatearMoneda(promedio)} />
                </Card>
              </Col>
            </Row>

            {sinVentas ? (
              <Card>
                <Empty description="No hubo pedidos servidos en este período" />
              </Card>
            ) : (
              <>
                <Card
                  title="Ventas por día"
                  extra={<Segmented size="small" options={['Gráfico', 'Tabla']} value={verTabla ? 'Tabla' : 'Gráfico'} onChange={(v) => setVerTabla(v === 'Tabla')} />}
                >
                  {verTabla ? (
                    <Table
                      rowKey="fecha"
                      size="small"
                      pagination={{ pageSize: 10, hideOnSinglePage: true }}
                      dataSource={[...estadisticas.ventas_por_dia].reverse()}
                      columns={[
                        { title: 'Día', dataIndex: 'fecha', render: (f: string) => dayjs(f).format('dddd DD/MM/YYYY') },
                        { title: 'Pedidos', dataIndex: 'cantidad', align: 'center' },
                        { title: 'Vendido', dataIndex: 'total', align: 'right', render: formatearMoneda },
                      ]}
                    />
                  ) : (
                    <Columnas
                      titulo="Ventas por día"
                      alFinal
                      cadaRotulo={Math.ceil(estadisticas.dias / 7)}
                      puntos={estadisticas.ventas_por_dia.map((d) => ({
                        etiqueta: dayjs(d.fecha).format('DD/MM'),
                        detalle: `${dayjs(d.fecha).format('ddd DD/MM')} · ${formatearMoneda(d.total)} · ${pedidos(d.cantidad)}`,
                        valor: Number(d.total),
                      }))}
                    />
                  )}
                </Card>

                <Row gutter={[16, 16]} align="stretch">
                  <Col xs={24} lg={12}>
                    <Card title="Productos más vendidos" extra="Unidades" style={{ height: '100%' }}>
                      <Filas
                        titulo="Productos más vendidos"
                        puntos={estadisticas.top_productos.map((p) => ({
                          nombre: p.nombre,
                          valor: p.unidades,
                          valorTexto: `${p.unidades} u. · ${formatearMoneda(p.total)}`,
                        }))}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card title="Ventas por mozo" extra="Importe" style={{ height: '100%' }}>
                      <Filas
                        titulo="Ventas por mozo"
                        puntos={estadisticas.ventas_por_mozo.map((m) => ({
                          nombre: m.nombre,
                          valor: Number(m.total),
                          valorTexto: `${formatearMoneda(m.total)} · ${m.cantidad}`,
                        }))}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Ventas por hora del día" extra="Importe">
                  <Columnas
                    titulo="Ventas por hora del día"
                    cadaRotulo={3}
                    puntos={estadisticas.ventas_por_hora.map((h) => ({
                      etiqueta: `${h.hora}h`,
                      detalle: `${String(h.hora).padStart(2, '0')}:00 a ${String(h.hora).padStart(2, '0')}:59 · ${formatearMoneda(h.total)} · ${pedidos(h.cantidad)}`,
                      valor: Number(h.total),
                    }))}
                  />
                </Card>
              </>
            )}
          </Space>
        )}
      </Spin>
    </div>
  );
}
