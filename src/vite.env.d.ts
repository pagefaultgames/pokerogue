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
  readonly NODE_ENV?: string;
  readonly VITE_LOG_AI?: "0" | "1";
  readonly VITE_LOG_API?: "0" | "1";
  readonly VITE_LOG_BATTLE?: "0" | "1";
  readonly VITE_LOG_ENCOUNTER?: "0" | "1";
  readonly VITE_LOG_ITEM?: "0" | "1";
  readonly VITE_LOG_MYSTERY_ENCOUNTER?: "0" | "1";
  readonly VITE_LOG_PHASE?: "0" | "1";
  readonly VITE_LOG_TRAINER?: "0" | "1";
}

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}
