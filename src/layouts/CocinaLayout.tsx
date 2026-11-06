import { Button, Layout, Space } from 'antd';
import { Link, Outlet, useLocation } from 'react-router';
import { SesionUsuario } from '../shared/SesionUsuario';
import { useAuthStore } from '../stores/auth.store';
import { puedeGestionarComandas } from '../modules/Auth/services/auth.service';
import './layouts.css';
import '../modules/Cocina/panel-comandas.css';

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
    <Layout style={{ minHeight: '100vh', background: '#edeff3' }}>
      <Layout.Header
        className="layout-header"
        // Alto flexible: en el celular la navegación baja a otra línea sin tapar el contenido.
        style={{ justifyContent: 'space-between', flexWrap: 'wrap', height: 'auto', minHeight: 64, paddingBlock: 10, lineHeight: 'normal' }}
      >
        <span>{rol ? TITULO_POR_ROL[rol] : 'Kitch'}</span>
        <Space wrap>
          {gestiona && (
            <nav className="panel-nav" aria-label="Secciones">
              {SECCIONES.map(({ ruta, etiqueta }) => (
                <Link
                  key={ruta}
                  to={ruta}
                  className={`panel-nav__enlace${pathname === ruta ? ' panel-nav__enlace--activo' : ''}`}
                  aria-current={pathname === ruta ? 'page' : undefined}
                >
                  {etiqueta}
                </Link>
              ))}
            </nav>
          )}
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
