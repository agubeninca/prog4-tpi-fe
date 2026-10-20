import type { ReactNode } from 'react';
import { Button, Result, Spin } from 'antd';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../stores/auth.store';
import { rutaInicioPorRol, type UsuarioRol } from '../modules/Auth/services/auth.service';

interface RutaProtegidaProps {
  roles: UsuarioRol[];
  children: ReactNode;
}

export function RutaProtegida({ roles, children }: RutaProtegidaProps) {
  const { usuario, inicializado } = useAuthStore();
  const location = useLocation();

  if (!inicializado) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (!roles.includes(usuario.rol)) {
    return (
      <Result
        status="403"
        title="Sin permisos"
        subTitle="Tu usuario no tiene acceso a esta sección."
        extra={
          <Link to={rutaInicioPorRol(usuario.rol)}>
            <Button type="primary">Ir a mi panel</Button>
          </Link>
        }
      />
    );
  }

  return children;
}
