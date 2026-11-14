import { useEffect, useState } from 'react';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Result, Skeleton, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { CANTIDAD_MAXIMA, useCarritoStore } from '../../../stores/carrito.store';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { EstadoPedidoTag } from '../../Pedido/components/EstadoPedidoTag';
import {
  clienteMesaService,
  type CategoriaMenu,
  type PedidoReciente,
  type ProductoMenu,
} from '../services/clienteMesa.service';

/** Historial del cliente: sus últimos pedidos, con "Pedir de nuevo" para repetir uno. */
export function MisPedidosView() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const cliente = useSesionClienteStore((state) => state.cliente);
  const [datos, setDatos] = useState<{ pedidos: PedidoReciente[]; menu: CategoriaMenu[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    if (!cliente) return;
    let vigente = true;
    // El menú actual sirve para saber qué productos del pedido viejo se pueden volver a pedir.
    Promise.all([clienteMesaService.getMisPedidos(cliente.dni), clienteMesaService.getMenu()])
      .then(([pedidos, menu]) => vigente && setDatos({ pedidos, menu }))
      .catch((err: unknown) => vigente && setError(getErrorMessage(err)));
    return () => {
      vigente = false;
    };
  }, [cliente, recargas]);

  const pedirDeNuevo = (pedido: PedidoReciente) => {
    if (!datos) return;
    const disponibles = new Map<number, ProductoMenu>(
      datos.menu.flatMap((categoria) => categoria.productos.map((producto) => [producto.id_producto, producto] as const)),
    );
    const { items, agregar, cambiarCantidad } = useCarritoStore.getState();

    const faltantes: string[] = [];
    let agregados = 0;
    for (const { cantidad, producto } of pedido.detalle_pedido) {
      const actual = disponibles.get(producto.id_producto);
      if (!actual) {
        faltantes.push(producto.nombre);
        continue;
      }
      const enCarrito = items.find((item) => item.producto.id_producto === actual.id_producto)?.cantidad ?? 0;
      if (enCarrito === 0) agregar(actual);
      cambiarCantidad(actual.id_producto, Math.min(enCarrito + cantidad, CANTIDAD_MAXIMA));
      agregados += 1;
    }

    if (agregados === 0) {
      message.error('Ninguno de los productos de ese pedido está disponible ahora.');
      return;
    }
    if (faltantes.length > 0) {
      message.warning(`No están disponibles ahora: ${faltantes.join(', ')}. Agregamos el resto.`, 6);
    } else {
      message.success('Agregamos los productos a tu pedido');
    }
    navigate(`/m/${hash}/carrito`);
  };

  if (error && !datos) {
    return (
      <Result
        status="error"
        title="No pudimos cargar tus pedidos"
        subTitle={error}
        extra={<Button onClick={() => { setError(null); setRecargas((n) => n + 1); }}>Reintentar</Button>}
      />
    );
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/m/${hash}/menu`)} style={{ paddingInline: 0 }}>
          Volver al menú
        </Button>
        <Button type="text" icon={<ReloadOutlined />} aria-label="Actualizar" onClick={() => setRecargas((n) => n + 1)} />
      </Flex>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Mis pedidos
      </Typography.Title>

      {!datos ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : datos.pedidos.length === 0 ? (
        <Card>
          <Empty description="Todavía no hiciste pedidos">
            <Button type="primary" onClick={() => navigate(`/m/${hash}/menu`)}>
              Ver el menú
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Typography.Text type="secondary">Tus últimos {datos.pedidos.length} pedidos, del más nuevo al más viejo.</Typography.Text>
          {datos.pedidos.map((pedido) => (
            <Card key={pedido.id_pedido} size="small">
              <Flex justify="space-between" align="center" gap={8} wrap>
                <div>
                  <strong>Pedido #{pedido.id_pedido}</strong>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {dayjs(pedido.fecha_hora_ingreso).format('DD/MM/YYYY HH:mm')} · Mesa {pedido.mesa.numero_mesa}
                    </Typography.Text>
                  </div>
                </div>
                <EstadoPedidoTag estado={pedido.estado} />
              </Flex>

              <Flex vertical gap={2} style={{ margin: '12px 0' }}>
                {pedido.detalle_pedido.map(({ cantidad, producto }) => (
                  <span key={producto.id_producto}>
                    {cantidad} × {producto.nombre}
                  </span>
                ))}
              </Flex>

              <Flex justify="space-between" align="center" gap={8} wrap>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {formatearMoneda(pedido.precio_total)}
                </Typography.Text>
                <Flex gap={8} wrap>
                  <Button onClick={() => navigate(`/m/${hash}/pedido/${pedido.id_pedido}`)}>Ver estado</Button>
                  <Button type="primary" onClick={() => pedirDeNuevo(pedido)}>
                    Pedir de nuevo
                  </Button>
                </Flex>
              </Flex>
            </Card>
          ))}
        </>
      )}
    </Flex>
  );
}
