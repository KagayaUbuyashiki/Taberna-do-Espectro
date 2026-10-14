/**
 * Sincronização em tempo real entre mestre e jogadores.
 *
 * API independente do transporte: `publish(key, value)` grava e avisa todo mundo;
 * `subscribe(key, cb)` recebe o valor atual e cada mudança. Uma chave que termina
 * em "/" assina a coleção inteira (ex.: "pedidos/" recebe "pedidos/abc", "pedidos/xyz").
 * `value === null` apaga a chave.
 *
 * Transporte: Supabase (tabela `kv` + Realtime) quando VITE_SUPABASE_URL está
 * configurado; senão BroadcastChannel, que sincroniza abas do mesmo navegador.
 */
import { supabase } from '../lib/supabase'

export type Valor = unknown
export type Ouvinte = (key: string, value: Valor) => void

export interface Transporte {
  readonly nome: 'supabase' | 'local'
  publish(key: string, value: Valor): Promise<void>
  /** `pronto(achou)` avisa quando a leitura inicial terminou e se havia algo salvo. */
  subscribe(key: string, cb: Ouvinte, pronto?: (achou: boolean) => void): () => void
}

const casa = (padrao: string, key: string) => (padrao.endsWith('/') ? key.startsWith(padrao) : key === padrao)

/* ------------------------------ Local (abas) ------------------------------ */

function transporteLocal(): Transporte {
  const PREFIXO = 'taberna.sync.'
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('taberna-sync') : null
  const ouvintes = new Set<{ padrao: string; cb: Ouvinte }>()
  const ler = (k: string) => { try { const v = localStorage.getItem(PREFIXO + k); return v == null ? null : JSON.parse(v) } catch { return null } }
  const avisar = (key: string, value: Valor) => ouvintes.forEach(o => casa(o.padrao, key) && o.cb(key, value))
  canal?.addEventListener('message', e => avisar(e.data.key, e.data.value))
  return {
    nome: 'local',
    async publish(key, value) {
      try {
        if (value === null) localStorage.removeItem(PREFIXO + key)
        else localStorage.setItem(PREFIXO + key, JSON.stringify(value))
      } catch { /* armazenamento indisponível: segue só em memória */ }
      canal?.postMessage({ key, value })
    },
    subscribe(padrao, cb, pronto) {
      const o = { padrao, cb }
      ouvintes.add(o)
      let achou = false
      try {
        const chaves: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)!
          if (k.startsWith(PREFIXO) && casa(padrao, k.slice(PREFIXO.length))) chaves.push(k.slice(PREFIXO.length))
        }
        chaves.forEach(k => { achou = true; cb(k, ler(k)) })
      } catch { /* sem armazenamento */ }
      pronto?.(achou)
      return () => { ouvintes.delete(o) }
    },
  }
}

/* -------------------------------- Supabase -------------------------------- */

/** Campanha (mesa) atual. Sem campanha, o Supabase não é usado. */
let campanha: string | null = null
try { campanha = localStorage.getItem('taberna.campanha') } catch { /* */ }

export function campanhaAtual() { return campanha }

function transporteSupabase(campaignId: string): Transporte {
  const sb = supabase!
  const ouvintes = new Set<{ padrao: string; cb: Ouvinte }>()
  const avisar = (key: string, value: Valor) => ouvintes.forEach(o => casa(o.padrao, key) && o.cb(key, value))
  sb.channel(`kv:${campaignId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kv', filter: `campaign_id=eq.${campaignId}` }, payload => {
      if (payload.eventType === 'DELETE') avisar((payload.old as { key: string }).key, null)
      else avisar((payload.new as { key: string }).key, (payload.new as { value: Valor }).value)
    })
    .subscribe()
  return {
    nome: 'supabase',
    async publish(key, value) {
      avisar(key, value) // resposta imediata nesta aba
      const q = value === null
        ? sb.from('kv').delete().eq('campaign_id', campaignId).eq('key', key)
        : sb.from('kv').upsert({ campaign_id: campaignId, key, value, updated_at: new Date().toISOString() })
      const { error } = await q
      if (error) console.error('[sync]', key, error.message)
    },
    subscribe(padrao, cb, pronto) {
      const o = { padrao, cb }
      ouvintes.add(o)
      let q = sb.from('kv').select('key,value').eq('campaign_id', campaignId)
      q = padrao.endsWith('/') ? q.like('key', `${padrao}%`) : q.eq('key', padrao)
      q.then(({ data }) => {
        data?.forEach(r => cb(r.key, r.value))
        pronto?.((data?.length ?? 0) > 0)
      })
      return () => { ouvintes.delete(o) }
    },
  }
}

export const sync: Transporte = supabase && campanha ? transporteSupabase(campanha) : transporteLocal()

/* ------------------------------- Campanhas ------------------------------- */

export type Papel = 'gm' | 'player'
export interface Campanha { id: string; code: string; name: string; papel: Papel }

async function garantirLogin() {
  const { data } = await supabase!.auth.getSession()
  if (data.session) return data.session.user.id
  const r = await supabase!.auth.signInAnonymously()
  if (r.error) throw new Error('Ative "Allow anonymous sign-ins" no Supabase (Authentication > Sign In / Providers).')
  return r.data.user!.id
}

function entrarLocal(id: string) {
  try { localStorage.setItem('taberna.campanha', id) } catch { /* */ }
  location.reload() // troca o transporte
}

/** Cria uma mesa nova; quem cria é o mestre. */
export async function criarCampanha(nome: string) {
  if (!supabase) throw new Error('Supabase não configurado.')
  await garantirLogin()
  const { data, error } = await supabase.rpc('create_campaign', { p_name: nome })
  if (error) throw new Error(error.message)
  entrarLocal(data as string)
}

/** Entra numa mesa pelo código que o mestre passou. */
export async function entrarCampanha(codigo: string) {
  if (!supabase) throw new Error('Supabase não configurado.')
  await garantirLogin()
  const { data, error } = await supabase.rpc('join_campaign', { p_code: codigo.trim().toUpperCase() })
  if (error) throw new Error(error.message)
  entrarLocal(data as string)
}

export function sairCampanha() {
  try { localStorage.removeItem('taberna.campanha') } catch { /* */ }
  location.reload()
}

/** Dados da mesa atual e o papel de quem está logado. */
export async function minhaCampanha(): Promise<Campanha | null> {
  if (!supabase || !campanha) return null
  const uid = await garantirLogin()
  const { data } = await supabase.from('members').select('role, campaigns(id, code, name)').eq('campaign_id', campanha).eq('user_id', uid).maybeSingle()
  if (!data) return null
  const c = data.campaigns as unknown as { id: string; code: string; name: string }
  return { id: c.id, code: c.code, name: c.name, papel: data.role as Papel }
}
