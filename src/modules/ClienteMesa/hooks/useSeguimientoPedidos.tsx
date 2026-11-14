import { useEffect } from 'react';
import { Button, notification } from 'antd';
import { useNavigate } from 'react-router';
import { API_URL } from '../../../shared/entorno';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';
import { ESTADOS_FINALES, type EstadoPedido } from '../../Pedido/services/pedido.service';
import { resaltarTitulo, sonar, vibrar } from '../avisos';
import { useSeguimientoStore } from '../seguimiento.store';

interface EventoEstado {
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
}

/**
 * Sigue en vivo (Server-Sent Events) los pedidos de la sesión y avisa cuando uno cambia, desde
 * cualquier pantalla de la Vista Cliente. Se cierra solo cuando el pedido termina.
 * El primer evento de cada pedido es el punto de partida: no avisa.
 */
export function useSeguimientoPedidos() {
  const dni = useSesionClienteStore((state) => state.cliente?.dni);
  const hash = useSesionClienteStore((state) => state.mesa?.hash);
  const pedidos = useSesionClienteStore((state) => state.pedidos);
  const navigate = useNavigate();
  const clave = pedidos.join(',');

  useEffect(() => {
    if (!dni) return;
    const fuentes = pedidos.map((idPedido) => {
      const fuente = new EventSource(`${API_URL}/pedidos/${idPedido}/eventos?dni=${dni}`);

      fuente.addEventListener('estado', (evento) => {
        const { estado, motivo_cancelacion } = JSON.parse((evento as MessageEvent<string>).data) as EventoEstado;
        const anterior = useSeguimientoStore.getState().estados[idPedido]?.estado;
        useSeguimientoStore.getState().registrar(idPedido, estado, motivo_cancelacion);

        if (anterior && anterior !== estado) {
          avisarCambio(idPedido, estado, motivo_cancelacion, () => navigate(`/m/${hash}/pedido/${idPedido}`));
        }
        // El servidor cierra la conexión al terminar; sin esto el navegador intentaría reconectar para siempre.
        if (ESTADOS_FINALES.includes(estado)) fuente.close();
      });
      return fuente;
    });
    return () => fuentes.forEach((fuente) => fuente.close());
    // `clave` representa a `pedidos`: se reconecta solo si cambia la lista de pedidos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni, hash, clave]);
}

function avisarCambio(idPedido: number, estado: EstadoPedido, motivo: string | null, verPedido: () => void) {
  const actions = (
    <Button size="small" type="primary" onClick={() => { notification.destroy(); verPedido(); }}>
      Ver pedido
    </Button>
  );
  if (estado === 'SERVIDO') {
    notification.success({ title: `¡Tu pedido #${idPedido} está listo!`, description: 'Ya podés retirarlo o te lo llevan a la mesa.', placement: 'top', duration: 0, actions });
    sonar();
    vibrar();
    resaltarTitulo('¡Tu pedido está listo!');
  } else if (estado === 'EN_PREPARACION') {
    notification.info({ title: `Tu pedido #${idPedido} se está preparando`, placement: 'top', duration: 6, actions });
  } else if (estado === 'CANCELADO') {
    notification.warning({ title: `Tu pedido #${idPedido} fue cancelado`, description: motivo ?? undefined, placement: 'top', duration: 0, actions });
    vibrar();
  }
  // Si vuelve a "Pendiente" (la barra lo corrigió) no se avisa: la pantalla del pedido igual se actualiza.
}
