/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_SUPABASE: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

/* silenciar tipos de supabase en build (lo importamos dinámicamente) */
declare module '@supabase/supabase-js';
