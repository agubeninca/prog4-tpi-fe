import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Si hay alguien del personal logueado, cada request lleva su ID token de Firebase.
// La Vista Cliente no tiene sesión, así que sus requests salen sin token (endpoints públicos).
api.interceptors.request.use(async (config) => {
  const usuario = auth.currentUser;
  if (usuario) {
    config.headers.Authorization = `Bearer ${await usuario.getIdToken()}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && auth.currentUser) {
      void signOut(auth);
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
    if (data?.message) {
      return data.message;
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor';
    }
  }
  return 'Ocurrió un error inesperado';
}
