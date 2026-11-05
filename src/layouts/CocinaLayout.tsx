import { Button, Layout, Space } from 'antd';
import { Link, Outlet, useLocation } from 'react-router';
import { SesionUsuario } from '../shared/SesionUsuario';
import { useAuthStore } from '../stores/auth.store';
import { puedeGestionarComandas } from '../modules/Auth/services/auth.service';
import './layouts.css';

const TITULO_POR_ROL = {
  ADMIN: 'Kitch · Panel de comandas',
  BARRA: 'Kitch · Barra',
  COCINA: 'Kitch · Cocina',
} as const;

const SECCIONES = [
  { ruta: '/cocina', etiqueta: 'Comandas' },
  { ruta: '/cocina/manuales', etiqueta: 'Registro manual' },
];

export function CocinaLayout() {
  const rol = useAuthStore((state) => state.usuario?.rol);
  const { pathname } = useLocation();
  const esAdmin = rol === 'ADMIN';
  // Cocina solo ve el panel; Barra y Admin además acceden al registro de comandas manuales.
  const gestiona = puedeGestionarComandas(rol);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header className="layout-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span>{rol ? TITULO_POR_ROL[rol] : 'Kitch'}</span>
        <Space wrap>
          {gestiona &&
            SECCIONES.map(({ ruta, etiqueta }) => (
              <Link key={ruta} to={ruta}>
                <Button size="small" type={pathname === ruta ? 'primary' : 'default'} ghost={pathname !== ruta}>
                  {etiqueta}
                </Button>
              </Link>
            ))}
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
