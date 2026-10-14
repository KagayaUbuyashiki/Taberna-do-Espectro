# Mesa online com Supabase

1. Crie um projeto grátis em supabase.com.
2. Em **Authentication > Sign In / Providers**, ligue **Allow anonymous sign-ins**.
3. Em **SQL Editor**, rode `migrations/20261014000000_mesa.sql`.
4. Copie **Project URL** e a chave **anon public** (Project Settings > API) para um `.env` na raiz, como em `.env.example`.

O mestre cria a mesa na aba **Mestre > Mesa online** e passa o código de 6 letras. Os jogadores entram com o código na mesma aba.

API de sincronização para outras partes do site: `src/sync/index.ts` (`sync.publish(key, value)` e `sync.subscribe(key, cb)`; chave terminada em `/` assina uma coleção). Regras de quem grava cada chave estão nas políticas da tabela `kv`.
