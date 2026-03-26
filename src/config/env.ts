const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function validateEnv(): void {
  const env = (window as any).ENV || import.meta.env;
  const missing = REQUIRED.filter(k => !env[k]);
  if (missing.length > 0) {
    throw new Error(`[SEGURANÇA] Env vars ausentes: ${missing.join(', ')}`);
  }
}
