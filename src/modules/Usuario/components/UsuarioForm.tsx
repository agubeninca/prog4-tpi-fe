import { Button, Form, Input, Select } from 'antd';
import { ETIQUETA_ROL, type UsuarioRol } from '../../Auth/services/auth.service';
import type { UsuarioInput } from '../services/usuario.service';

interface UsuarioFormProps {
  initialValues?: UsuarioInput;
  editando: boolean;
  onSubmit: (data: UsuarioInput) => void;
  loading?: boolean;
}

const OPCIONES_ROL = (Object.keys(ETIQUETA_ROL) as UsuarioRol[]).map((rol) => ({ value: rol, label: ETIQUETA_ROL[rol] }));

export function UsuarioForm({ initialValues, editando, onSubmit, loading }: UsuarioFormProps) {
  return (
    <Form layout="vertical" initialValues={initialValues ?? { rol: 'COCINA' }} onFinish={onSubmit}>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Ingresá el email' },
          { type: 'email', message: 'El email no es válido' },
        ]}
        extra={editando ? 'El email no se puede modificar.' : undefined}
      >
        <Input maxLength={150} disabled={editando} autoComplete="off" />
      </Form.Item>
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, whitespace: true, message: 'Ingresá el nombre' }]}
      >
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item name="rol" label="Rol" rules={[{ required: true, message: 'Elegí el rol' }]}>
        <Select options={OPCIONES_ROL} />
      </Form.Item>
      <Form.Item
        name="password"
        label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        rules={[
          { required: !editando, message: 'Ingresá la contraseña' },
          { min: 6, message: 'Mínimo 6 caracteres' },
        ]}
      >
        <Input.Password maxLength={64} autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
}
