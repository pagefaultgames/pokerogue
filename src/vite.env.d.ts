/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BYPASS_LOGIN?: string;
    readonly VITE_BYPASS_TUTORIAL?: string;
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
