import {
  AppstoreOutlined,
  BarChartOutlined,
  BugOutlined,
  DollarOutlined,
  DashboardOutlined,
  FireOutlined,
  FormOutlined,
  IdcardOutlined,
  QrcodeOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SmileOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Layout, Menu, type MenuProps } from 'antd';
import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { SesionUsuario } from '../shared/SesionUsuario';
import './layouts.css';

const item = (ruta: string, icono: ReactNode, texto: string) => ({
  key: ruta,
  icon: icono,
  label: <Link to={ruta}>{texto}</Link>,
});

// Agrupado por tipo de tarea: lo de todos los días arriba, la administración del sistema al final.
const menuItems: MenuProps['items'] = [
  item('/admin', <DashboardOutlined />, 'Resumen'),
  item('/admin/estadisticas', <BarChartOutlined />, 'Estadísticas'),
  {
    type: 'group',
    label: 'Operación',
    children: [
      item('/admin/pedidos', <ShoppingCartOutlined />, 'Pedidos'),
      item('/cocina', <FireOutlined />, 'Panel de comandas'),
      item('/cocina/manuales', <FormOutlined />, 'Comandas manuales'),
      item('/cocina/caja', <DollarOutlined />, 'Caja y turnos'),
    ],
  },
  {
    type: 'group',
    label: 'Catálogo',
    children: [
      item('/admin/productos', <ShoppingOutlined />, 'Productos'),
      item('/admin/categorias', <AppstoreOutlined />, 'Categorías'),
      item('/admin/mesas', <QrcodeOutlined />, 'Mesas'),
      item('/admin/mozos', <SmileOutlined />, 'Mozos'),
    ],
  },
  {
    type: 'group',
    label: 'Clientes',
    children: [
      item('/admin/clientes', <TeamOutlined />, 'Clientes'),
      item('/admin/reviews', <StarOutlined />, 'Reviews'),
    ],
  },
  {
    type: 'group',
    label: 'Sistema',
    children: [
      item('/admin/usuarios', <IdcardOutlined />, 'Usuarios'),
      item('/admin/errores', <BugOutlined />, 'Errores'),
    ],
  },
];

export function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={220} breakpoint="lg" collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="layout-logo">{collapsed ? 'K' : 'Kitch · Admin'}</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Layout.Sider>
      <Layout style={{ minWidth: 0 }}>
        <Layout.Header style={{ background: '#fff', paddingInline: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <SesionUsuario />
        </Layout.Header>
        <Layout.Content className="layout-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
