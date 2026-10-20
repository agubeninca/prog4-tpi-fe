import { useState } from 'react';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Flex, InputNumber, Typography, message } from 'antd';
import axios from 'axios';
import Decimal from 'decimal.js';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { CANTIDAD_MAXIMA, totalCarrito, useCarritoStore } from '../../../stores/carrito.store';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { clienteMesaService } from '../services/clienteMesa.service';

export function CarritoView() {
  const { hash = '' } = useParams();
  const navigate = useNavigate();
  const { cliente, agregarPedido } = useSesionClienteStore();
  const { items, cambiarCantidad, quitar, vaciar } = useCarritoStore();
  const [enviando, setEnviando] = useState(false);

  const volverAlMenu = () => navigate(`/m/${hash}/menu`);

  const confirmarPedido = async () => {
    if (!cliente) return;
    setEnviando(true);
    try {
      const pedido = await clienteMesaService.crearPedido({
        hash_codigo_qr: hash,
        dni: cliente.dni,
        nombre: cliente.nombre,
        items: items.map((item) => ({ id_producto: item.producto.id_producto, cantidad: item.cantidad })),
      });
      vaciar();
      agregarPedido(pedido.id_pedido);
      message.success('¡Pedido enviado a la cocina!');
      navigate(`/m/${hash}/pedido/${pedido.id_pedido}`, { replace: true });
    } catch (error) {
      // RB-02: si un producto se pausó mientras tanto, el backend devuelve su id para sacarlo del carrito.
      const idNoDisponible = axios.isAxiosError(error)
        ? (error.response?.data as { id_producto?: number } | undefined)?.id_producto
        : undefined;
      if (idNoDisponible) {
        quitar(idNoDisponible);
        message.warning(`${getErrorMessage(error)}. Lo sacamos de tu pedido.`);
      } else {
        message.error(getErrorMessage(error));
      }
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <Empty description="Tu pedido está vacío">
          <Button type="primary" onClick={volverAlMenu}>
            Ver el menú
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={volverAlMenu} style={{ paddingInline: 0 }}>
        Seguir eligiendo
      </Button>
      <Typography.Title level={4}>Tu pedido</Typography.Title>
      <Flex vertical>
        {items.map((item, indice) => (
          <div key={item.producto.id_producto}>
            {indice > 0 && <Divider style={{ margin: '12px 0' }} />}
            <Flex justify="space-between" align="center" gap={8}>
              <Typography.Text strong>{item.producto.nombre}</Typography.Text>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Quitar ${item.producto.nombre}`}
                onClick={() => quitar(item.producto.id_producto)}
              />
            </Flex>
            <Flex align="center" justify="space-between" gap={8} wrap style={{ marginTop: 4 }}>
              <InputNumber
                min={1}
                max={CANTIDAD_MAXIMA}
                precision={0}
                value={item.cantidad}
                onChange={(valor) => valor && cambiarCantidad(item.producto.id_producto, valor)}
                style={{ width: 100 }}
              />
              <Typography.Text>
                {formatearMoneda(new Decimal(item.producto.precio).times(item.cantidad).toString())}
              </Typography.Text>
            </Flex>
          </div>
        ))}
      </Flex>
      <Divider style={{ margin: '8px 0 16px' }} />
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Text style={{ fontSize: 16 }}>Total</Typography.Text>
        <Typography.Text strong style={{ fontSize: 20 }}>
          {formatearMoneda(totalCarrito(items).toString())}
        </Typography.Text>
      </Flex>
      <Button type="primary" size="large" block loading={enviando} onClick={confirmarPedido}>
        Confirmar pedido
      </Button>
    </Card>
  );
}
