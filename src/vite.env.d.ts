/// <reference types="vite/client" />

// biome-ignore lint/style/useNamingConvention: HTTP and URL are fullcaps acronyms
type HTTP_URL = `http${"" | "s"}://${string}`;

// Declaration merging for vite's `import.meta.env`.

interface ImportMetaEnv {
  // TODO: There doesn't appear to be a way to override Vite's definition of MODE;
  // it still shows up as "string"...
  readonly MODE: "development" | "beta" | "production" | "test" | "app";
  readonly VITE_PORT?: `${number}`;
  readonly VITE_BYPASS_LOGIN?: "0" | "1";
  readonly VITE_BYPASS_TUTORIAL?: "0" | "1";
  readonly VITE_API_BASE_URL?: HTTP_URL;
  readonly VITE_SERVER_URL?: HTTP_URL;
  readonly VITE_DISCORD_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_I18N_DEBUG?: "0" | "1";
}

// tell vite to disallow missing env vars
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}
