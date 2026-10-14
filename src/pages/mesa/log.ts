import { useStore } from '../../store/campaign'

/** Registra no diário o dano aplicado à mão (não é rolagem, mas fica no histórico como no protótipo). */
export const pushDamageLog = (who: string, total: number, det: string) =>
  useStore.getState().pushRoll({ label: 'Dano', who, total, det })
