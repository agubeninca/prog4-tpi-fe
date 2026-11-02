import { useEffect, useState } from 'react';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Form, Input, Result, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '../../../shared/api';
import { limpiarDni } from '../../../shared/dni';
import { useCarritoStore } from '../../../stores/carrito.store';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import {
  clienteMesaService,
  type ConsultaDni,
  type Identificacion,
  type MesaPublica,
} from '../services/clienteMesa.service';

const MINIMO_NOMBRE = 3;
const DNI_VALIDO = /^\d{7,8}$/;

interface FormularioIdentificacion {
  dni: string;
  nombre?: string;
}

export function IdentificacionView() {
  const { hash = '' } = useParams();
  const navigate = useNavigate();
  const { cliente, iniciarMesa, identificar } = useSesionClienteStore();
  const vaciarCarrito = useCarritoStore((state) => state.vaciar);
  const [form] = Form.useForm<FormularioIdentificacion>();
  const dniEscrito = Form.useWatch('dni', form);
  const [mesa, setMesa] = useState<MesaPublica | null>(null);
  const [errorMesa, setErrorMesa] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<(ConsultaDni & { dni: string }) | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

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

  // La consulta vale solo para el DNI que está escrito: si lo cambia, se vuelve a preguntar.
  const consultaActual = consulta && consulta.dni === dniEscrito ? consulta : null;
  const yaRegistrado = consultaActual?.registrado === true;

  /** Al terminar de escribir el DNI (pasa al campo del nombre): ¿ya está registrado? */
  const consultarDni = async () => {
    const dni: string = form.getFieldValue('dni') ?? '';
    if (!DNI_VALIDO.test(dni)) return null;
    if (consulta?.dni === dni) return consulta;
    setConsultando(true);
    setAviso(null);
    try {
      const resultado = { dni, ...(await clienteMesaService.consultarDni(dni)) };
      setConsulta(resultado);
      return resultado;
    } catch (error) {
      setAviso(getErrorMessage(error));
      return null;
    } finally {
      setConsultando(false);
    }
  };

  const entrar = async (datos: Identificacion) => {
    setEnviando(true);
    setAviso(null);
    try {
      const respuesta = await clienteMesaService.identificar(datos);
      identificar({ dni: respuesta.dni, nombre: respuesta.nombre });
      navigate(`/m/${hash}/menu`);
    } catch (error) {
      setAviso(getErrorMessage(error));
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = async ({ dni, nombre }: FormularioIdentificacion) => {
    // Si apretó "Ver el menú" sin salir del campo DNI, primero se consulta.
    const resultado = await consultarDni();
    if (resultado?.registrado) return; // aparece la pregunta "¿Sos ...?"
    await entrar({ dni, nombre: nombre?.trim() });
  };

  const noSoyYo = () => {
    setConsulta(null);
    form.setFieldValue('dni', '');
    setAviso('Revisá el DNI: ese ya está registrado a nombre de otra persona. Si es el tuyo y tu nombre quedó mal, pedile al personal que lo corrija.');
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
        Para ver el menú y hacer tu pedido, ingresá tu DNI y tu nombre y apellido.
      </Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        size="large"
        initialValues={{ dni: cliente?.dni }}
        onFinish={handleSubmit}
        // Si apretó Enter sin salir del DNI, la validación falla por el nombre vacío:
        // igual se consulta el DNI, y si ya está registrado aparece la pregunta en lugar del error.
        onFinishFailed={() => void consultarDni()}
        requiredMark={false}
      >
        <Form.Item
          name="dni"
          label="DNI"
          normalize={limpiarDni}
          rules={[
            { required: true, message: 'Ingresá tu DNI' },
            { pattern: DNI_VALIDO, message: 'El DNI tiene 7 u 8 números' },
          ]}
        >
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="Sin puntos"
            onBlur={() => void consultarDni()}
            suffix={consultando ? <Spin size="small" /> : <span />}
          />
        </Form.Item>

        {yaRegistrado ? (
          // DNI ya registrado: se confirma la identidad en vez de volver a escribir (y pisar) el nombre.
          <Alert
            type="info"
            showIcon
            icon={<UserOutlined />}
            style={{ marginBottom: 24 }}
            title={
              <span>
                Este DNI ya está registrado. ¿Sos <strong>{consultaActual?.nombre_enmascarado}</strong>?
              </span>
            }
            description={
              <Flex gap={8} wrap style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={enviando}
                  onClick={() => void entrar({ dni: consultaActual!.dni })}
                >
                  Sí, soy yo
                </Button>
                <Button onClick={noSoyYo} disabled={enviando}>
                  No, no soy yo
                </Button>
              </Flex>
            }
          />
        ) : (
          <Form.Item
            name="nombre"
            label="Nombre y apellido"
            rules={[
              { required: true, whitespace: true, message: 'Ingresá tu nombre y apellido' },
              {
                // Se cuenta sin espacios al principio y al final, igual que en el backend.
                validator: (_, valor?: string) =>
                  !valor?.trim() || valor.trim().length >= MINIMO_NOMBRE
                    ? Promise.resolve()
                    : Promise.reject(new Error(`Mínimo ${MINIMO_NOMBRE} caracteres`)),
              },
            ]}
          >
            <Input maxLength={100} autoComplete="name" placeholder="Ej.: Ana Pérez" />
          </Form.Item>
        )}

        {aviso && (
          <Typography.Paragraph type="danger" style={{ marginTop: -8 }}>
            {aviso}
          </Typography.Paragraph>
        )}
        {!yaRegistrado && (
          <Button type="primary" htmlType="submit" block loading={enviando || consultando}>
            Ver el menú
          </Button>
        )}
      </Form>
    </Card>
  );
}
