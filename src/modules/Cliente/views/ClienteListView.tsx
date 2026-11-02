import { useEffect, useState } from 'react';
import { Button, Input, Rate, Space, Table, Typography, message } from 'antd';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { ClienteDetalleDrawer } from '../components/ClienteDetalleDrawer';
import { clienteService, type ClienteResumen } from '../services/cliente.service';

export function ClienteListView() {
  const [busqueda, setBusqueda] = useState('');
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; clientes: ClienteResumen[] } | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const clave = `${busqueda}#${recargas}`;
  const loading = datos?.clave !== clave;

  useEffect(() => {
    let vigente = true;
    clienteService
      .getAll(busqueda)
      .then((clientes) => vigente && setDatos({ clave, clientes }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, clientes: [] });
      });
    return () => {
      vigente = false;
    };
  }, [busqueda, clave]);

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Clientes</h1>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Buscar por nombre o DNI"
            style={{ width: 280 }}
            onSearch={(valor) => setBusqueda(valor.trim())}
          />
          <Button onClick={() => setRecargas((n) => n + 1)} loading={loading}>
            Actualizar
          </Button>
        </Space>
      </Space>
      <Typography.Paragraph type="secondary">
        Se registran al identificarse con DNI y nombre en la mesa. Hacé clic en un cliente para ver su ficha.
      </Typography.Paragraph>
      <Table
        rowKey="dni"
        loading={loading}
        dataSource={datos?.clientes ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: busqueda ? 'Ningún cliente coincide con la búsqueda' : 'Todavía no hay clientes' }}
        onRow={(cliente) => ({ onClick: () => setSeleccionado(cliente.dni), style: { cursor: 'pointer' } })}
        columns={[
          {
            title: 'Nombre y apellido',
            dataIndex: 'nombre',
            width: 220,
            sorter: (a, b) => a.nombre.localeCompare(b.nombre),
          },
          { title: 'DNI', dataIndex: 'dni', width: 120, render: formatearDni },
          {
            title: 'Pedidos',
            dataIndex: 'cantidad_pedidos',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.cantidad_pedidos - b.cantidad_pedidos,
          },
          {
            title: 'Total gastado',
            dataIndex: 'total_gastado',
            width: 140,
            align: 'right',
            render: (valor: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatearMoneda(valor)}</span>,
            sorter: (a, b) => new Decimal(a.total_gastado).comparedTo(b.total_gastado),
          },
          {
            title: 'Reviews',
            width: 190,
            render: (_, cliente: ClienteResumen) =>
              cliente.cantidad_reviews === 0 ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : (
                <Space size={6}>
                  <Rate disabled allowHalf value={Math.round((cliente.promedio_puntuacion ?? 0) * 2) / 2} style={{ fontSize: 12 }} />
                  <Typography.Text type="secondary">({cliente.cantidad_reviews})</Typography.Text>
                </Space>
              ),
            sorter: (a, b) => (a.promedio_puntuacion ?? 0) - (b.promedio_puntuacion ?? 0),
          },
          {
            title: 'Última visita',
            dataIndex: 'ultima_visita',
            width: 150,
            render: (valor: string | null) =>
              valor ? (
                <span title={dayjs(valor).format('DD/MM/YYYY HH:mm')}>{dayjs(valor).fromNow()}</span>
              ) : (
                <Typography.Text type="secondary">Sin pedidos</Typography.Text>
              ),
            sorter: (a, b) => dayjs(a.ultima_visita ?? 0).valueOf() - dayjs(b.ultima_visita ?? 0).valueOf(),
          },
          {
            title: 'Cliente desde',
            dataIndex: 'fecha_creacion',
            width: 120,
            render: (valor: string) => dayjs(valor).format('DD/MM/YYYY'),
            sorter: (a, b) => dayjs(a.fecha_creacion).valueOf() - dayjs(b.fecha_creacion).valueOf(),
          },
        ]}
      />
      <ClienteDetalleDrawer
        dni={seleccionado}
        onClose={() => setSeleccionado(null)}
        onCambio={() => setRecargas((n) => n + 1)}
      />
    </div>
  );
}
