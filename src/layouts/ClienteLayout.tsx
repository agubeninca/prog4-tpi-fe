import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router';
import { useSeguimientoPedidos } from '../modules/ClienteMesa/hooks/useSeguimientoPedidos';
import { useSesionClienteStore } from '../stores/sesionCliente.store';
import './layouts.css';

export function ClienteLayout() {
  const mesa = useSesionClienteStore((state) => state.mesa);
  // Avisa cuando un pedido de la sesión cambia de estado, estés en la pantalla que estés.
  useSeguimientoPedidos();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header className="layout-header" style={{ justifyContent: 'space-between' }}>
        <span>Kitch</span>
        {mesa && (
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, fontSize: 14 }}>
            Mesa {mesa.numero_mesa}
          </Typography.Text>
        )}
      </Layout.Header>
      <Layout.Content className="layout-cliente-content">
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
