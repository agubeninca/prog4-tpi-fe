import { useState } from 'react';
import { Alert, Descriptions, Form, Input, InputNumber, Modal, Typography, message } from 'antd';
import Decimal from 'decimal.js';
import { getErrorMessage } from '../../../shared/api';
import { formatearMoneda } from '../../../shared/moneda';
import { ETIQUETA_TURNO, turnoService, type Turno, type TurnoActual } from '../services/turno.service';
import { DiferenciaCaja } from './DiferenciaCaja';

interface CerrarTurnoModalProps {
  turno: TurnoActual;
  open: boolean;
  onClose: () => void;
  onCerrado: (turno: Turno) => void;
}

/** Arqueo: se cuenta la plata de la caja y se compara con lo esperado (inicial + cobrado en efectivo). */
export function CerrarTurnoModal({ turno, open, onClose, onCerrado }: CerrarTurnoModalProps) {
  const [form] = Form.useForm<{ efectivo_contado: number; observacion?: string }>();
  const contado = Form.useWatch('efectivo_contado', form);
  const [guardando, setGuardando] = useState(false);

  const esperado = new Decimal(turno.efectivo_esperado);
  const diferencia = typeof contado === 'number' ? new Decimal(contado).minus(esperado) : null;
  const pendientes = turno.resumen.sin_cobrar.cantidad + turno.resumen.en_curso.cantidad;

  const cerrar = async ({ efectivo_contado, observacion }: { efectivo_contado: number; observacion?: string }) => {
    setGuardando(true);
    try {
      const cerrado = await turnoService.cerrar({ efectivo_contado, observacion: observacion?.trim() || undefined });
      message.success(`Turno ${ETIQUETA_TURNO[cerrado.nombre].toLowerCase()} cerrado`);
      onCerrado(cerrado);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Cerrar turno ${ETIQUETA_TURNO[turno.nombre].toLowerCase()}`}
      okText="Cerrar turno"
      okButtonProps={{ loading: guardando, danger: true }}
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Descriptions
        size="small"
        column={1}
        bordered
        style={{ marginBottom: 16 }}
        items={[
          { label: 'Efectivo inicial', children: formatearMoneda(turno.efectivo_inicial) },
          { label: '+ Cobrado en efectivo', children: formatearMoneda(turno.resumen.cobrado.efectivo_en_caja) },
          {
            label: <strong>= Tiene que haber en la caja</strong>,
            children: <strong>{formatearMoneda(turno.efectivo_esperado)}</strong>,
          },
        ]}
      />

      {pendientes > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Quedan ${pendientes} ${pendientes === 1 ? 'pedido' : 'pedidos'} sin cobrar: se cobran en el próximo turno.`}
        />
      )}

      <Form form={form} layout="vertical" requiredMark={false} onFinish={cerrar}>
        <Form.Item
          name="efectivo_contado"
          label="Efectivo contado en la caja"
          rules={[{ required: true, message: 'Contá la plata e ingresá el total' }]}
          extra={
            diferencia && (
              <span>
                Diferencia: <DiferenciaCaja diferencia={diferencia.toString()} />
              </span>
            )
          }
        >
          <InputNumber prefix="$" min={0} max={99999999.99} precision={2} decimalSeparator="," style={{ width: '100%' }} autoFocus />
        </Form.Item>
        <Form.Item
          name="observacion"
          label="Observación"
          dependencies={['efectivo_contado']}
          rules={[
            {
              validator: (_, valor?: string) =>
                diferencia && !diferencia.isZero() && !valor?.trim()
                  ? Promise.reject(new Error('Si sobra o falta plata, explicá el motivo'))
                  : Promise.resolve(),
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea maxLength={255} showCount rows={2} placeholder="Ej.: faltan $500 de un vuelto mal dado" />
        </Form.Item>
      </Form>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        Al cerrar, el resumen del turno queda guardado tal como está y ya no se pueden modificar sus cobros.
      </Typography.Paragraph>
    </Modal>
  );
}
