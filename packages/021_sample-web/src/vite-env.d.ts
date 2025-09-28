/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_ENV: "local" | "production";
  readonly VITE_WORLD_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
