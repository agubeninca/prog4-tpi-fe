interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_APP_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_AUTH_EMULATOR_URL: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST: string;
  readonly VITE_FIRESTORE_EMULATOR_PORT: string;
  readonly VITE_STORAGE_EMULATOR_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
