## Mobile (Videira Conectada)

### Variaveis de ambiente (`mobile/.env`)

```env
ENV=stage
API_BASE_URL=http://SEU_BACKEND_LOCAL:3000
URL_BASE_DEV=http://SEU_BACKEND_LOCAL:3000
SUPABASE_URL=https://wkdfeizgfdkkkyatevpc.supabase.co
SUPABASE_ANON_KEY=SEU_SUPABASE_ANON_KEY
YOUTUBE_API_KEY=SUA_YOUTUBE_API_KEY
YOUTUBE_CHANNEL_ID=ID_DO_CANAL
```

- `SUPABASE_URL` e `SUPABASE_ANON_KEY` sao obrigatorias para login no app.
- O acesso e exclusivo para usuarios que possuem perfil valido na tabela `profiles` do projeto Supabase.
- `YOUTUBE_API_KEY` e `YOUTUBE_CHANNEL_ID` habilitam a secao de videos ao vivo no dashboard do membro.

### Executar local

```bash
yarn
npx expo start
```

### Build Android

APK (desenvolvimento):

```bash
eas build -p android --profile development
```

AAB (producao):

```bash
eas build -p android --profile production
```
