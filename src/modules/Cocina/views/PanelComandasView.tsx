import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Col, Empty, Flex, Row, Spin, Typography, message, notification } from 'antd';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getErrorMessage } from '../../../shared/api';
import { db } from '../../../shared/firebase';
import { CancelarPedidoModal } from '../../Pedido/components/CancelarPedidoModal';
import { pedidoService, type EstadoPedido } from '../../Pedido/services/pedido.service';
import { ComandaCard } from '../components/ComandaCard';
import { aComanda, COLECCION_COMANDAS, type Comanda } from '../comanda';

const INTERVALO_RELOJ_MS = 30_000;

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'SERVIDO',
};

export function PanelComandasView() {
  const [comandas, setComandas] = useState<Comanda[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [procesando, setProcesando] = useState<number | null>(null);
  const [aCancelar, setACancelar] = useState<number | null>(null);
  const primeraCarga = useRef(true);

  // RF-05: el backend espeja cada pedido en Firestore; acá se escucha en tiempo real.
  useEffect(() => {
    const consulta = query(
      collection(db, COLECCION_COMANDAS),
      where('estado', 'in', ['PENDIENTE', 'EN_PREPARACION']),
      orderBy('fecha_hora_ingreso'),
    );
    const desuscribir = onSnapshot(
      consulta,
      (snapshot) => {
        if (!primeraCarga.current) {
          snapshot
            .docChanges()
            .filter((cambio) => cambio.type === 'added' && cambio.doc.data().estado === 'PENDIENTE')
            .forEach((cambio) => {
              const nueva = aComanda(cambio.doc);
              notification.info({
                title: `Nuevo pedido · Mesa ${nueva.numero_mesa}`,
                description: nueva.items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', '),
                placement: 'bottomRight',
              });
            });
        }
        primeraCarga.current = false;
        setComandas(snapshot.docs.map(aComanda));
        setError(null);
      },
      (err) => setError(err.message),
    );
    return desuscribir;
  }, []);

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), INTERVALO_RELOJ_MS);
    return () => clearInterval(reloj);
  }, []);

  // RF-06: las transiciones las valida el backend; Firestore trae el cambio solo.
  const cambiarEstado = async (idPedido: number, estado: EstadoPedido, motivo?: string) => {
    setProcesando(idPedido);
    try {
      await pedidoService.cambiarEstado(idPedido, estado, motivo);
      if (estado === 'CANCELADO') {
        message.success(`Pedido #${idPedido} cancelado`);
        setACancelar(null);
      }
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setProcesando(null);
    }
  };

  if (error) {
    return <Alert type="error" showIcon title="No se pudo conectar con el panel en tiempo real" description={error} />;
  }

  if (!comandas) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const columnas: { estado: EstadoPedido; titulo: string; color: string }[] = [
    { estado: 'PENDIENTE', titulo: 'Pendientes', color: 'gold' },
    { estado: 'EN_PREPARACION', titulo: 'En preparación', color: 'blue' },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {columnas.map((columna) => {
          const delEstado = comandas.filter((comanda) => comanda.estado === columna.estado);
          return (
            <Col key={columna.estado} xs={24} lg={12}>
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {columna.titulo}
                </Typography.Title>
                <Badge count={delEstado.length} color={columna.color} showZero />
              </Flex>
              {delEstado.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin comandas" />
              ) : (
                <Flex vertical gap={16}>
                  {delEstado.map((comanda) => (
                    <ComandaCard
                      key={comanda.id_pedido}
                      comanda={comanda}
                      ahora={ahora}
                      procesando={procesando === comanda.id_pedido}
                      onAvanzar={() => cambiarEstado(comanda.id_pedido, SIGUIENTE_ESTADO[comanda.estado]!)}
                      onCancelar={() => setACancelar(comanda.id_pedido)}
                    />
                  ))}
                </Flex>
              )}
            </Col>
          );
        })}
      </Row>
      <CancelarPedidoModal
        idPedido={aCancelar}
        loading={procesando === aCancelar}
        onCancel={() => setACancelar(null)}
        onConfirm={(motivo) => aCancelar !== null && cambiarEstado(aCancelar, 'CANCELADO', motivo)}
      />
    </>
  );
}
