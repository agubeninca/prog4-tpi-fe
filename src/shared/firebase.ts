import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const app = initializeApp({
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: 'demo-api-key',
});

export const auth = getAuth(app);
connectAuthEmulator(auth, import.meta.env.VITE_AUTH_EMULATOR_URL, { disableWarnings: true });

export const db = getFirestore(app);
connectFirestoreEmulator(
  db,
  import.meta.env.VITE_FIRESTORE_EMULATOR_HOST,
  Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT),
);

/**
 * URL pública de una imagen del emulador de Storage.
 * `version` (ej. fecha_actualizacion) evita que el navegador muestre la imagen vieja tras reemplazarla.
 */
export function urlImagen(rutaImagen: string | null | undefined, version?: string): string | undefined {
  if (!rutaImagen) {
    return undefined;
  }
  const url = `${import.meta.env.VITE_STORAGE_EMULATOR_URL}/${encodeURIComponent(rutaImagen)}?alt=media`;
  return version ? `${url}&v=${encodeURIComponent(version)}` : url;
}
