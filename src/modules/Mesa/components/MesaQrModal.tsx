import { useRef } from 'react';
import { DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, QRCode, Space, Typography } from 'antd';
import { urlMesa, type Mesa } from '../services/mesa.service';

interface MesaQrModalProps {
  mesa: Mesa | null;
  onClose: () => void;
}

export function MesaQrModal({ mesa, onClose }: MesaQrModalProps) {
  const contenedorQr = useRef<HTMLDivElement>(null);
  const url = mesa ? urlMesa(mesa.hash_codigo_qr) : '';

  const descargar = () => {
    const canvas = contenedorQr.current?.querySelector('canvas');
    if (!canvas || !mesa) return;
    const enlace = document.createElement('a');
    enlace.href = canvas.toDataURL('image/png');
    enlace.download = `kitch-mesa-${mesa.numero_mesa}.png`;
    enlace.click();
  };

  return (
    <Modal title={`QR de la mesa ${mesa?.numero_mesa ?? ''}`} open={!!mesa} onCancel={onClose} footer={null} destroyOnHidden>
      <Flex vertical align="center" gap={16}>
        <div ref={contenedorQr}>
          <QRCode value={url} type="canvas" size={240} bgColor="#ffffff" status={mesa?.activa ? 'active' : 'expired'} />
        </div>
        {!mesa?.activa && (
          <Typography.Text type="warning">La mesa está deshabilitada: el QR no permite hacer pedidos.</Typography.Text>
        )}
        <Typography.Paragraph copyable={{ text: url }} style={{ wordBreak: 'break-all', textAlign: 'center', marginBottom: 0 }}>
          <Typography.Text type="secondary">{url}</Typography.Text>
        </Typography.Paragraph>
        <Space wrap>
          <Button type="primary" icon={<DownloadOutlined />} onClick={descargar}>
            Descargar PNG
          </Button>
          <Button icon={<ExportOutlined />} href={url} target="_blank" rel="noreferrer">
            Abrir vista cliente
          </Button>
        </Space>
      </Flex>
    </Modal>
  );
}
