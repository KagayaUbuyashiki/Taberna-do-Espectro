import { create } from 'zustand'
import { PLANETS } from '../../data/saga'

/* Tabelas de improviso do mestre (portadas do protótipo, story.js). */
export const GEN = {
  nomes: {
    humano: [['Kira', 'Dax', 'Tarn', 'Mira', 'Joren', 'Lyra', 'Corran', 'Vela', 'Bren', 'Ysalla'], ['Vel', 'Sunrider', 'Kessar', 'Ordo', 'Tano', 'Varn', 'Halcyon', 'Drey', 'Marr', 'Quell']],
    twilek: [['Aayla', 'Bib', 'Lyn', 'Nara', 'Shaela', 'Ryloth', 'Tal', 'Vixa'], ["'Secura", "'Fortuna", "'Ree", "'Dana", "'Kel", "'Ondo"]],
    rodiano: [['Greedo', 'Navik', 'Onaconda', 'Beedo', 'Wald', 'Kelko'], ['Tetsu', 'Farr', 'Rheeka', 'Doo', 'Taak']],
    bothan: [['Borsk', 'Karka', 'Koth', 'Tav', 'Tereb', 'Asyr'], ["Fey'lya", "Kre'fey", 'Melan', "Breil'lya", "Ab'lon"]],
    wookiee: [['Rorworr', 'Chewbacca', 'Tarfful', 'Lowbacca', 'Salporin', 'Kallabow', 'Wuher'], ['']],
    zabrak: [['Eeth', 'Agen', 'Sugi', 'Maris', 'Darsha', 'Savage'], ['Koth', 'Kolar', 'Brood', 'Assant', 'Opress']],
    duros: [['Cad', 'Ohwun', 'Garindan', 'Lai', 'Ven'], ['Bane', 'De Mafi', 'Zallow', 'Tobban']],
  } as Record<string, [string[], string[]]>,
  especie: { humano: 'Humano', twilek: "Twi'lek", rodiano: 'Rodiano', bothan: 'Bothan', wookiee: 'Wookiee', zabrak: 'Zabrak', duros: 'Duros' } as Record<string, string>,
  papel: ['caçador de recompensas', 'contrabandista em dívida com os Hutts', 'agente imperial disfarçado', 'médico de um posto avançado', 'mecânico de hangar', 'senador em fuga', 'informante Bothan', 'pirata espacial', 'Jedi que sobreviveu à Ordem 66', 'comerciante de sucata Jawa', 'piloto da Aliança Rebelde', 'guarda-costas Gamorreano', 'espião da Rede Bothan', 'oficial do Sindicato Pyke'],
  traco: ['fala baixo e nunca pisca', 'coleciona fichas de sabacc', 'tem um dróide que o contradiz', 'manca de uma perna cibernética', 'ri alto nas horas erradas', 'cheira a combustível de hiperpropulsor', 'desconfia de qualquer Jedi', 'deve créditos a meia galáxia', 'cita provérbios Wookiee', 'usa uma capa grande demais'],
  quer: ['quitar uma dívida antes do próximo ciclo', 'vingar um irmão morto por stormtroopers', 'sair do planeta sem ser visto', 'vender um cristal kyber roubado', 'encontrar um holocron perdido', 'proteger uma criança sensitiva à Força', 'entregar uma mensagem a Alderaan', 'descobrir quem traiu seu esquadrão'],
  gancho: ['Um holocron Jedi aparece num leilão do mercado negro em Nar Shaddaa, e três facções querem comprá-lo.', 'Um cargueiro corelliano chega ao espaçoporto com a tripulação inteira congelada em carbonita.', 'O Império bloqueia um mundo agrícola; os heróis precisam furar o cerco com suprimentos médicos.', 'Um senador pede escolta discreta até uma conferência secreta. Alguém pagou caro para que ele não chegue.', 'Um dróide astromecânico procura os heróis com metade de uma mensagem holográfica.', 'Uma tempestade de areia revela as ruínas de um templo Sith sob as dunas.', 'Jabba oferece perdoar uma dívida se o grupo recuperar um rancor fugido.', 'Sinais de socorro de uma estação mineradora param de repente no meio de uma frase.'],
  complica: ['Os stormtroopers chegam dois minutos antes do previsto.', 'O contato era um traidor e trouxe caçadores de recompensas.', 'O hiperpropulsor falha no pior momento possível.', 'Um inocente fica preso na linha de tiro.', 'A carga não é o que diziam: está viva.', 'Um velho inimigo de um dos heróis reconhece seu rosto.', 'O alarme dispara: a porta tem uma tranca de nível 4 (Mecânica CD 25).', 'Um Jedi sente uma perturbação na Força vinda de um aliado.'],
  cantina: ['Um Gamorreano bêbado escolhe o herói mais baixo para uma briga.', 'A banda Bith para de tocar quando alguém entra: todos olham para a porta.', 'Um Rodiano oferece um trabalho fácil demais.', 'Um jogo de sabacc vira ameaça de blaster por cartas marcadas.', 'Um dróide garçom derruba bebida em um caçador Trandoshano.', 'O atendente grita: "Sem dróides aqui!"'],
  nave: [['Estrela', 'Falcão', 'Vingança', 'Sombra', 'Lança', 'Promessa', 'Alvorada', 'Fantasma'], ['de Corellia', 'Escarlate', 'do Vazio', 'Errante', 'de Kessel', 'Partida', 'Solar', 'do Anel Exterior']],
  clima: ['Dois sóis, 52 °C ao meio-dia; água vale mais que créditos.', 'Nevasca: -40 °C, visibilidade de 3 quadrados, testes de Tolerância a cada hora.', 'Chuva ácida leve: equipamentos sem proteção sofrem 1 de dano por hora.', 'Névoa espessa do pântano: encobrimento além de 6 quadrados.', 'Gravidade baixa: Saltar +10, mas armas pesadas recuam.', 'Tempestade de íons: comlinks falham, dróides ficam -1 passo na condição.'],
}

export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** Nome aleatório com a espécie de origem. */
export function genName() {
  const k = pick(Object.keys(GEN.nomes))
  const [a, b] = GEN.nomes[k]
  const sob = pick(b)
  const n = pick(a) + (sob === '' ? '' : (sob[0] === "'" ? '' : ' ') + sob)
  return { n, sp: GEN.especie[k] }
}

export type GenTipo = 'nome' | 'npc' | 'gancho' | 'complica' | 'cantina' | 'nave' | 'clima' | 'local'
export const GEN_BOTOES: [GenTipo, string][] = [
  ['npc', 'NPC'], ['nome', 'Nome'], ['gancho', 'Gancho de aventura'], ['complica', 'Complicação'],
  ['cantina', 'Cena de cantina'], ['nave', 'Nome de nave'], ['clima', 'Clima do planeta'], ['local', 'Local'],
]

export interface GenOut { id: number; k: string; t: string; local?: string }

/** Gera um resultado do tipo pedido. */
export function gerar(k: GenTipo): Omit<GenOut, 'id'> {
  switch (k) {
    case 'npc': {
      const g = genName()
      return { k: 'NPC', t: `${g.n} (${g.sp}), ${pick(GEN.papel)}. ${cap(pick(GEN.traco))}; quer ${pick(GEN.quer)}.` }
    }
    case 'nome': { const g = genName(); return { k: 'Nome', t: `${g.n} (${g.sp})` } }
    case 'nave': return { k: 'Nave', t: `${pick(GEN.nave[0])} ${pick(GEN.nave[1])}` }
    case 'clima': return { k: 'Clima', t: pick(GEN.clima) }
    case 'local': { const p = pick(PLANETS); return { k: 'Local', t: `${p.n} (${p.r}): ${p.d}`, local: p.n } }
    case 'gancho': return { k: 'Gancho', t: pick(GEN.gancho) }
    case 'complica': return { k: 'Complicação', t: pick(GEN.complica) }
    case 'cantina': return { k: 'Cantina', t: pick(GEN.cantina) }
  }
}

/* Resultados ficam guardados enquanto a aba estiver aberta (como no protótipo), sem ir para o disco. */
let seq = 0
export const useGeradores = create<{ out: GenOut[]; add: (g: Omit<GenOut, 'id'>) => void; clear: () => void }>(set => ({
  out: [],
  add: g => set(s => ({ out: [{ ...g, id: ++seq }, ...s.out].slice(0, 6) })),
  clear: () => set({ out: [] }),
}))
