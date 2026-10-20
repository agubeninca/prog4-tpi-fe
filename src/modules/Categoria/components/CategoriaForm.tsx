import { Button, Form, Input } from 'antd';
import type { CategoriaInput } from '../services/categoria.service';

interface CategoriaFormProps {
  initialValues?: CategoriaInput;
  onSubmit: (data: CategoriaInput) => void;
  loading?: boolean;
}

export function CategoriaForm({ initialValues, onSubmit, loading }: CategoriaFormProps) {
  return (
    <Form layout="vertical" initialValues={initialValues} onFinish={onSubmit}>
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, whitespace: true, message: 'Ingresá el nombre' }]}
      >
        <Input maxLength={100} placeholder="Cafetería" />
      </Form.Item>
      <Form.Item name="descripcion" label="Descripción">
        <Input.TextArea maxLength={255} showCount rows={2} placeholder="Cafés, infusiones y chocolates" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
