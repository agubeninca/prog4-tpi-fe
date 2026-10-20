import { useState } from 'react';
import { Button, Form, Input, Rate, message } from 'antd';
import { getErrorMessage } from '../../../shared/api';
import { clienteMesaService } from '../services/clienteMesa.service';

interface ReviewFormProps {
  idPedido: number;
  dni: string;
  onCreada: () => void;
}

interface ReviewInput {
  puntuacion: number;
  comentario?: string;
}

const DESCRIPCIONES = ['Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

export function ReviewForm({ idPedido, dni, onCreada }: ReviewFormProps) {
  const [form] = Form.useForm<ReviewInput>();
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async ({ puntuacion, comentario }: ReviewInput) => {
    setEnviando(true);
    try {
      await clienteMesaService.crearReview(idPedido, { dni, puntuacion, comentario: comentario?.trim() || undefined });
      message.success('¡Gracias por tu opinión!');
      form.resetFields();
      onCreada();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
      <Form.Item name="puntuacion" label="¿Qué te pareció?" rules={[{ required: true, message: 'Elegí una puntuación' }]}>
        <Rate tooltips={DESCRIPCIONES} style={{ fontSize: 32 }} />
      </Form.Item>
      <Form.Item name="comentario" label="Comentario (opcional)">
        <Input.TextArea maxLength={500} showCount rows={3} placeholder="Contanos tu experiencia" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={enviando}>
        Enviar review
      </Button>
    </Form>
  );
}
