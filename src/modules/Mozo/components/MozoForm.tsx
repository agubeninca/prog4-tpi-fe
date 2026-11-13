import { Button, Form, Input, Switch } from 'antd';
import type { MozoInput } from '../services/mozo.service';

interface MozoFormProps {
  initialValues?: MozoInput;
  onSubmit: (data: MozoInput) => void;
  loading?: boolean;
}

export function MozoForm({ initialValues, onSubmit, loading }: MozoFormProps) {
  return (
    <Form layout="vertical" initialValues={{ activo: true, ...initialValues }} onFinish={onSubmit}>
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, whitespace: true, message: 'Ingresá el nombre' }]}
      >
        <Input maxLength={100} placeholder="Ej.: Juan" autoFocus />
      </Form.Item>
      <Form.Item
        name="activo"
        label="Activo"
        valuePropName="checked"
        extra="Si está inactivo no aparece para elegir al cargar una comanda (ej. de vacaciones)."
      >
        <Switch />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
