-- Mesa online da Taberna do Espectro: campanhas, membros e estado compartilhado (kv).
-- Rode no SQL Editor do Supabase (ou `supabase db push`). Login: anônimo se "Allow anonymous sign-ins" estiver ligado; senão, link por e-mail.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  gm_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('gm', 'player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- Estado compartilhado por chave. Chaves usadas hoje:
--   mesa          nave, coordenadas, diário (qualquer membro grava)
--   mestre        locais, ações bloqueadas, mural, arsenal (só o mestre grava)
--   pedidos/<id>  pedidos dos jogadores (membros criam, o mestre responde)
create table if not exists public.kv (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (campaign_id, key)
);

alter table public.campaigns enable row level security;
alter table public.members enable row level security;
alter table public.kv enable row level security;

create or replace function public.is_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where campaign_id = c and user_id = auth.uid())
$$;

create or replace function public.is_gm(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where campaign_id = c and user_id = auth.uid() and role = 'gm')
$$;

drop policy if exists "membros leem a campanha" on public.campaigns;
create policy "membros leem a campanha" on public.campaigns for select using (public.is_member(id));

drop policy if exists "membros se veem" on public.members;
create policy "membros se veem" on public.members for select using (public.is_member(campaign_id));

drop policy if exists "membros leem kv" on public.kv;
create policy "membros leem kv" on public.kv for select using (public.is_member(campaign_id));

drop policy if exists "membros gravam kv" on public.kv;
create policy "membros gravam kv" on public.kv for insert
  with check (public.is_gm(campaign_id) or (public.is_member(campaign_id) and (key = 'mesa' or key like 'pedidos/%' or key like 'chars/%')));

drop policy if exists "membros atualizam kv" on public.kv;
create policy "membros atualizam kv" on public.kv for update
  using (public.is_gm(campaign_id) or (public.is_member(campaign_id) and (key = 'mesa' or key like 'pedidos/%' or key like 'chars/%')));

drop policy if exists "mestre apaga kv" on public.kv;
create policy "mestre apaga kv" on public.kv for delete using (public.is_gm(campaign_id));

-- Criar mesa: gera um código de 6 letras e torna quem criou o mestre.
create or replace function public.create_campaign(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when length(v_code) = 6 and not exists (select 1 from campaigns where code = v_code);
  end loop;
  insert into campaigns (code, name, gm_id) values (v_code, coalesce(nullif(p_name, ''), 'Mesa'), auth.uid()) returning id into v_id;
  insert into members (campaign_id, user_id, role) values (v_id, auth.uid(), 'gm');
  return v_id;
end $$;

-- Entrar na mesa pelo código.
create or replace function public.join_campaign(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  select id into v_id from campaigns where code = upper(p_code);
  if v_id is null then raise exception 'Código de mesa não encontrado'; end if;
  insert into members (campaign_id, user_id, role) values (v_id, auth.uid(), 'player') on conflict do nothing;
  return v_id;
end $$;

grant execute on function public.create_campaign(text) to authenticated;
grant execute on function public.join_campaign(text) to authenticated;

-- Tempo real na tabela kv.
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;

-- Imagens enviadas pelo mestre (cartazes de procurado, personagens). Pasta = id da campanha.
insert into storage.buckets (id, name, public) values ('imagens', 'imagens', true) on conflict (id) do nothing;

drop policy if exists "mestre envia imagens" on storage.objects;
create policy "mestre envia imagens" on storage.objects for insert to authenticated
  with check (bucket_id = 'imagens' and public.is_gm(((storage.foldername(name))[1])::uuid));

drop policy if exists "mestre apaga imagens" on storage.objects;
create policy "mestre apaga imagens" on storage.objects for delete to authenticated
  using (bucket_id = 'imagens' and public.is_gm(((storage.foldername(name))[1])::uuid));
