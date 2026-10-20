import { Form, Input, Modal } from 'antd';

interface CancelarPedidoModalProps {
  /** Pedido a cancelar; null cierra el modal. */
  idPedido: number | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}

export function CancelarPedidoModal({ idPedido, loading, onCancel, onConfirm }: CancelarPedidoModalProps) {
  const [form] = Form.useForm<{ motivo: string }>();

  return (
    <Modal
      title={`Cancelar pedido #${idPedido ?? ''}`}
      open={idPedido !== null}
      okText="Cancelar pedido"
      okButtonProps={{ danger: true, loading }}
      cancelText="Volver"
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={({ motivo }) => onConfirm(motivo.trim())} preserve={false}>
        <Form.Item
          name="motivo"
          label="Motivo de la cancelación"
          rules={[{ required: true, whitespace: true, message: 'Indicá el motivo' }]}
        >
          <Input.TextArea maxLength={255} showCount rows={3} placeholder="Ej.: se terminó el producto" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
