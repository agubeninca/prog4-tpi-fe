import { useEffect, useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Flex, Popconfirm, Rate, Select, Space, Statistic, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { formatearDni } from '../../../shared/dni';
import { clienteService, type ClienteResumen } from '../../Cliente/services/cliente.service';
import { reviewService, type ListadoReviews, type ReviewAdmin } from '../services/review.service';

type Rango = [Dayjs | null, Dayjs | null] | null;

export function ReviewListView() {
  const [rango, setRango] = useState<Rango>(null);
  const [dniElegido, setDniElegido] = useState<string | undefined>();
  const [clientes, setClientes] = useState<ClienteResumen[] | null>(null);
  const [recargas, setRecargas] = useState(0);
  const [datos, setDatos] = useState<{ clave: string; listado: ListadoReviews | null } | null>(null);

  // Si el cliente elegido se quedó sin reviews (se eliminaron todas), el filtro deja de aplicarse solo.
  const dniCliente = dniElegido && (clientes === null || clientes.some((cliente) => cliente.dni === dniElegido)) ? dniElegido : undefined;
  const desde = rango?.[0]?.format('YYYY-MM-DD');
  const hasta = rango?.[1]?.format('YYYY-MM-DD');
  const clave = `${desde}|${hasta}|${dniCliente}|${recargas}`;
  const loading = datos?.clave !== clave;
  const listado = datos?.listado ?? null;

  // Para el filtro: solo los clientes que dejaron al menos una review. Se vuelve a pedir al eliminar
  // (un cliente sin reviews deja de aparecer en la lista).
  useEffect(() => {
    clienteService
      .getAll()
      .then((todos) => setClientes(todos.filter((cliente) => cliente.cantidad_reviews > 0)))
      .catch((error: unknown) => message.error(getErrorMessage(error)));
  }, [recargas]);

  useEffect(() => {
    let vigente = true;
    reviewService
      .getAll({ desde, hasta, dni: dniCliente })
      .then((resultado) => vigente && setDatos({ clave, listado: resultado }))
      .catch((error: unknown) => {
        if (!vigente) return;
        message.error(getErrorMessage(error));
        setDatos({ clave, listado: null });
      });
    return () => {
      vigente = false;
    };
  }, [clave, desde, hasta, dniCliente]);

  const eliminar = async (review: ReviewAdmin) => {
    try {
      await reviewService.remove(review.id_review);
      message.success('Review eliminada');
      setRecargas((n) => n + 1);
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const promedio = listado?.promedio ?? 0;

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Reviews</h1>
        <Space wrap>
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="Todos los clientes"
            style={{ width: 260 }}
            value={dniCliente}
            onChange={setDniElegido}
            options={(clientes ?? []).map((cliente) => ({
              value: cliente.dni,
              label: `${cliente.nombre} (${formatearDni(cliente.dni)}) · ${cliente.cantidad_reviews}`,
            }))}
          />
          <DatePicker.RangePicker
            value={rango}
            onChange={(valor) => setRango(valor)}
            format="DD/MM/YYYY"
            disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
          />
        </Space>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Flex wrap gap={32} align="center">
          <Statistic title="Puntuación promedio" value={listado?.promedio ? promedio.toFixed(1) : '—'} suffix={listado?.promedio ? '/ 5' : undefined} />
          <Rate disabled allowHalf value={Math.round(promedio * 2) / 2} />
          <Statistic title="Cantidad de reviews" value={listado?.cantidad ?? 0} />
        </Flex>
      </Card>

      <Table
        rowKey="id_review"
        loading={loading}
        dataSource={listado?.reviews ?? []}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: dniCliente || desde || hasta ? 'Ninguna review coincide con el filtro' : 'Todavía no hay reviews' }}
        columns={[
          {
            title: 'Fecha',
            dataIndex: 'fecha_hora',
            width: 140,
            render: (valor: string) => dayjs(valor).format('DD/MM/YYYY HH:mm'),
          },
          {
            title: 'Puntuación',
            dataIndex: 'puntuacion',
            width: 160,
            render: (valor: number) => <Rate disabled value={valor} style={{ fontSize: 14 }} />,
          },
          {
            title: 'Comentario',
            dataIndex: 'comentario',
            render: (valor: string | null) =>
              valor ?? <Typography.Text type="secondary">Sin comentario</Typography.Text>,
          },
          { title: 'Pedido', width: 80, render: (_, review: ReviewAdmin) => `#${review.pedido.id_pedido}` },
          { title: 'Mesa', width: 70, align: 'center', render: (_, review: ReviewAdmin) => review.pedido.mesa.numero_mesa },
          { title: 'Cliente', width: 160, render: (_, review: ReviewAdmin) => review.pedido.cliente.nombre },
          {
            title: 'Acciones',
            width: 120,
            render: (_, review: ReviewAdmin) => (
              <Popconfirm
                title="¿Eliminar esta review?"
                description="Se borra de forma definitiva y no se puede deshacer."
                okText="Eliminar"
                okButtonProps={{ danger: true }}
                cancelText="Cancelar"
                onConfirm={() => eliminar(review)}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Eliminar
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  );
}
