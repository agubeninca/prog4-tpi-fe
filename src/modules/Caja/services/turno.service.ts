import { api } from '../../../shared/api';
import type { ResumenCaja } from '../../Resumen/services/reporte.service';

export type NombreTurno = 'MANANA' | 'TARDE' | 'NOCHE';

export const ETIQUETA_TURNO: Record<NombreTurno, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
};

/** Turno que conviene proponer según la hora (se puede cambiar al abrir). */
export function turnoSegunHora(hora: number): NombreTurno {
  if (hora >= 6 && hora < 14) return 'MANANA';
  if (hora >= 14 && hora < 20) return 'TARDE';
  return 'NOCHE';
}

interface UsuarioTurno {
  nombre: string;
  nombre_usuario: string;
}

export interface ResumenTurno extends ResumenCaja {
  /** Momento en que se calculó (en un turno cerrado, el del cierre). */
  calculado: string;
}

export interface Turno {
  id_turno: number;
  nombre: NombreTurno;
  /** true si está abierto; null si ya se cerró. */
  abierto: boolean | null;
  fecha_apertura: string;
  efectivo_inicial: string;
  fecha_cierre: string | null;
  efectivo_esperado: string | null;
  efectivo_contado: string | null;
  /** Contado − esperado: positivo sobra, negativo falta. */
  diferencia: string | null;
  observacion_cierre: string | null;
  usuario_apertura: UsuarioTurno;
  usuario_cierre: UsuarioTurno | null;
  /** En un turno cerrado: el resumen tal como estaba al cerrar. */
  resumen: ResumenTurno | null;
}

/** El turno abierto, con el resumen en vivo y el efectivo que debería haber en la caja. */
export interface TurnoActual extends Turno {
  efectivo_esperado: string;
  resumen: ResumenTurno;
}

export const turnoService = {
  /** null si no hay turno abierto. */
  actual: () => api.get<TurnoActual | null>('/turnos/actual').then((res) => res.data || null),
  abrir: (datos: { nombre: NombreTurno; efectivo_inicial: number }) =>
    api.post<Turno>('/turnos/abrir', datos).then((res) => res.data),
  cerrar: (datos: { efectivo_contado: number; observacion?: string }) =>
    api.post<Turno>('/turnos/cerrar', datos).then((res) => res.data),
  historial: (filtro: { desde?: string; hasta?: string } = {}) =>
    api.get<Turno[]>('/turnos', { params: filtro }).then((res) => res.data),
};
