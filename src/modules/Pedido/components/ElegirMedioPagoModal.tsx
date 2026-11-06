import { useState, type ReactNode } from 'react';
import {
  BankOutlined,
  BookOutlined,
  CreditCardOutlined,
  MobileOutlined,
  SwapOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';
import { formatearMoneda } from '../../../shared/moneda';
import { ETIQUETA_MEDIO_PAGO, medioEnFrase, type MedioPago } from '../services/pedido.service';
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

export interface PedidoACobrar {
  id_pedido: number;
  numero_mesa: number;
  precio_total: string;
}

interface ElegirMedioPagoModalProps {
  /** null: cerrado. */
  pedido: PedidoACobrar | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (medio: MedioPago) => void;
}

/** Registra con qué pagó el cliente (no cobra: es solo para el historial). */
export function ElegirMedioPagoModal({ pedido, loading, onCancel, onConfirm }: ElegirMedioPagoModalProps) {
  const [medio, setMedio] = useState<MedioPago | null>(null);

  return (
    <Modal
      open={pedido !== null}
      title={pedido ? `Cobrar el pedido #${pedido.id_pedido} de la mesa ${pedido.numero_mesa}` : undefined}
      onCancel={onCancel}
      afterClose={() => setMedio(null)}
      footer={[
        <Button key="cancelar" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="confirmar" type="primary" disabled={!medio} loading={loading} onClick={() => medio && onConfirm(medio)}>
          {medio ? `Confirmar pago con ${medioEnFrase(medio)}` : 'Elegí cómo pagó'}
        </Button>,
      ]}
      width={520}
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
            onDoubleClick={() => onConfirm(opcion)}
          >
            <span className="medios-pago__icono">{ICONO_MEDIO[opcion]}</span>
            {ETIQUETA_MEDIO_PAGO[opcion]}
          </button>
        ))}
      </div>
    </Modal>
  );
}
