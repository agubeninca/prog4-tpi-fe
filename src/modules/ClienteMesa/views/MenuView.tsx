import { useEffect, useState } from 'react';
import { ProfileOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Col, Empty, FloatButton, Result, Row, Skeleton, Tabs, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { cantidadEnCarrito, useCarritoStore } from '../../../stores/carrito.store';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { ProductoCard } from '../components/ProductoCard';
import { clienteMesaService, type CategoriaMenu, type ProductoMenu } from '../services/clienteMesa.service';

export function MenuView() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const { cliente, pedidos } = useSesionClienteStore();
  const { items, agregar } = useCarritoStore();
  const [menu, setMenu] = useState<CategoriaMenu[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clienteMesaService
      .getMenu()
      .then(setMenu)
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, []);

  const cantidadDe = (idProducto: number) =>
    items.find((item) => item.producto.id_producto === idProducto)?.cantidad ?? 0;

  const handleAgregar = (producto: ProductoMenu) => {
    agregar(producto);
    message.success({ content: `${producto.nombre} agregado`, duration: 1 });
  };

  const totalItems = cantidadEnCarrito(items);
  const ultimoPedido = pedidos.at(-1);

  if (error) {
    return <Result status="error" title="No pudimos cargar el menú" subTitle={error} />;
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Hola, {cliente?.nombre}
      </Typography.Title>
      <Typography.Paragraph type="secondary">Elegí lo que quieras pedir.</Typography.Paragraph>
      {ultimoPedido && (
        <Button
          block
          icon={<ProfileOutlined />}
          style={{ marginBottom: 16 }}
          onClick={() => navigate(`/m/${hash}/pedido/${ultimoPedido}`)}
        >
          Ver mi pedido #{ultimoPedido}
        </Button>
      )}

      {!menu ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : menu.length === 0 ? (
        <Empty description="Por ahora no hay productos disponibles" />
      ) : (
        <Tabs
          items={menu.map((categoria) => ({
            key: String(categoria.id_categoria),
            label: categoria.nombre,
            children: (
              <>
                {categoria.descripcion && <Typography.Paragraph type="secondary">{categoria.descripcion}</Typography.Paragraph>}
                <Row gutter={[12, 12]}>
                  {categoria.productos.map((producto) => (
                    <Col key={producto.id_producto} xs={24} sm={12}>
                      <ProductoCard
                        producto={producto}
                        cantidadEnCarrito={cantidadDe(producto.id_producto)}
                        onAgregar={() => handleAgregar(producto)}
                      />
                    </Col>
                  ))}
                </Row>
              </>
            ),
          }))}
        />
      )}

      {totalItems > 0 && (
        <FloatButton
          type="primary"
          icon={<ShoppingCartOutlined />}
          badge={{ count: totalItems }}
          tooltip="Ver carrito"
          style={{ insetInlineEnd: 24, insetBlockEnd: 24, width: 56, height: 56 }}
          onClick={() => navigate(`/m/${hash}/carrito`)}
        />
      )}
    </div>
  );
}
