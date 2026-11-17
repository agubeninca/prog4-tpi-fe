import { Tabs } from 'antd';
import { CierrePorDia } from '../components/CierrePorDia';
import { HistorialTurnos } from '../components/HistorialTurnos';
import { TurnoActualPanel } from '../components/TurnoActualPanel';

/**
 * Caja por turnos: se abre un turno con el efectivo inicial, cada cobro queda en el turno abierto
 * y en el cambio de turno se cierra contando la plata (arqueo).
 */
export function CajaView() {
  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Caja</h1>
      <Tabs
        defaultActiveKey="turno"
        destroyOnHidden
        items={[
          { key: 'turno', label: 'Turno actual', children: <TurnoActualPanel /> },
          { key: 'historial', label: 'Turnos anteriores', children: <HistorialTurnos /> },
          { key: 'dia', label: 'Resumen del día', children: <CierrePorDia /> },
        ]}
      />
    </div>
  );
}
