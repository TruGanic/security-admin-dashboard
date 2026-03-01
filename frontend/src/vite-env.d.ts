/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SECURITY_SERVICE_URL: string;
  readonly VITE_DASHBOARD_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
