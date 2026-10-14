import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sampleChars } from '../rules/samples'
import type { Campaign, Character, RollEntry } from '../rules/types'

export function defaultCampaign(): Campaign {
  return {
    crawl: {
      ep: 'Episódio I',
      title: 'A Sombra de Corellia',
      body: 'É um período de tensão crescente. Bandidos armados atacam senadores nas cantinas dos espaçoportos, e ninguém sabe quem paga pelos disparos.\n\nEm Corellia, um pequeno grupo de estranhos se encontra por acaso no meio de um tiroteio.\n\nAgora os heróis precisam decidir em quem confiar...',
    },
    log: [],
    combat: { round: 1, turn: 0, list: [] },
    map: { scene: 'cantina', cols: 24, rows: 16, tokens: [], walls: [], fog: '', fogOn: false },
    location: 'Corellia',
    updated: Date.now(),
  }
}

interface State {
  chars: Record<string, Character>
  campaign: Campaign
  log: RollEntry[]
  current: string | null
  saveChar: (c: Character) => void
  patchChar: (id: string, patch: Partial<Character>) => void
  deleteChar: (id: string) => void
  setCurrent: (id: string | null) => void
  patchCampaign: (fn: (c: Campaign) => Campaign) => void
  pushRoll: (r: Omit<RollEntry, 't'>) => RollEntry
  clearLog: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      chars: sampleChars(),
      campaign: defaultCampaign(),
      log: [],
      current: null,
      saveChar: c => set(s => ({ chars: { ...s.chars, [c.id]: { ...c, updated: Date.now() } } })),
      patchChar: (id, patch) => set(s => s.chars[id] ? ({ chars: { ...s.chars, [id]: { ...s.chars[id], ...patch, updated: Date.now() } } }) : s),
      deleteChar: id => set(s => {
        const chars = { ...s.chars }
        delete chars[id]
        return { chars, current: s.current === id ? null : s.current }
      }),
      setCurrent: id => set({ current: id }),
      patchCampaign: fn => set(s => ({ campaign: { ...fn(s.campaign), updated: Date.now() } })),
      pushRoll: r => {
        const entry = { ...r, t: Date.now() }
        set({ log: [entry, ...get().log].slice(0, 80) })
        return entry
      },
      clearLog: () => set({ log: [] }),
    }),
    { name: 'taberna.v1', partialize: s => ({ chars: s.chars, campaign: s.campaign, current: s.current }) },
  ),
)
