import { API_URL } from './entorno';

// Manda los errores del frontend al backend (POST /errores), que los guarda en Firestore.
// Usa fetch y no axios: si falla, no tiene que volver a pasar por los interceptores ni reportarse a sí mismo.

const VENTANA_REPETIDOS_MS = 10_000;
const MAXIMO_POR_CARGA = 30;

const ultimosEnvios = new Map<string, number>();
let enviados = 0;

export function reportarError(mensaje: string, stack?: string | null, contexto?: string) {
  // Un error en un loop (ej. un render que falla siempre) no tiene que inundar Firestore.
  const ahora = Date.now();
  const anterior = ultimosEnvios.get(mensaje);
  if ((anterior && ahora - anterior < VENTANA_REPETIDOS_MS) || enviados >= MAXIMO_POR_CARGA) {
    return;
  }
  ultimosEnvios.set(mensaje, ahora);
  enviados += 1;

  fetch(`${API_URL}/errores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mensaje: mensaje.slice(0, 1000) || 'Error sin mensaje',
      stack: stack?.slice(0, 10000) || undefined,
      contexto: (contexto ?? window.location.pathname).slice(0, 500),
    }),
  }).catch(() => {
    // Si el backend no responde, no hay dónde registrarlo: se ignora.
  });
}

/** Errores globales: excepciones no atrapadas y promesas rechazadas sin catch. */
export function capturarErroresGlobales() {
  window.addEventListener('error', (evento) => {
    reportarError(evento.message, (evento.error as Error | undefined)?.stack);
  });
  window.addEventListener('unhandledrejection', (evento) => {
    const motivo: unknown = evento.reason;
    reportarError(
      motivo instanceof Error ? motivo.message : String(motivo),
      motivo instanceof Error ? motivo.stack : undefined,
    );
  });
}
