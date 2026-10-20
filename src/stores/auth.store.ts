import { create } from 'zustand';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../shared/firebase';
import { authService, type UsuarioSesion } from '../modules/Auth/services/auth.service';

interface AuthState {
  usuario: UsuarioSesion | null;
  /** false hasta que Firebase informa si hay una sesión guardada (evita redirigir al login antes de tiempo). */
  inicializado: boolean;
  login: (email: string, password: string) => Promise<UsuarioSesion>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  inicializado: false,
  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    try {
      const usuario = await authService.me();
      set({ usuario, inicializado: true });
      return usuario;
    } catch (error) {
      // La cuenta existe en Firebase pero no está habilitada en Kitch (o fue archivada).
      await signOut(auth);
      throw error;
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ usuario: null });
  },
}));

onAuthStateChanged(auth, async (usuarioFirebase) => {
  if (!usuarioFirebase) {
    useAuthStore.setState({ usuario: null, inicializado: true });
    return;
  }
  try {
    useAuthStore.setState({ usuario: await authService.me(), inicializado: true });
  } catch {
    await signOut(auth);
    useAuthStore.setState({ usuario: null, inicializado: true });
  }
});
