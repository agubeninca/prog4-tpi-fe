import { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { Link } from 'react-router';
import { turnoService } from '../services/turno.service';

const INTERVALO_MS = 60_000;

/** En el panel de la Barra: avisa que no hay turno de caja abierto (sin turno no se puede cobrar). */
export function AvisoSinTurno() {
  const [sinTurno, setSinTurno] = useState(false);

  useEffect(() => {
    let vigente = true;
    const revisar = () =>
      turnoService
        .actual()
        .then((turno) => vigente && setSinTurno(!turno))
        // Si falla la consulta no se muestra nada: el error real aparece al intentar cobrar.
        .catch(() => undefined);
    void revisar();
    const intervalo = setInterval(revisar, INTERVALO_MS);
    window.addEventListener('focus', revisar);
    return () => {
      vigente = false;
      clearInterval(intervalo);
      window.removeEventListener('focus', revisar);
    };
  }, []);

  if (!sinTurno) return null;
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      title="No hay un turno de caja abierto: hasta que abras uno no se puede cobrar."
      action={
        <Link to="/cocina/caja">
          <Button size="small" type="primary">
            Abrir turno
          </Button>
        </Link>
      }
    />
  );
}
