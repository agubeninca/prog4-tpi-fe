import { CheckOutlined, ClockCircleOutlined, CloseOutlined, DollarOutlined, FireOutlined } from '@ant-design/icons';
import { Button, Segmented } from 'antd';
import dayjs from 'dayjs';
import { formatearMoneda } from '../../../shared/moneda';
import { medioEnFrase, type EstadoPago } from '../../Pedido/services/pedido.service';
import type { Comanda } from '../comanda';

interface ComandaCardProps {
  comanda: Comanda;
  /** Momento de referencia para el tiempo transcurrido (se actualiza periódicamente). */
  ahora: Date;
  /** Se está cambiando el estado del pedido. */
  procesando: boolean;
  /** Se está cambiando el estado de pago. "PAGADO" abre la elección del medio de pago. */
  procesandoPago?: boolean;
  /** Cocina solo visualiza: sin botones ni datos de pago. */
  soloLectura?: boolean;
  /** Recién llegada: se resalta un momento. */
  nueva?: boolean;
  onAvanzar: () => void;
  onCancelar: () => void;
  onCambiarPago?: (pagado: EstadoPago) => void;
}

/** Más de 15 minutos sin servirse: se resalta. */
const MINUTOS_DEMORA = 15;

const OPCIONES_PAGO: { label: string; value: EstadoPago }[] = [
  { label: 'Pendiente de pago', value: 'PENDIENTE' },
  { label: 'Pagado', value: 'PAGADO' },
];

/** "Recién", "8 min", "1 h 5 min". */
function tiempoTranscurrido(minutos: number) {
  if (minutos < 1) return 'Recién';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

export function ComandaCard({
  comanda,
  ahora,
  procesando,
  procesandoPago,
  soloLectura,
  nueva,
  onAvanzar,
  onCancelar,
  onCambiarPago,
}: ComandaCardProps) {
  const ingreso = dayjs(comanda.fecha_hora_ingreso);
  const minutos = Math.max(0, dayjs(ahora).diff(ingreso, 'minute'));
  const pendiente = comanda.estado === 'PENDIENTE';
  // Ya servida, falta cobrarla: no cuenta como demora de preparación.
  const porCobrar = comanda.estado === 'SERVIDO';
  const demorada = !porCobrar && minutos >= MINUTOS_DEMORA;
  const pagado = comanda.pagado ?? 'PENDIENTE';

  const clases = ['comanda', demorada && 'comanda--demorada', nueva && 'comanda--nueva'].filter(Boolean).join(' ');

  return (
    <article className={clases} aria-label={`Mesa ${comanda.numero_mesa}, pedido ${comanda.id_pedido}`}>
      <div className="comanda__mesa">
        <span className="comanda__mesa-etiqueta">Mesa</span>
        <span className="comanda__mesa-numero">{comanda.numero_mesa}</span>
      </div>

      <div className="comanda__cuerpo">
        <div className="comanda__cabecera">
          <div style={{ minWidth: 0 }}>
            <div className="comanda__cliente" title={comanda.cliente.nombre}>
              {comanda.cliente.nombre}
            </div>
            <div className="comanda__datos">
              <span>Pedido #{comanda.id_pedido}</span>
              <span>Entró {ingreso.format('HH:mm')}</span>
              {comanda.origen === 'MANUAL' && <span className="comanda__manual">Carga manual</span>}
            </div>
          </div>
          <span className="comanda__reloj" title={demorada ? `Lleva más de ${MINUTOS_DEMORA} minutos` : 'Tiempo desde que entró'}>
            <ClockCircleOutlined />
            {tiempoTranscurrido(minutos)}
          </span>
        </div>

        <ul className="comanda__items">
          {comanda.items.map((item) => (
            <li key={item.nombre} className="comanda__item">
              <span className="comanda__cantidad">{item.cantidad}</span>
              <span>{item.nombre}</span>
            </li>
          ))}
        </ul>

        {!soloLectura && (
          <div className="comanda__pago">
            <span className="comanda__total">
              <span className="comanda__total-etiqueta">{porCobrar ? 'A cobrar' : 'Total'}</span>
              {formatearMoneda(comanda.precio_total)}
            </span>
            {!porCobrar && onCambiarPago && (
              <Segmented
                size="small"
                className={`comanda__selector-pago comanda__selector-pago--${pagado === 'PAGADO' ? 'pagado' : 'pendiente'}`}
                value={pagado}
                options={OPCIONES_PAGO}
                disabled={procesandoPago}
                onChange={(valor) => onCambiarPago(valor)}
                aria-label="Estado de pago"
              />
            )}
            {pagado === 'PAGADO' && comanda.medio_pago && (
              <span className="comanda__medio">Pagó con {medioEnFrase(comanda.medio_pago)}</span>
            )}
          </div>
        )}

        {!soloLectura &&
          (porCobrar ? (
            <div className="comanda__acciones">
              <Button
                className="comanda__accion comanda__accion--cobrar"
                icon={<DollarOutlined />}
                loading={procesandoPago}
                onClick={() => onCambiarPago?.('PAGADO')}
              >
                Marcar pagado
              </Button>
            </div>
          ) : (
            <div className="comanda__acciones">
              <Button
                className={`comanda__accion ${pendiente ? 'comanda__accion--tomar' : 'comanda__accion--servido'}`}
                icon={pendiente ? <FireOutlined /> : <CheckOutlined />}
                loading={procesando}
                onClick={onAvanzar}
              >
                {pendiente ? 'Tomar pedido' : 'Marcar servido'}
              </Button>
              <Button
                className="comanda__cancelar"
                type="text"
                icon={<CloseOutlined />}
                disabled={procesando}
                onClick={onCancelar}
                aria-label={`Cancelar el pedido ${comanda.id_pedido}`}
              >
                <span className="comanda__cancelar-texto">Cancelar</span>
              </Button>
            </div>
          ))}
      </div>
    </article>
  );
}
