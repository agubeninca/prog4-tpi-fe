import { api } from '../../../shared/api';

export type TipoSistema = 'backend' | 'frontend';

export interface ErrorRegistrado {
  id: string;
  tipo_sistema: TipoSistema;
  mensaje: string;
  stack: string | null;
  /** Backend: "GET /ruta"; frontend: la ruta de la pantalla. */
  contexto: string | null;
  /** Personal logueado (solo errores de backend). */
  usuario: string | null;
  /** Navegador (solo errores de frontend). */
  navegador: string | null;
  fecha_hora: string;
}

// El log vive en Firestore, pero se lee a través del backend (solo ADMIN): así las reglas de
// Firestore siguen cerradas y un usuario de cocina no puede ver los errores.
export const errorService = {
  getAll: (tipo?: TipoSistema) =>
    api.get<ErrorRegistrado[]>('/errores', { params: { tipo, limite: 200 } }).then((res) => res.data),
  vaciar: () => api.delete<{ eliminados: number }>('/errores').then((res) => res.data),
  /** Genera un error de backend no controlado (para probar que se registra). */
  probarBackend: () => api.get('/errores/prueba'),
};
