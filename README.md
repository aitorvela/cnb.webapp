# CNB WebApp (Vite + React + Tailwind)

## Dev
```bash
npm i
npm run dev
```

## Producción (Vercel + Supabase)
- Variables (Vercel):
  - `VITE_USE_SUPABASE=true`
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`

- Supabase: pega el `schema + RLS` desde tu canvas o usa tus tablas existentes.

## Notas
- El código cambia automáticamente a modo Supabase real si las variables VITE_* están presentes.
