import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/auth.store';

interface SesionUsuarioProps {
  /** Texto claro para usar sobre fondos oscuros (Header). */
  oscuro?: boolean;
}

export function SesionUsuario({ oscuro }: SesionUsuarioProps) {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!usuario) {
    return null;
  }

  return (
    <Space size="middle">
      <Typography.Text style={oscuro ? { color: 'rgba(255,255,255,0.85)' } : undefined}>
        <UserOutlined /> {usuario.nombre}
      </Typography.Text>
      <Button size="small" icon={<LogoutOutlined />} onClick={cerrarSesion}>
        Salir
      </Button>
    </Space>
  );
}
