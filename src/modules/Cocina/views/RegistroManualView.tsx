import { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { EstadoPedidoTag } from '../../Pedido/components/EstadoPedidoTag';
import { pedidoService, type RegistroComandaManual } from '../../Pedido/services/pedido.service';

type Rango = [Dayjs | null, Dayjs | null] | null;

/** Registro de comandas cargadas a mano por la Barra: horario, comanda y quién la cargó. */
export function RegistroManualView() {
  // Por defecto, las del día.
  const [rango, setRango] = useState<Rango>(() => [dayjs(), dayjs()]);
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; registros: RegistroComandaManual[] } | null>(null);

  const desde = rango?.[0]?.format('YYYY-MM-DD');
  const hasta = rango?.[1]?.format('YYYY-MM-DD');
  const clave = `${desde}|${hasta}|${recargas}`;
  const loading = datos?.clave !== clave;

  useEffect(() => {
    let vigente = true;
    pedidoService
      .getRegistroManual({ desde, hasta })
      .then((registros) => vigente && setDatos({ clave, registros }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, registros: [] });
      });
    return () => {
      vigente = false;
    };
  }, [clave, desde, hasta]);

  return (
    <div className="layout-content" style={{ margin: 0 }}>
      <Flex wrap gap={12} justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Registro de comandas manuales
        </Typography.Title>
        <Flex wrap gap={12}>
          <DatePicker.RangePicker
            value={rango}
            onChange={(valor) => setRango(valor)}
            format="DD/MM/YYYY"
            allowEmpty={[true, true]}
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setRecargas((n) => n + 1)} loading={loading}>
            Actualizar
          </Button>
        </Flex>
      </Flex>

      <Table
        rowKey="id_registro"
        loading={loading}
        dataSource={datos?.registros ?? []}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        locale={{ emptyText: 'No hay comandas cargadas a mano en este período' }}
        columns={[
          {
            title: 'Fecha y hora',
            dataIndex: 'fecha_hora',
            width: 150,
            render: (valor: string) => dayjs(valor).format('DD/MM/YYYY HH:mm'),
          },
          { title: 'Pedido', width: 80, render: (_, registro: RegistroComandaManual) => `#${registro.id_pedido}` },
          { title: 'Mesa', width: 70, align: 'center', render: (_, registro: RegistroComandaManual) => registro.pedido.mesa.numero_mesa },
          {
            title: 'Cliente',
            width: 200,
            render: (_, registro: RegistroComandaManual) => (
              <div>
                <div>{registro.pedido.cliente.nombre}</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  DNI {formatearDni(registro.pedido.cliente.dni)}
                </Typography.Text>
              </div>
            ),
          },
          {
            title: 'Comanda',
            dataIndex: 'detalle',
            width: 280,
            render: (detalle: string, registro: RegistroComandaManual) => (
              <div style={{ whiteSpace: 'normal' }}>
                <div>{detalle}</div>
                {registro.observacion && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {registro.observacion}
                  </Typography.Text>
                )}
              </div>
            ),
          },
          {
            title: 'Total',
            width: 110,
            align: 'right',
            render: (_, registro: RegistroComandaManual) => (
              <span style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(registro.pedido.precio_total)}</span>
            ),
          },
          {
            title: 'Cargada por',
            width: 160,
            render: (_, registro: RegistroComandaManual) => (
              <div>
                <div>{registro.usuario.nombre}</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {registro.usuario.nombre_usuario}
                </Typography.Text>
              </div>
            ),
          },
          {
            title: 'Estado actual',
            width: 140,
            render: (_, registro: RegistroComandaManual) => <EstadoPedidoTag estado={registro.pedido.estado} />,
          },
        ]}
      />
    </div>
  );
}
