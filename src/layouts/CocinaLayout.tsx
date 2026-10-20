import { Button, Layout, Space } from 'antd';
import { Link, Outlet } from 'react-router';
import { SesionUsuario } from '../shared/SesionUsuario';
import { useAuthStore } from '../stores/auth.store';
import './layouts.css';

export function CocinaLayout() {
  const esAdmin = useAuthStore((state) => state.usuario?.rol === 'ADMIN');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header className="layout-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span>Kitch · Cocina / Barra</span>
        <Space>
          {esAdmin && (
            <Link to="/admin">
              <Button size="small" ghost>
                Administración
              </Button>
            </Link>
          )}
          <SesionUsuario oscuro />
        </Space>
      </Layout.Header>
      <Layout.Content className="layout-content" style={{ background: 'transparent', padding: 0 }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
