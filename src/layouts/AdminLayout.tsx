import {
  AppstoreOutlined,
  DashboardOutlined,
  FireOutlined,
  IdcardOutlined,
  QrcodeOutlined,
  ShoppingOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { SesionUsuario } from '../shared/SesionUsuario';
import './layouts.css';

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Resumen</Link> },
  { key: '/admin/categorias', icon: <AppstoreOutlined />, label: <Link to="/admin/categorias">Categorías</Link> },
  { key: '/admin/productos', icon: <ShoppingOutlined />, label: <Link to="/admin/productos">Productos</Link> },
  { key: '/admin/mesas', icon: <QrcodeOutlined />, label: <Link to="/admin/mesas">Mesas</Link> },
  { key: '/admin/reviews', icon: <StarOutlined />, label: <Link to="/admin/reviews">Reviews</Link> },
  { key: '/admin/usuarios', icon: <IdcardOutlined />, label: <Link to="/admin/usuarios">Usuarios</Link> },
  { key: '/cocina', icon: <FireOutlined />, label: <Link to="/cocina">Panel de cocina</Link> },
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
