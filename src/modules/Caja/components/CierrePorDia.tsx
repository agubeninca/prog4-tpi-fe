import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Row, Space, Statistic, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { MARCA } from '../../../theme/marca';
import { reporteCajaService, type CierreDeCaja } from '../../Resumen/services/reporte.service';
import { ResumenCajaDetalle } from './ResumenCajaDetalle';

const cobrados = (n: number) => `${n} ${n === 1 ? 'pedido cobrado' : 'pedidos cobrados'}`;

/** Todo lo cobrado en un día, sumando todos los turnos (por la fecha en que se cobró). */
export function CierrePorDia() {
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
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text type="secondary">Suma todos los turnos del día elegido.</Typography.Text>
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
              title="Cobrado en efectivo"
              value={cierre ? formatearMoneda(cierre.cobrado.efectivo_en_caja) : '—'}
              styles={{ content: { fontSize: 32 } }}
            />
            <Typography.Text type="secondary">Sin contar el fondo inicial de cada turno</Typography.Text>
          </Card>
        </Col>
      </Row>

      {cierre && <ResumenCajaDetalle resumen={cierre} periodo="este día" />}
    </Space>
  );
}
