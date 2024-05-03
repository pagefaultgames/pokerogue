/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENVIRONMENT: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_BYPASS_LOGIN: boolean;
    readonly VITE_BYPASS_TUTORIAL: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}