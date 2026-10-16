import clsx from 'clsx'
import { AssetImg } from '../../components/ui/AssetImg'
import { ASSET } from '../../lib/assets'
import { SIDE_LABEL } from './combat'

/* Silhuetas provisórias do bestiário, por tipo de inimigo. */
const SIL: Record<string, string> = {
  // capacete de soldado (Império/República)
  trooper: 'M50 14c-17 0-26 11-26 27v10l-5 8 6 5h50l6-5-5-8V41c0-16-9-27-26-27zM16 100c2-18 14-28 34-28s32 10 34 28z',
  // humanoide comum
  humano: 'M50 16a15 17 0 1 0 0 34a15 17 0 1 0 0-34zM14 100c2-22 16-34 36-34s34 12 36 34z',
  // dróide de batalha de cabeça alongada
  droide: 'M30 22h34l10 8-6 6H40l-4 6h-6zM47 42h6v16h-6zM34 58h32l-4 20h-24zM40 78h5l-3 22h-5zM55 78h5l3 22h-5z',
  // fera curvada
  fera: 'M22 40l-6-14 12 8c6-6 14-9 22-9s16 3 22 9l12-8-6 14c6 8 8 18 8 28 0 14-6 26-14 32H28c-8-6-14-18-14-32 0-10 2-20 8-28zM38 50a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM62 50a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
}
const silOf = (name: string, side: string) =>
  side === 'beast' ? 'fera' : side === 'cis' ? 'droide' : side === 'imp' || side === 'rep' || /trooper|clone/i.test(name) ? 'trooper' : 'humano'

/** Arte do inimigo: imagem do bestiário quando existir; senão silhueta com o emblema da facção. */
export function BeastArt({ name, side = '', className }: { name: string; side?: string; className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden border border-line-2 bg-black', className)}>
      <AssetImg path={ASSET.beast(name)} alt={name} className="h-full w-full object-cover object-top"
        fallback={
          <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={name}>
            <defs>
              <radialGradient id="beast-bg" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#2a0a0c" /><stop offset="1" stopColor="#050304" /></radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#beast-bg)" />
            <circle cx="50" cy="48" r="38" fill="none" className="stroke-ember/30" strokeDasharray="2 4" />
            <path d={SIL[silOf(name, side)]} className="fill-ember/25 stroke-ember" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        } />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />
      {SIDE_LABEL[side] && (
        <span className="absolute bottom-0 left-0 bg-black/80 px-1.5 font-display text-[10px] tracking-[.2em] text-ember">{SIDE_LABEL[side]}</span>
      )}
    </div>
  )
}
