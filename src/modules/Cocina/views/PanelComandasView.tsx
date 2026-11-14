import { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Alert, Button, Spin, message, notification } from 'antd';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getErrorMessage } from '../../../shared/api';
import { db } from '../../../shared/firebase';
import { useAuthStore } from '../../../stores/auth.store';
import { puedeGestionarComandas } from '../../Auth/services/auth.service';
import { CancelarPedidoModal } from '../../Pedido/components/CancelarPedidoModal';
import { ElegirMedioPagoModal } from '../../Pedido/components/ElegirMedioPagoModal';
import { medioEnFrase, pedidoService, type DatosCobro, type EstadoPago, type EstadoPedido } from '../../Pedido/services/pedido.service';
import { describirCuenta } from '../../../shared/cuit';
import { CargarComandaModal } from '../components/CargarComandaModal';
import { ComandaCard } from '../components/ComandaCard';
import { aComanda, COLECCION_COMANDAS, type Comanda } from '../comanda';
import '../panel-comandas.css';

const INTERVALO_RELOJ_MS = 30_000;
/** Cuánto dura el resalte de una comanda recién llegada. */
const DURACION_RESALTE_MS = 2_500;

/** El pedido ya no existe en la base: el backend quitó su comanda del panel. */
function esPedidoInexistente(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'SERVIDO',
};

interface Columna {
  estado: EstadoPedido;
  titulo: string;
  ayuda: string;
  vacio: string;
  clase: string;
}

// Barra ve todo lo activo; Cocina solo lo que tiene que preparar (lo que la barra ya tomó).
const COLUMNAS_BARRA: Columna[] = [
  {
    estado: 'PENDIENTE',
    titulo: 'Pendientes',
    ayuda: 'Esperan que la barra los tome',
    vacio: 'No hay pedidos esperando. Los nuevos aparecen acá solos.',
    clase: 'carril--pendiente',
  },
  {
    estado: 'EN_PREPARACION',
    titulo: 'En preparación',
    ayuda: 'Tomados; marcalos como servidos al entregarlos',
    vacio: 'No hay pedidos en preparación.',
    clase: 'carril--preparacion',
  },
  {
    estado: 'SERVIDO',
    titulo: 'Pendientes de pago',
    ayuda: 'Ya servidos; marcalos como pagados al cobrar',
    vacio: 'No hay pedidos por cobrar.',
    clase: 'carril--cobro',
  },
];
const COLUMNAS_COCINA: Columna[] = [
  {
    estado: 'EN_PREPARACION',
    titulo: 'Para preparar',
    ayuda: 'Del más viejo (arriba) al más nuevo (abajo). Aparecen cuando la barra los toma.',
    vacio: 'No hay pedidos para preparar.',
    clase: 'carril--preparacion',
  },
];

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
  /** Servidos que todavía no se cobraron (solo los ve la Barra). */
  const [porCobrar, setPorCobrar] = useState<Comanda[]>([]);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);
  /** Comanda que se está cobrando: se elige el medio de pago antes de marcarla pagada. */
  const [aCobrar, setACobrar] = useState<Comanda | null>(null);
  const [aCancelar, setACancelar] = useState<number | null>(null);
  const [cargandoManual, setCargandoManual] = useState(false);
  /** Comandas recién llegadas a la columna (se resaltan un momento). */
  const [recientes, setRecientes] = useState<Set<number>>(() => new Set());
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
          if (nuevas.length > 0) {
            const ids = nuevas.map((nueva) => nueva.id_pedido);
            setRecientes((actuales) => new Set([...actuales, ...ids]));
            setTimeout(
              () => setRecientes((actuales) => new Set([...actuales].filter((id) => !ids.includes(id)))),
              DURACION_RESALTE_MS,
            );
          }
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

  // Columna "Pendientes de pago": servidos que siguen sin cobrarse.
  useEffect(() => {
    if (soloLectura) return;
    const consulta = query(
      collection(db, COLECCION_COMANDAS),
      where('estado', '==', 'SERVIDO'),
      where('pagado', '==', 'PENDIENTE'),
      orderBy('fecha_hora_ingreso'),
    );
    return onSnapshot(
      consulta,
      (snapshot) => setPorCobrar(snapshot.docs.map(aComanda).sort(masViejoPrimero)),
      (err) => setError(err.message),
    );
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
      } else if (estado === 'PENDIENTE') {
        message.success(`Pedido #${idPedido} volvió a Pendiente`);
      }
    } catch (err) {
      message.error(getErrorMessage(err));
      if (esPedidoInexistente(err)) {
        setACancelar(null);
      }
    } finally {
      setProcesando(null);
    }
  };

  // El pago lo cambia la barra en cualquier momento (hay quien paga por adelantado).
  // Para marcarlo pagado primero se elige el medio de pago (queda como registro).
  const pedirCambioPago = (comanda: Comanda, pagado: EstadoPago) => {
    if (pagado === 'PAGADO') {
      setACobrar(comanda);
    } else {
      void cambiarPago(comanda, 'PENDIENTE');
    }
  };

  const cambiarPago = async (comanda: Comanda, pagado: EstadoPago, cobro?: DatosCobro) => {
    setProcesandoPago(comanda.id_pedido);
    try {
      await pedidoService.cambiarPago(comanda.id_pedido, pagado, cobro);
      message.success(
        cobro
          ? `Mesa ${comanda.numero_mesa}: pagó con ${medioEnFrase(cobro.medio_pago)}${
              cobro.facturacion === 'CUENTA' ? ` (${describirCuenta(cobro.cuenta_nombre, cobro.cuenta_cuit)})` : ''
            }`
          : `Mesa ${comanda.numero_mesa}: pendiente de pago`,
      );
      setACobrar(null);
    } catch (err) {
      message.error(getErrorMessage(err));
      if (esPedidoInexistente(err)) {
        setACobrar(null);
      }
    } finally {
      setProcesandoPago(null);
    }
  };

  if (error) {
    return (
      <div className="panel-comandas">
        <Alert type="error" showIcon title="No se pudo conectar con el panel en tiempo real" description={error} />
      </div>
    );
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
    <div className="panel-comandas">
      <div className="panel-comandas__barra">
        <h1 className="panel-comandas__titulo">
          {soloLectura ? 'Pedidos para preparar' : 'Comandas activas'}
          <span className="panel-comandas__en-vivo">En vivo</span>
        </h1>
        {!soloLectura && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="panel-comandas__cargar"
            onClick={() => setCargandoManual(true)}
          >
            Cargar comanda
          </Button>
        )}
      </div>

      <div
        className={`panel-comandas__carriles${columnas.length === 1 ? ' panel-comandas__carriles--uno' : ''}${columnas.length === 3 ? ' panel-comandas__carriles--tres' : ''}`}
      >
        {columnas.map((columna) => {
          const delEstado =
            columna.estado === 'SERVIDO' ? porCobrar : comandas.filter((comanda) => comanda.estado === columna.estado);
          return (
            <section key={columna.estado} className={`carril ${columna.clase}`} aria-label={columna.titulo}>
              <header className="carril__cabecera">
                <span className="carril__contador" aria-label={`${delEstado.length} pedidos`}>
                  {delEstado.length}
                </span>
                <div>
                  <h2 className="carril__titulo">{columna.titulo}</h2>
                  <p className="carril__ayuda">{columna.ayuda}</p>
                </div>
              </header>
              {delEstado.length === 0 ? (
                <div className="carril__vacio">{columna.vacio}</div>
              ) : (
                <div className="carril__lista">
                  {delEstado.map((comanda) => (
                    <ComandaCard
                      key={comanda.id_pedido}
                      comanda={comanda}
                      ahora={ahora}
                      procesando={procesando === comanda.id_pedido}
                      procesandoPago={procesandoPago === comanda.id_pedido}
                      soloLectura={soloLectura}
                      nueva={recientes.has(comanda.id_pedido)}
                      onAvanzar={() => cambiarEstado(comanda.id_pedido, SIGUIENTE_ESTADO[comanda.estado]!)}
                      onCancelar={() => setACancelar(comanda.id_pedido)}
                      onRetroceder={() => cambiarEstado(comanda.id_pedido, 'PENDIENTE')}
                      onCambiarPago={(pagado) => pedirCambioPago(comanda, pagado)}
                      onCorregirCobro={() => setACobrar(comanda)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* La comanda nueva aparece sola en "Pendientes" vía Firestore. */}
      {cargandoManual && <CargarComandaModal onClose={() => setCargandoManual(false)} />}
      {!soloLectura && (
        <ElegirMedioPagoModal
          pedido={
            aCobrar && {
              id_pedido: aCobrar.id_pedido,
              numero_mesa: aCobrar.numero_mesa,
              precio_total: aCobrar.precio_total,
              nombre_cliente: aCobrar.cliente.nombre,
              cobro: aCobrar.pagado === 'PAGADO' ? aCobrar : undefined,
            }
          }
          loading={aCobrar !== null && procesandoPago === aCobrar.id_pedido}
          onCancel={() => setACobrar(null)}
          onConfirm={(cobro) => aCobrar && cambiarPago(aCobrar, 'PAGADO', cobro)}
        />
      )}
      {!soloLectura && (
        <CancelarPedidoModal
          idPedido={aCancelar}
          loading={procesando === aCancelar}
          onCancel={() => setACancelar(null)}
          onConfirm={(motivo) => aCancelar !== null && cambiarEstado(aCancelar, 'CANCELADO', motivo)}
        />
      )}
    </div>
  );
}
