// URLs de los servidores según desde dónde se abrió la app:
// en la PC es localhost; en el celular (misma red WiFi) es la IP de la PC.
// Si el .env apunta a localhost, se reemplaza por el host actual, así el mismo .env sirve en los dos casos.

const HOSTS_LOCALES = ['localhost', '127.0.0.1', '::1', '[::1]'];

const esLocal = (host: string) => HOSTS_LOCALES.includes(host);

/** Host actual. `localhost` se traduce a 127.0.0.1 porque los emuladores escuchan solo en IPv4. */
const hostActual = esLocal(window.location.hostname) ? '127.0.0.1' : window.location.hostname;

function urlDelServidor(valor: string | undefined, porDefecto: string) {
  const url = new URL(valor || porDefecto);
  if (esLocal(url.hostname)) {
    url.hostname = hostActual;
  }
  return url.toString().replace(/\/$/, '');
}

export const API_URL = urlDelServidor(import.meta.env.VITE_API_URL, 'http://localhost:3000');

export const AUTH_EMULATOR_URL = urlDelServidor(import.meta.env.VITE_AUTH_EMULATOR_URL, 'http://127.0.0.1:9099');

export const STORAGE_EMULATOR_URL = urlDelServidor(
  import.meta.env.VITE_STORAGE_EMULATOR_URL,
  'http://127.0.0.1:9199/v0/b/demo-kitch.appspot.com/o',
);

const hostFirestore = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
export const FIRESTORE_EMULATOR_HOST = esLocal(hostFirestore) ? hostActual : hostFirestore;
export const FIRESTORE_EMULATOR_PORT = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080);

/**
 * URL pública que va en el QR de las mesas. `npm start` la completa con la IP de la red,
 * para que el celular pueda abrirla; si no hay red, se usa el origen actual.
 */
const urlPublica = import.meta.env.VITE_PUBLIC_APP_URL;
export const PUBLIC_APP_URL = (
  urlPublica && !esLocal(new URL(urlPublica).hostname) ? urlPublica : window.location.origin
).replace(/\/$/, '');

/** true si el QR apunta a esta PC: un celular no lo va a poder abrir. */
export const QR_SOLO_LOCAL = esLocal(new URL(PUBLIC_APP_URL).hostname);
