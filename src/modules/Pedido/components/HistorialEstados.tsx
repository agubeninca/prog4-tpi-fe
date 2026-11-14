import { useEffect, useState } from 'react';
import { Skeleton, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '../../../shared/api';
import { COLOR_ESTADO, ETIQUETA_ESTADO, pedidoService, type CambioEstado } from '../services/pedido.service';

/** Línea de tiempo de un pedido: quién y cuándo cambió cada estado (incluye los "volver atrás"). */
export function HistorialEstados({ idPedido }: { idPedido: number }) {
  const [datos, setDatos] = useState<{ id: number; cambios?: CambioEstado[]; error?: string } | null>(null);

  useEffect(() => {
    let vigente = true;
    pedidoService
      .getHistorial(idPedido)
      .then((cambios) => vigente && setDatos({ id: idPedido, cambios }))
      .catch((error: unknown) => vigente && setDatos({ id: idPedido, error: getErrorMessage(error) }));
    return () => {
      vigente = false;
    };
  }, [idPedido]);

  if (datos?.id !== idPedido) {
    return <Skeleton active paragraph={{ rows: 2 }} title={false} />;
  }
  if (datos.error) {
    return <Typography.Text type="danger">{datos.error}</Typography.Text>;
  }

  return (
    <Timeline
      items={(datos.cambios ?? []).map((cambio) => {
        const retrocede = cambio.estado_anterior === 'EN_PREPARACION' && cambio.estado_nuevo === 'PENDIENTE';
        return {
          color: COLOR_ESTADO[cambio.estado_nuevo],
          content: (
            <div>
              <strong>
                {cambio.estado_anterior === null
                  ? `Ingresó como ${ETIQUETA_ESTADO[cambio.estado_nuevo]}`
                  : retrocede
                    ? 'Volvió a Pendiente'
                    : `Pasó a ${ETIQUETA_ESTADO[cambio.estado_nuevo]}`}
              </strong>
              <div>
                <Typography.Text type="secondary">
                  {dayjs(cambio.fecha_hora).format('DD/MM/YYYY HH:mm:ss')} ·{' '}
                  {cambio.usuario ? cambio.usuario.nombre : 'el cliente (QR)'}
                </Typography.Text>
              </div>
              {cambio.motivo && <Typography.Text type="danger">Motivo: {cambio.motivo}</Typography.Text>}
            </div>
          ),
        };
      })}
    />
  );
}
