import { Button, Space, Typography } from 'antd';
import { Link } from 'react-router';

const { Title, Paragraph } = Typography;

export function InicioView() {
  return (
    <div style={{ maxWidth: 480, margin: '64px auto', padding: 16, textAlign: 'center' }}>
      <Title level={2}>Kitch</Title>
      <Paragraph>Menú digital y pedidos desde la mesa.</Paragraph>
      <Paragraph type="secondary">
        Los clientes ingresan escaneando el QR de su mesa. El personal ingresa desde acá.
      </Paragraph>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Link to="/cocina">
          <Button block size="large">
            Cocina / Barra
          </Button>
        </Link>
        <Link to="/admin">
          <Button block size="large" type="primary">
            Administración
          </Button>
        </Link>
      </Space>
    </div>
  );
}
