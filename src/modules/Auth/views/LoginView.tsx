import { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { FirebaseError } from 'firebase/app';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { useAuthStore } from '../../../stores/auth.store';
import { rutaInicioPorRol } from '../services/auth.service';

interface LoginInput {
  nombre_usuario: string;
  password: string;
}

function mensajeErrorLogin(error: unknown) {
  if (error instanceof FirebaseError) {
    // invalid-email: el usuario tiene caracteres que no puede tener (ej. espacios) → para la persona es lo mismo.
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(error.code)) {
      return 'Usuario o contraseña incorrectos';
    }
    if (error.code === 'auth/user-disabled') {
      return 'El usuario está deshabilitado';
    }
    if (error.code === 'auth/network-request-failed') {
      return 'No se pudo conectar con Firebase. ¿Están levantados los emuladores?';
    }
    return error.message;
  }
  return getErrorMessage(error);
}

export function LoginView() {
  const { usuario, inicializado, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;
  const [ingresando, setIngresando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (inicializado && usuario) {
    return <Navigate to={desde ?? rutaInicioPorRol(usuario.rol)} replace />;
  }

  const handleSubmit = async ({ nombre_usuario, password }: LoginInput) => {
    setIngresando(true);
    setError(null);
    try {
      const usuarioLogueado = await login(nombre_usuario, password);
      navigate(desde ?? rutaInicioPorRol(usuarioLogueado.rol), { replace: true });
    } catch (err) {
      setError(mensajeErrorLogin(err));
    } finally {
      setIngresando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f5f5f5' }}>
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Kitch · Personal
        </Typography.Title>
        {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item name="nombre_usuario" label="Usuario" rules={[{ required: true, whitespace: true, message: 'Ingresá tu usuario' }]}>
            <Input
              prefix={<UserOutlined />}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Ej.: cocina1"
            />
          </Form.Item>
          <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Ingresá tu contraseña' }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={ingresando}>
            Ingresar
          </Button>
        </Form>
      </Card>
    </div>
  );
}
