import { Button, Form, Input, Select } from 'antd';
import {
  DESCRIPCION_ROL,
  ETIQUETA_ROL,
  NOMBRE_USUARIO_MENSAJE,
  NOMBRE_USUARIO_REGEX,
  normalizarNombreUsuario,
  type UsuarioRol,
} from '../../Auth/services/auth.service';
import type { UsuarioInput } from '../services/usuario.service';

interface UsuarioFormProps {
  initialValues?: UsuarioInput;
  editando: boolean;
  onSubmit: (data: UsuarioInput) => void;
  loading?: boolean;
}

const OPCIONES_ROL = (Object.keys(ETIQUETA_ROL) as UsuarioRol[]).map((rol) => ({ value: rol, label: ETIQUETA_ROL[rol] }));

export function UsuarioForm({ initialValues, editando, onSubmit, loading }: UsuarioFormProps) {
  const [form] = Form.useForm<UsuarioInput>();
  const rol = Form.useWatch('rol', form);

  return (
    <Form form={form} layout="vertical" initialValues={initialValues ?? { rol: 'BARRA' }} onFinish={onSubmit}>
      <Form.Item
        name="nombre_usuario"
        label="Usuario"
        normalize={(valor: string) => normalizarNombreUsuario(valor ?? '')}
        rules={[
          { required: true, message: 'Ingresá el usuario' },
          { pattern: NOMBRE_USUARIO_REGEX, message: NOMBRE_USUARIO_MENSAJE },
        ]}
        extra={editando ? 'El usuario no se puede modificar.' : 'Con esto se ingresa al sistema. Ej.: cocina1, jperez o un legajo.'}
      >
        <Input maxLength={30} disabled={editando} autoComplete="off" autoCapitalize="none" spellCheck={false} />
      </Form.Item>
      <Form.Item
        name="nombre"
        label="Nombre"
        rules={[{ required: true, whitespace: true, message: 'Ingresá el nombre' }]}
        extra="Se muestra en el panel. Ej.: Juan Pérez o Turno mañana."
      >
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item name="rol" label="Rol" rules={[{ required: true, message: 'Elegí el rol' }]} extra={rol && DESCRIPCION_ROL[rol]}>
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
