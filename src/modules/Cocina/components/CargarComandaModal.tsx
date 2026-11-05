import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Empty, Flex, Form, Input, InputNumber, Modal, Select, Spin, Typography, message } from 'antd';
import axios from 'axios';
import Decimal from 'decimal.js';
import { getErrorMessage } from '../../../shared/api';
import { limpiarDni } from '../../../shared/dni';
import { formatearMoneda } from '../../../shared/moneda';
import { clienteMesaService, type CategoriaMenu, type ConsultaDni, type ProductoMenu } from '../../ClienteMesa/services/clienteMesa.service';
import { mesaService } from '../../Mesa/services/mesa.service';
import { pedidoService, type Pedido } from '../../Pedido/services/pedido.service';

const DNI_VALIDO = /^\d{7,8}$/;
const CANTIDAD_MAXIMA = 50;

interface CargarComandaModalProps {
  onClose: () => void;
  onCreada?: (pedido: Pedido) => void;
}

interface DatosComanda {
  id_mesa: number;
  dni: string;
  nombre?: string;
  observacion?: string;
}

interface Linea {
  producto: ProductoMenu;
  cantidad: number;
}

/** La Barra carga a mano la comanda de un cliente que no usa el QR (ej. personas mayores). */
export function CargarComandaModal({ onClose, onCreada }: CargarComandaModalProps) {
  const [form] = Form.useForm<DatosComanda>();
  const dni = Form.useWatch('dni', form) ?? '';
  const [mesas, setMesas] = useState<{ id_mesa: number; numero_mesa: number }[] | null>(null);
  const [menu, setMenu] = useState<CategoriaMenu[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<{ dni: string; resultado: ConsultaDni } | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [productoElegido, setProductoElegido] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargarMenu = () =>
    clienteMesaService
      .getMenu()
      .then(setMenu)
      .catch((error: unknown) => setErrorCarga(getErrorMessage(error)));

  useEffect(() => {
    mesaService
      .getActivas()
      .then(setMesas)
      .catch((error: unknown) => setErrorCarga(getErrorMessage(error)));
    void cargarMenu();
  }, []);

  // Con un DNI completo se averigua si el cliente ya existe: si es nuevo, hay que pedirle el nombre.
  useEffect(() => {
    if (!DNI_VALIDO.test(dni)) return;
    let vigente = true;
    clienteMesaService
      .consultarDni(dni)
      .then((resultado) => vigente && setConsulta({ dni, resultado }))
      .catch(() => vigente && setConsulta(null));
    return () => {
      vigente = false;
    };
  }, [dni]);

  const consultaActual = consulta?.dni === dni ? consulta.resultado : null;
  const clienteNuevo = consultaActual ? !consultaActual.registrado : false;

  const productos = useMemo(() => (menu ?? []).flatMap((categoria) => categoria.productos), [menu]);
  const opcionesProducto = useMemo(
    () =>
      (menu ?? []).map((categoria) => ({
        label: categoria.nombre,
        options: categoria.productos.map((producto) => ({
          value: producto.id_producto,
          label: `${producto.nombre} · ${formatearMoneda(producto.precio)}`,
        })),
      })),
    [menu],
  );

  const total = lineas.reduce((suma, linea) => suma.plus(new Decimal(linea.producto.precio).times(linea.cantidad)), new Decimal(0));

  const agregarProducto = () => {
    const producto = productos.find((p) => p.id_producto === productoElegido);
    if (!producto) return;
    setLineas((actuales) => {
      const existente = actuales.find((linea) => linea.producto.id_producto === producto.id_producto);
      if (existente) {
        return actuales.map((linea) =>
          linea === existente ? { ...linea, cantidad: Math.min(linea.cantidad + 1, CANTIDAD_MAXIMA) } : linea,
        );
      }
      return [...actuales, { producto, cantidad: 1 }];
    });
    setProductoElegido(null);
  };

  const cambiarCantidad = (idProducto: number, cantidad: number) =>
    setLineas((actuales) => actuales.map((linea) => (linea.producto.id_producto === idProducto ? { ...linea, cantidad } : linea)));

  const quitar = (idProducto: number) => setLineas((actuales) => actuales.filter((linea) => linea.producto.id_producto !== idProducto));

  const confirmar = async ({ id_mesa, nombre, observacion }: DatosComanda) => {
    if (lineas.length === 0) {
      message.warning('Agregá al menos un producto');
      return;
    }
    setGuardando(true);
    try {
      const pedido = await pedidoService.crearManual({
        id_mesa,
        dni,
        nombre: clienteNuevo ? nombre?.trim() : undefined,
        observacion: observacion?.trim() || undefined,
        items: lineas.map((linea) => ({ id_producto: linea.producto.id_producto, cantidad: linea.cantidad })),
      });
      message.success(`Comanda #${pedido.id_pedido} cargada para la mesa ${pedido.mesa.numero_mesa}`);
      onCreada?.(pedido);
      onClose();
    } catch (error) {
      // Si un producto se pausó mientras tanto, el backend devuelve su id: se saca y se actualiza el menú.
      const idNoDisponible = axios.isAxiosError(error)
        ? (error.response?.data as { id_producto?: number } | undefined)?.id_producto
        : undefined;
      if (idNoDisponible) {
        quitar(idNoDisponible);
        void cargarMenu();
      }
      message.error(getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  const cargando = !errorCarga && (!mesas || !menu);

  return (
    <Modal
      open
      title="Cargar comanda manual"
      okText="Cargar comanda"
      cancelText="Cancelar"
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: guardando, disabled: cargando || !!errorCarga }}
      width={640}
      destroyOnHidden
    >
      {errorCarga && <Alert type="error" showIcon title={errorCarga} style={{ marginBottom: 16 }} />}
      {cargando ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin />
        </Flex>
      ) : (
        <Form form={form} layout="vertical" onFinish={confirmar} requiredMark={false}>
          <Flex gap={12} wrap>
            <Form.Item name="id_mesa" label="Mesa" rules={[{ required: true, message: 'Elegí la mesa' }]} style={{ width: 140 }}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="N.º"
                options={(mesas ?? []).map((mesa) => ({ value: mesa.id_mesa, label: `Mesa ${mesa.numero_mesa}` }))}
              />
            </Form.Item>
            <Form.Item
              name="dni"
              label="DNI del cliente"
              normalize={limpiarDni}
              rules={[
                { required: true, message: 'Ingresá el DNI' },
                { pattern: DNI_VALIDO, message: '7 u 8 dígitos, sin puntos' },
              ]}
              style={{ flex: 1, minWidth: 180 }}
              extra={
                consultaActual?.registrado
                  ? `Cliente registrado: ${consultaActual.nombre_enmascarado ?? ''}`
                  : clienteNuevo
                    ? 'Cliente nuevo: completá el nombre'
                    : undefined
              }
            >
              <Input inputMode="numeric" placeholder="Ej.: 30123456" autoFocus />
            </Form.Item>
          </Flex>

          {clienteNuevo && (
            <Form.Item
              name="nombre"
              label="Nombre y apellido"
              rules={[
                { required: true, whitespace: true, message: 'Ingresá el nombre y apellido' },
                { min: 3, message: 'Al menos 3 caracteres' },
              ]}
            >
              <Input maxLength={100} />
            </Form.Item>
          )}

          <Typography.Text strong>Productos</Typography.Text>
          <Flex gap={8} style={{ margin: '8px 0 12px' }}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Buscar producto"
              style={{ flex: 1 }}
              value={productoElegido}
              onChange={setProductoElegido}
              options={opcionesProducto}
              notFoundContent="No hay productos disponibles"
            />
            <Button icon={<PlusOutlined />} onClick={agregarProducto} disabled={productoElegido === null}>
              Agregar
            </Button>
          </Flex>

          {lineas.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Todavía no agregaste productos" />
          ) : (
            <Flex vertical gap={8}>
              {lineas.map((linea) => (
                <Flex key={linea.producto.id_producto} align="center" gap={8}>
                  <InputNumber
                    min={1}
                    max={CANTIDAD_MAXIMA}
                    precision={0}
                    value={linea.cantidad}
                    onChange={(valor) => valor && cambiarCantidad(linea.producto.id_producto, valor)}
                    style={{ width: 72 }}
                  />
                  <span style={{ flex: 1 }}>{linea.producto.nombre}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {formatearMoneda(new Decimal(linea.producto.precio).times(linea.cantidad).toString())}
                  </span>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => quitar(linea.producto.id_producto)} />
                </Flex>
              ))}
              <Divider style={{ margin: '4px 0' }} />
              <Flex justify="space-between">
                <Typography.Text strong>Total</Typography.Text>
                <Typography.Text strong>{formatearMoneda(total.toString())}</Typography.Text>
              </Flex>
            </Flex>
          )}

          <Form.Item name="observacion" label="Observación (opcional)" style={{ marginTop: 16, marginBottom: 0 }}>
            <Input.TextArea maxLength={255} showCount rows={2} placeholder="Ej.: cliente sin celular, pidió en la barra" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
