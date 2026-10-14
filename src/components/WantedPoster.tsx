import clsx from 'clsx'

export interface WantedStat { label: string; value: string | number }

interface Props {
  name: string
  subtitle?: string
  image?: string
  stats?: WantedStat[]
  reward?: string
  /** Inclinação em graus, para o efeito de cartaz pregado. */
  tilt?: number
  className?: string
  onClick?: () => void
}

/** Cartaz de "Procurado" usado nas fichas, no mural de recompensas e nos contratos. */
export function WantedPoster({ name, subtitle, image = './brand/logo-256.png', stats = [], reward, tilt = 0, className, onClick }: Props) {
  const Tag = onClick ? 'button' : 'article'
  return (
    <Tag
      onClick={onClick}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      className={clsx(
        'relative block w-full bg-parchment px-4 pb-4 pt-3 text-left text-ink shadow-[0_18px_40px_rgba(0,0,0,.7)]',
        'after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_20%_10%,transparent_60%,rgba(120,80,20,.25))]',
        onClick && 'cursor-pointer transition-transform hover:-translate-y-1',
        className,
      )}
    >
      <span aria-hidden className="absolute -top-2 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ff6a5f,#7a0a0f)] shadow" />
      <div className="border-b-[3px] border-double border-ink text-center font-poster text-4xl leading-none tracking-[.12em]">Procurado</div>
      <div className="my-2.5 grid h-32 place-items-center bg-[radial-gradient(circle_at_50%_40%,#8b6a3e,#3c2a14)]">
        <img src={image} alt="" className="h-26 max-h-[104px] object-contain sepia-[.6]" />
      </div>
      <div className="text-center font-poster text-3xl leading-none">{name}</div>
      {subtitle && <div className="text-center font-poster text-sm tracking-[.2em]">{subtitle}</div>}
      {stats.length > 0 && (
        <div className="mt-1.5 grid text-center font-poster" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map(s => (
            <div key={s.label}>
              <b className="block text-[28px] font-normal">{s.value}</b>
              <small className="text-xs tracking-[.12em]">{s.label}</small>
            </div>
          ))}
        </div>
      )}
      {reward && <div className="mt-2 text-center font-poster text-xl tracking-[.12em] text-wanted-red">{reward}</div>}
    </Tag>
  )
}
