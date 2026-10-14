import { create } from 'zustand'

export interface Popup { id: number; value: string | number; label: string; kind?: 'crit' | 'fumble' | '' }
interface Toast { id: number; msg: string }

interface UI {
  popup: Popup | null
  toasts: Toast[]
  diceOpen: boolean
  sound: boolean
  showPopup: (p: Omit<Popup, 'id'>) => void
  toast: (msg: string) => void
  dropToast: (id: number) => void
  setDiceOpen: (v: boolean) => void
  setSound: (v: boolean) => void
}

let seq = 0
export const useUI = create<UI>(set => ({
  popup: null,
  toasts: [],
  diceOpen: false,
  sound: false,
  showPopup: p => set({ popup: { ...p, id: ++seq } }),
  toast: msg => {
    const id = ++seq
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, msg }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2800)
  },
  dropToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  setDiceOpen: v => set({ diceOpen: v }),
  setSound: v => set({ sound: v }),
}))

export const toast = (msg: string) => useUI.getState().toast(msg)
