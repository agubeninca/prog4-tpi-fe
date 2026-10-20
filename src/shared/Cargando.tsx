import { Suspense, type ReactNode } from 'react';
import { Spin } from 'antd';

/** Spinner mientras se descarga una vista cargada con lazy(). */
export function Cargando({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
