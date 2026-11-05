import { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Col, Empty, Flex, Row, Spin, Typography, message, notification } from 'antd';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getErrorMessage } from '../../../shared/api';
import { db } from '../../../shared/firebase';
import { useAuthStore } from '../../../stores/auth.store';
import { puedeGestionarComandas } from '../../Auth/services/auth.service';
import { CancelarPedidoModal } from '../../Pedido/components/CancelarPedidoModal';
import { pedidoService, type EstadoPedido } from '../../Pedido/services/pedido.service';
import { CargarComandaModal } from '../components/CargarComandaModal';
import { ComandaCard } from '../components/ComandaCard';
import { aComanda, COLECCION_COMANDAS, type Comanda } from '../comanda';

const INTERVALO_RELOJ_MS = 30_000;

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'SERVIDO',
};

interface Columna {
  estado: EstadoPedido;
  titulo: string;
  color: string;
}

// Barra ve todo lo activo; Cocina solo lo que tiene que preparar (lo que la barra ya tomó).
const COLUMNAS_BARRA: Columna[] = [
  { estado: 'PENDIENTE', titulo: 'Pendientes', color: 'gold' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', color: 'blue' },
];
const COLUMNAS_COCINA: Columna[] = [{ estado: 'EN_PREPARACION', titulo: 'Para preparar', color: 'blue' }];

/** Del más viejo (arriba) al más nuevo (abajo): lo que llegó primero se prepara primero. */
function masViejoPrimero(a: Comanda, b: Comanda) {
  return a.fecha_hora_ingreso.getTime() - b.fecha_hora_ingreso.getTime() || a.id_pedido - b.id_pedido;
}

export function PanelComandasView() {
  // Cocina solo visualiza las comandas; los cambios de estado los hace la Barra (o el admin).
  const soloLectura = !puedeGestionarComandas(useAuthStore((state) => state.usuario?.rol));
  const [comandas, setComandas] = useState<Comanda[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [procesando, setProcesando] = useState<number | null>(null);
  const [aCancelar, setACancelar] = useState<number | null>(null);
  const [cargandoManual, setCargandoManual] = useState(false);
  const primeraCarga = useRef(true);
  /** Pedidos que ya estaban en preparación en el snapshot anterior (para avisarle a Cocina de los nuevos). */
  const enPreparacionAntes = useRef<Set<number>>(new Set());

  // RF-05: el backend espeja cada pedido en Firestore; acá se escucha en tiempo real.
  useEffect(() => {
    primeraCarga.current = true;
    const consulta = query(
      collection(db, COLECCION_COMANDAS),
      where('estado', 'in', ['PENDIENTE', 'EN_PREPARACION']),
      orderBy('fecha_hora_ingreso'),
    );
    const desuscribir = onSnapshot(
      consulta,
      (snapshot) => {
        const actuales = snapshot.docs.map(aComanda).sort(masViejoPrimero);
        const enPreparacion = actuales.filter((comanda) => comanda.estado === 'EN_PREPARACION');

        if (!primeraCarga.current) {
          // Barra: avisa de cada pedido nuevo. Cocina: avisa cuando la barra toma uno y hay que prepararlo.
          const nuevas = soloLectura
            ? enPreparacion.filter((comanda) => !enPreparacionAntes.current.has(comanda.id_pedido))
            : snapshot
                .docChanges()
                .filter((cambio) => cambio.type === 'added' && cambio.doc.data().estado === 'PENDIENTE')
                .map((cambio) => aComanda(cambio.doc));
          nuevas.forEach((nueva) =>
            notification.info({
              title: `${soloLectura ? 'Para preparar' : 'Nuevo pedido'} · Mesa ${nueva.numero_mesa}`,
              description: nueva.items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', '),
              placement: 'bottomRight',
            }),
          );
        }
        primeraCarga.current = false;
        enPreparacionAntes.current = new Set(enPreparacion.map((comanda) => comanda.id_pedido));
        setComandas(actuales);
        setError(null);
      },
      (err) => setError(err.message),
    );
    return desuscribir;
  }, [soloLectura]);

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

  const columnas = soloLectura ? COLUMNAS_COCINA : COLUMNAS_BARRA;

  return (
    <>
      {!soloLectura && (
        <Flex justify="flex-end" style={{ marginBottom: 16 }}>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCargandoManual(true)}>
            Cargar comanda
          </Button>
        </Flex>
      )}
      {soloLectura && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Pedidos para preparar, del más viejo (arriba) al más nuevo (abajo). Aparecen cuando la barra los toma y se van solos cuando se sirven o se cancelan."
        />
      )}
      <Row gutter={[24, 24]}>
        {columnas.map((columna) => {
          const delEstado = comandas.filter((comanda) => comanda.estado === columna.estado);
          return (
            <Col key={columna.estado} xs={24} lg={soloLectura ? 24 : 12} style={soloLectura ? { maxWidth: 760, marginInline: 'auto' } : undefined}>
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {columna.titulo}
                </Typography.Title>
                <Badge count={delEstado.length} color={columna.color} showZero />
              </Flex>
              {delEstado.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={soloLectura ? 'No hay pedidos para preparar' : 'Sin comandas'} />
              ) : (
                <Flex vertical gap={16}>
                  {delEstado.map((comanda) => (
                    <ComandaCard
                      key={comanda.id_pedido}
                      comanda={comanda}
                      ahora={ahora}
                      procesando={procesando === comanda.id_pedido}
                      soloLectura={soloLectura}
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
      {/* La comanda nueva aparece sola en "Pendientes" vía Firestore. */}
      {cargandoManual && <CargarComandaModal onClose={() => setCargandoManual(false)} />}
      {!soloLectura && (
        <CancelarPedidoModal
          idPedido={aCancelar}
          loading={procesando === aCancelar}
          onCancel={() => setACancelar(null)}
          onConfirm={(motivo) => aCancelar !== null && cambiarEstado(aCancelar, 'CANCELADO', motivo)}
        />
      )}
    </>
  );
}
