import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Space, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { ETIQUETA_TURNO, turnoService, type Turno } from '../services/turno.service';
import { DiferenciaCaja } from './DiferenciaCaja';
import { ResumenCajaDetalle } from './ResumenCajaDetalle';

/** Turnos cerrados con su arqueo; al desplegar uno se ve su cierre tal como quedó. */
export function HistorialTurnos() {
  const [rango, setRango] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; turnos: Turno[] } | null>(null);

  const desde = rango[0].format('YYYY-MM-DD');
  const hasta = rango[1].format('YYYY-MM-DD');
  const clave = `${desde}|${hasta}#${recargas}`;
  const loading = datos?.clave !== clave;

  useEffect(() => {
    let vigente = true;
    turnoService
      .historial({ desde, hasta })
      .then((turnos) => vigente && setDatos({ clave, turnos }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, turnos: [] });
      });
    return () => {
      vigente = false;
    };
  }, [clave, desde, hasta]);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text type="secondary">Turnos cerrados, del más nuevo al más viejo.</Typography.Text>
        <Space wrap>
          <DatePicker.RangePicker
            value={rango}
            onChange={(valor) => valor?.[0] && valor[1] && setRango([valor[0], valor[1]])}
            format="DD/MM/YYYY"
            allowClear={false}
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setRecargas((n) => n + 1)} loading={loading}>
            Actualizar
          </Button>
        </Space>
      </Space>
      <Table
        rowKey="id_turno"
        loading={loading}
        dataSource={datos?.turnos ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No hay turnos cerrados en esas fechas' }}
        expandable={{
          expandedRowRender: (turno) => (
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              {turno.observacion_cierre && (
                <Typography.Text>
                  <strong>Observación al cerrar:</strong> {turno.observacion_cierre}
                </Typography.Text>
              )}
              {turno.resumen && <ResumenCajaDetalle resumen={turno.resumen} periodo="en este turno" />}
            </Space>
          ),
        }}
        columns={[
          {
            title: 'Fecha',
            dataIndex: 'fecha_apertura',
            width: 110,
            render: (valor: string) => dayjs(valor).format('DD/MM/YYYY'),
          },
          { title: 'Turno', dataIndex: 'nombre', width: 90, render: (nombre: Turno['nombre']) => ETIQUETA_TURNO[nombre] },
          {
            title: 'Horario',
            width: 120,
            render: (_, turno: Turno) =>
              `${dayjs(turno.fecha_apertura).format('HH:mm')} – ${turno.fecha_cierre ? dayjs(turno.fecha_cierre).format('HH:mm') : '…'}`,
          },
          {
            title: 'Abrió / cerró',
            render: (_, turno: Turno) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                {turno.usuario_apertura.nombre} / {turno.usuario_cierre?.nombre ?? '—'}
              </span>
            ),
          },
          {
            title: 'Cobrado',
            align: 'right',
            render: (_, turno: Turno) => formatearMoneda(turno.resumen?.cobrado.total ?? '0'),
          },
          { title: 'Efectivo inicial', dataIndex: 'efectivo_inicial', align: 'right', render: formatearMoneda },
          {
            title: 'Esperado',
            dataIndex: 'efectivo_esperado',
            align: 'right',
            render: (valor: string | null) => (valor ? formatearMoneda(valor) : '—'),
          },
          {
            title: 'Contado',
            dataIndex: 'efectivo_contado',
            align: 'right',
            render: (valor: string | null) => (valor ? formatearMoneda(valor) : '—'),
          },
          {
            title: 'Diferencia',
            dataIndex: 'diferencia',
            render: (valor: string | null) => <DiferenciaCaja diferencia={valor} />,
          },
        ]}
      />
    </Space>
  );
}
