/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT?: string;
  readonly VITE_BYPASS_LOGIN?: string;
  readonly VITE_BYPASS_TUTORIAL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SERVER_URL?: string;
  readonly VITE_DISCORD_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_I18N_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
