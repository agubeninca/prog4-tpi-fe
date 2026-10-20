import { CoffeeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import { urlImagen } from '../../../shared/firebase';
import { formatearMoneda } from '../../../shared/moneda';
import type { ProductoMenu } from '../services/clienteMesa.service';

interface ProductoCardProps {
  producto: ProductoMenu;
  cantidadEnCarrito: number;
  onAgregar: () => void;
}

const ALTO_IMAGEN = 160;

export function ProductoCard({ producto, cantidadEnCarrito, onAgregar }: ProductoCardProps) {
  const imagen = urlImagen(producto.ruta_imagen, producto.fecha_actualizacion);

  return (
    <Card
      style={{ height: '100%' }}
      styles={{ body: { padding: 16 } }}
      cover={
        imagen ? (
          <img alt={producto.nombre} src={imagen} style={{ height: ALTO_IMAGEN, objectFit: 'cover' }} loading="lazy" />
        ) : (
          <Flex align="center" justify="center" style={{ height: ALTO_IMAGEN, background: '#fafafa' }}>
            <CoffeeOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
          </Flex>
        )
      }
    >
      <Typography.Title level={5} style={{ marginBottom: 4 }}>
        {producto.nombre}
      </Typography.Title>
      {producto.descripcion && (
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 12 }}>
          {producto.descripcion}
        </Typography.Paragraph>
      )}
      <Flex align="center" justify="space-between" gap={8}>
        <Typography.Text strong style={{ fontSize: 16 }}>
          {formatearMoneda(producto.precio)}
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAgregar}>
          {cantidadEnCarrito > 0 ? `Agregar (${cantidadEnCarrito})` : 'Agregar'}
        </Button>
      </Flex>
    </Card>
  );
}
