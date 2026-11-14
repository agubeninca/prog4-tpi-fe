import { Button, Space, Typography } from 'antd';
import { Link } from 'react-router';

const { Title, Paragraph } = Typography;

export function InicioView() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--marca-verde-suave)' }}>
      <div className="franja-marca" />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
      <Title level={2}>Kitch</Title>
      <Paragraph>Menú digital y pedidos desde la mesa.</Paragraph>
      <Paragraph type="secondary">
        Los clientes ingresan escaneando el QR de su mesa. El personal ingresa desde acá.
      </Paragraph>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Link to="/cocina">
          <Button block size="large">
            Barra / Cocina
          </Button>
        </Link>
        <Link to="/admin">
          <Button block size="large" type="primary">
            Administración
          </Button>
        </Link>
      </Space>
      </div>
    </div>
  );
}
