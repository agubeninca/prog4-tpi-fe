import { useState, type ReactNode } from 'react';
import {
  BankOutlined,
  BookOutlined,
  CreditCardOutlined,
  IdcardOutlined,
  MobileOutlined,
  SwapOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Segmented, Typography } from 'antd';
import { formatearCuit, limpiarCuit } from '../../../shared/cuit';
import { formatearMoneda } from '../../../shared/moneda';
import {
  ETIQUETA_FACTURACION,
  ETIQUETA_MEDIO_PAGO,
  medioEnFrase,
  type DatosCobro,
  type Facturacion,
  type MedioPago,
} from '../services/pedido.service';
import './elegir-medio-pago.css';

const ICONO_MEDIO: Record<MedioPago, ReactNode> = {
  EFECTIVO: <WalletOutlined />,
  DEBITO: <CreditCardOutlined />,
  CREDITO: <BankOutlined />,
  MERCADO_PAGO: <MobileOutlined />,
  TRANSFERENCIA: <SwapOutlined />,
  CUENTA_CORRIENTE: <BookOutlined />,
};

const MEDIOS = Object.keys(ETIQUETA_MEDIO_PAGO) as MedioPago[];

const OPCIONES_FACTURACION = [
  { value: 'CONSUMIDOR_FINAL' as const, label: ETIQUETA_FACTURACION.CONSUMIDOR_FINAL, icon: <UserOutlined /> },
  { value: 'CUENTA' as const, label: `${ETIQUETA_FACTURACION.CUENTA} (nombre / CUIT)`, icon: <IdcardOutlined /> },
];

const MAX_NOMBRE_CUENTA = 150;

export interface PedidoACobrar {
  id_pedido: number;
  numero_mesa: number;
  precio_total: string;
  /** Se propone como nombre de la cuenta (se puede cambiar). */
  nombre_cliente?: string;
  /** Si ya está pagado: datos actuales del cobro, para corregirlos. */
  cobro?: {
    medio_pago?: MedioPago | null;
    facturacion?: Facturacion | null;
    cuenta_nombre?: string | null;
    cuenta_cuit?: string | null;
  };
}

interface ElegirMedioPagoModalProps {
  /** null: cerrado. */
  pedido: PedidoACobrar | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (cobro: DatosCobro) => void;
}

/**
 * Registra con qué pagó el cliente y a quién se le cobró: consumidor final o una cuenta
 * (nombre / razón social y CUIT opcional). No cobra: es solo para el historial.
 */
export function ElegirMedioPagoModal({ pedido, loading, onCancel, onConfirm }: ElegirMedioPagoModalProps) {
  const [abiertoPara, setAbiertoPara] = useState<number | null>(null);
  const [medio, setMedio] = useState<MedioPago | null>(null);
  const [facturacion, setFacturacion] = useState<Facturacion>('CONSUMIDOR_FINAL');
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [cuit, setCuit] = useState('');
  const [intentoConfirmar, setIntentoConfirmar] = useState(false);

  // Al abrir el modal para un pedido, el formulario arranca con sus datos actuales.
  if (pedido && pedido.id_pedido !== abiertoPara) {
    setAbiertoPara(pedido.id_pedido);
    setMedio(pedido.cobro?.medio_pago ?? null);
    setFacturacion(pedido.cobro?.facturacion ?? 'CONSUMIDOR_FINAL');
    setNombreCuenta(pedido.cobro?.cuenta_nombre ?? '');
    setCuit(pedido.cobro?.cuenta_cuit ? formatearCuit(pedido.cobro.cuenta_cuit) : '');
    setIntentoConfirmar(false);
  }

  const corrigiendo = !!pedido?.cobro?.medio_pago;
  const esCuenta = facturacion === 'CUENTA';
  const digitosCuit = limpiarCuit(cuit);
  const errorNombre = esCuenta && !nombreCuenta.trim() ? 'Indicá el nombre o la razón social' : null;
  const errorCuit = esCuenta && digitosCuit.length > 0 && digitosCuit.length !== 11 ? 'El CUIT tiene 11 dígitos' : null;

  const elegirFacturacion = (valor: Facturacion) => {
    setFacturacion(valor);
    // La cuenta suele ser el mismo cliente: se propone su nombre y se corrige si hace falta.
    if (valor === 'CUENTA' && !nombreCuenta.trim() && pedido?.nombre_cliente) {
      setNombreCuenta(pedido.nombre_cliente);
    }
  };

  const confirmar = (medioElegido = medio) => {
    setIntentoConfirmar(true);
    if (!medioElegido || errorNombre || errorCuit) {
      return;
    }
    onConfirm({
      medio_pago: medioElegido,
      facturacion,
      ...(esCuenta && {
        cuenta_nombre: nombreCuenta.trim(),
        ...(digitosCuit && { cuenta_cuit: digitosCuit }),
      }),
    });
  };

  const textoConfirmar = !medio
    ? 'Elegí cómo pagó'
    : corrigiendo
      ? 'Guardar cambios'
      : `Confirmar pago con ${medioEnFrase(medio)}`;

  return (
    <Modal
      open={pedido !== null}
      title={
        pedido
          ? `${corrigiendo ? 'Corregir el cobro' : 'Cobrar el pedido'} #${pedido.id_pedido} de la mesa ${pedido.numero_mesa}`
          : undefined
      }
      onCancel={onCancel}
      afterClose={() => setAbiertoPara(null)}
      footer={[
        <Button key="cancelar" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="confirmar" type="primary" disabled={!medio} loading={loading} onClick={() => confirmar()}>
          {textoConfirmar}
        </Button>,
      ]}
      width={560}
      destroyOnHidden
    >
      {pedido && (
        <Typography.Paragraph style={{ marginBottom: 16 }}>
          Total a cobrar: <strong style={{ fontSize: 18 }}>{formatearMoneda(pedido.precio_total)}</strong>
        </Typography.Paragraph>
      )}

      <div className="medios-pago" role="radiogroup" aria-label="Medio de pago">
        {MEDIOS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={medio === opcion}
            className={`medios-pago__opcion${medio === opcion ? ' medios-pago__opcion--elegida' : ''}`}
            onClick={() => setMedio(opcion)}
            onDoubleClick={() => confirmar(opcion)}
          >
            <span className="medios-pago__icono">{ICONO_MEDIO[opcion]}</span>
            {ETIQUETA_MEDIO_PAGO[opcion]}
          </button>
        ))}
      </div>

      <div className="cobro-facturacion">
        <Typography.Text strong>¿A quién se le cobra?</Typography.Text>
        <Segmented<Facturacion>
          block
          value={facturacion}
          options={OPCIONES_FACTURACION}
          onChange={elegirFacturacion}
          aria-label="Consumidor final o cuenta"
        />

        {esCuenta && (
          <Form layout="vertical" component="div" className="cobro-facturacion__cuenta">
            <Form.Item
              label="Nombre o razón social"
              required
              validateStatus={intentoConfirmar && errorNombre ? 'error' : undefined}
              help={intentoConfirmar ? errorNombre : undefined}
            >
              <Input
                value={nombreCuenta}
                maxLength={MAX_NOMBRE_CUENTA}
                placeholder="Ej.: Juan Pérez o Acme SRL"
                onChange={(evento) => setNombreCuenta(evento.target.value)}
                onPressEnter={() => confirmar()}
                autoFocus
              />
            </Form.Item>
            <Form.Item
              label="CUIT (opcional)"
              validateStatus={intentoConfirmar && errorCuit ? 'error' : undefined}
              help={intentoConfirmar ? errorCuit : undefined}
            >
              <Input
                value={cuit}
                inputMode="numeric"
                placeholder="20-12345678-9"
                onChange={(evento) => setCuit(formatearCuit(evento.target.value))}
                onPressEnter={() => confirmar()}
              />
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
}
