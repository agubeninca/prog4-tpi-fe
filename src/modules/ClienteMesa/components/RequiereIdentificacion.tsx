import { Navigate, Outlet, useParams } from 'react-router';
import { useSesionClienteStore } from '../../../stores/sesionCliente.store';

/** RB-04: sin DNI + nombre registrados para esta mesa no se accede al menú ni se pide. */
export function RequiereIdentificacion() {
  const { hash } = useParams();
  const { mesa, cliente } = useSesionClienteStore();

  if (!cliente || mesa?.hash !== hash) {
    return <Navigate to={`/m/${hash}`} replace />;
  }
  return <Outlet />;
}
