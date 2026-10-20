import { Button, Form, Input, InputNumber, Select } from 'antd';
import type { Categoria } from '../../Categoria/services/categoria.service';
import type { ProductoInput } from '../services/producto.service';

interface ProductoFormProps {
  initialValues?: Partial<ProductoInput>;
  categorias: Categoria[];
  onSubmit: (data: ProductoInput) => void;
  loading?: boolean;
}

export function ProductoForm({ initialValues, categorias, onSubmit, loading }: ProductoFormProps) {
  return (
    <Form layout="vertical" initialValues={initialValues} onFinish={onSubmit}>
      <Form.Item name="id_categoria" label="Categoría" rules={[{ required: true, message: 'Elegí la categoría' }]}>
        <Select
          placeholder="Elegí una categoría"
          options={categorias.map((categoria) => ({ value: categoria.id_categoria, label: categoria.nombre }))}
          showSearch={{ optionFilterProp: 'label' }}
        />
      </Form.Item>
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, whitespace: true, message: 'Ingresá el nombre' }]}
      >
        <Input maxLength={150} placeholder="Café con leche" />
      </Form.Item>
      <Form.Item name="descripcion" label="Descripción">
        <Input.TextArea maxLength={500} showCount rows={3} placeholder="Taza grande, con leche espumada" />
      </Form.Item>
      <Form.Item name="precio" label="Precio" rules={[{ required: true, message: 'Ingresá el precio' }]}>
        <InputNumber min={0} max={99999999.99} precision={2} step={100} prefix="$" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
