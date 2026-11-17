import { useState } from 'react';
import { UnlockOutlined } from '@ant-design/icons';
import { Button, Card, Form, InputNumber, Segmented, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { ETIQUETA_TURNO, turnoSegunHora, turnoService, type NombreTurno, type Turno } from '../services/turno.service';

interface AbrirTurnoCardProps {
  onAbierto: (turno: Turno) => void;
}

/** Sin turno abierto no se puede cobrar: se abre eligiendo el turno y el efectivo con el que arranca la caja. */
export function AbrirTurnoCard({ onAbierto }: AbrirTurnoCardProps) {
  const [form] = Form.useForm<{ nombre: NombreTurno; efectivo_inicial: number }>();
  const [guardando, setGuardando] = useState(false);

  const abrir = async (datos: { nombre: NombreTurno; efectivo_inicial: number }) => {
    setGuardando(true);
    try {
      const turno = await turnoService.abrir(datos);
      message.success(`Turno ${ETIQUETA_TURNO[turno.nombre].toLowerCase()} abierto`);
      onAbierto(turno);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card title="Abrir turno" style={{ maxWidth: 520 }}>
      <Typography.Paragraph type="secondary">
        No hay un turno de caja abierto. Hasta que abras uno no se puede cobrar ningún pedido.
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ nombre: turnoSegunHora(dayjs().hour()), efectivo_inicial: 0 }}
        onFinish={abrir}
      >
        <Form.Item name="nombre" label="Turno">
          <Segmented<NombreTurno>
            block
            options={(Object.keys(ETIQUETA_TURNO) as NombreTurno[]).map((valor) => ({
              value: valor,
              label: ETIQUETA_TURNO[valor],
            }))}
          />
        </Form.Item>
        <Form.Item
          name="efectivo_inicial"
          label="Efectivo inicial en la caja"
          extra="El cambio con el que arranca el turno. Si la caja empieza vacía, dejá 0."
          rules={[{ required: true, message: 'Ingresá el efectivo inicial (puede ser 0)' }]}
        >
          <InputNumber prefix="$" min={0} max={99999999.99} precision={2} decimalSeparator="," style={{ width: '100%' }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<UnlockOutlined />} loading={guardando} block>
          Abrir turno
        </Button>
      </Form>
    </Card>
  );
}
