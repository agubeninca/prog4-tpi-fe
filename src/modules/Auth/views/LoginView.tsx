import { useState } from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { FirebaseError } from 'firebase/app';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { useAuthStore } from '../../../stores/auth.store';
import { rutaInicioPorRol } from '../services/auth.service';

interface LoginInput {
  email: string;
  password: string;
}

function mensajeErrorLogin(error: unknown) {
  if (error instanceof FirebaseError) {
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code)) {
      return 'Email o contraseña incorrectos';
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

  const handleSubmit = async ({ email, password }: LoginInput) => {
    setIngresando(true);
    setError(null);
    try {
      const usuarioLogueado = await login(email.trim(), password);
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
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Ingresá tu email' },
              { type: 'email', message: 'El email no es válido' },
            ]}
          >
            <Input prefix={<MailOutlined />} autoComplete="username" placeholder="admin@kitch.local" />
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
