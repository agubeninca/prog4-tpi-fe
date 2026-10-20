import { Button, Form, InputNumber, Switch } from 'antd';
import type { MesaInput } from '../services/mesa.service';

interface MesaFormProps {
  initialValues?: MesaInput;
  onSubmit: (data: MesaInput) => void;
  loading?: boolean;
}

export function MesaForm({ initialValues, onSubmit, loading }: MesaFormProps) {
  return (
    <Form layout="vertical" initialValues={initialValues ?? { activa: true }} onFinish={onSubmit}>
      <Form.Item name="numero_mesa" label="Número de mesa" rules={[{ required: true, message: 'Ingresá el número' }]}>
        <InputNumber min={1} max={999} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="activa" label="Habilitada para pedidos">
        <Switch checkedChildren="Sí" unCheckedChildren="No" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
