import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Result, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { limpiarDni } from '../../../shared/dni';
import { useCarritoStore } from '../../../stores/carrito.store';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { clienteMesaService, type ClienteSesion, type MesaPublica } from '../services/clienteMesa.service';

export function IdentificacionView() {
  const { hash = '' } = useParams();
  const navigate = useNavigate();
  const { cliente, iniciarMesa, identificar } = useSesionClienteStore();
  const vaciarCarrito = useCarritoStore((state) => state.vaciar);
  const [mesa, setMesa] = useState<MesaPublica | null>(null);
  const [errorMesa, setErrorMesa] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // RF-02: la mesa se identifica a partir del QR escaneado.
  useEffect(() => {
    clienteMesaService
      .getMesa(hash)
      .then((mesaEncontrada) => {
        if (iniciarMesa({ ...mesaEncontrada, hash })) {
          vaciarCarrito();
        }
        setMesa(mesaEncontrada);
      })
      .catch((error: unknown) => setErrorMesa(getErrorMessage(error)));
  }, [hash, iniciarMesa, vaciarCarrito]);

  const handleSubmit = async (datos: ClienteSesion) => {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const registrado = await clienteMesaService.identificar({ dni: datos.dni, nombre: datos.nombre.trim() });
      identificar({ dni: registrado.dni, nombre: registrado.nombre });
      navigate(`/m/${hash}/menu`);
    } catch (error) {
      setErrorEnvio(getErrorMessage(error));
    } finally {
      setEnviando(false);
    }
  };

  if (errorMesa) {
    return (
      <Result
        status="warning"
        title="Este QR no corresponde a una mesa habilitada"
        subTitle="Pedile ayuda al personal del local."
      />
    );
  }

  if (!mesa) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        ¡Bienvenido! · Mesa {mesa.numero_mesa}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Para ver el menú y hacer tu pedido, ingresá tu DNI y tu nombre.
      </Typography.Paragraph>
      <Form
        layout="vertical"
        size="large"
        initialValues={cliente ?? undefined}
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="dni"
          label="DNI"
          normalize={limpiarDni}
          rules={[
            { required: true, message: 'Ingresá tu DNI' },
            { pattern: /^\d{7,8}$/, message: 'El DNI tiene 7 u 8 números' },
          ]}
        >
          <Input inputMode="numeric" autoComplete="off" placeholder="Sin puntos" />
        </Form.Item>
        <Form.Item
          name="nombre"
          label="Nombre"
          rules={[{ required: true, whitespace: true, message: 'Ingresá tu nombre' }]}
        >
          <Input maxLength={100} autoComplete="given-name" placeholder="¿Cómo te llamamos?" />
        </Form.Item>
        {errorEnvio && (
          <Typography.Paragraph type="danger" style={{ marginTop: -8 }}>
            {errorEnvio}
          </Typography.Paragraph>
        )}
        <Button type="primary" htmlType="submit" block loading={enviando}>
          Ver el menú
        </Button>
      </Form>
    </Card>
  );
}
