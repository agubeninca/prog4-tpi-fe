import { useEffect, useState } from 'react';
import { Card, DatePicker, Flex, Rate, Space, Statistic, Table, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { reviewService, type ListadoReviews, type ReviewAdmin } from '../services/review.service';

type Rango = [Dayjs | null, Dayjs | null] | null;

export function ReviewListView() {
  const [rango, setRango] = useState<Rango>(null);
  const [listado, setListado] = useState<ListadoReviews | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        setListado(
          await reviewService.getAll({
            desde: rango?.[0]?.format('YYYY-MM-DD'),
            hasta: rango?.[1]?.format('YYYY-MM-DD'),
          }),
        );
      } catch (error) {
        message.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    void cargar();
  }, [rango]);

  const promedio = listado?.promedio ?? 0;

  return (
    <div>
      <Space wrap style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <h1>Reviews</h1>
        <DatePicker.RangePicker
          value={rango}
          onChange={(valor) => setRango(valor)}
          format="DD/MM/YYYY"
          disabledDate={(dia) => dia.isAfter(dayjs(), 'day')}
        />
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
        locale={{ emptyText: 'Todavía no hay reviews' }}
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
        ]}
      />
    </div>
  );
}
