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
  /** 'holo' (padrão): holograma dourado da proposta 14. 'papel': cartaz impresso. */
  variant?: 'holo' | 'papel'
  className?: string
  onClick?: () => void
}

/** Cartaz de "Procurado" usado nas fichas, no mural de recompensas e nos contratos. */
export function WantedPoster({ name, subtitle, image = './brand/logo-256.png', stats = [], reward, tilt = 0, variant = 'holo', className, onClick }: Props) {
  const Tag = onClick ? 'button' : 'article'
  const holo = variant === 'holo'
  return (
    <Tag
      onClick={onClick}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
      className={clsx(
        'group relative block w-full overflow-hidden px-4 pb-4 pt-3 text-left',
        holo
          ? 'border border-gold bg-gold/10 text-gold shadow-[0_0_24px_rgba(255,210,74,.3)] backdrop-blur-[2px]'
          : 'bg-parchment text-ink shadow-[0_18px_40px_rgba(0,0,0,.7)]',
        onClick && 'cursor-pointer transition-transform hover:-translate-y-1',
        className,
      )}
    >
      {holo ? (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,210,74,.12)_0_1px,transparent_1px_3px)]" />
          <span aria-hidden className="holo-sweep pointer-events-none absolute inset-x-0 -top-1/3 h-1/3 bg-gradient-to-b from-transparent via-gold/15 to-transparent" />
        </>
      ) : (
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,transparent_60%,rgba(120,80,20,.25))]" />
      )}
      <div className={clsx('relative border-b-[3px] border-double text-center font-poster text-4xl leading-none tracking-[.12em]', holo ? 'border-gold' : 'border-ink')}>Procurado</div>
      <div className={clsx('relative my-2.5 grid h-32 place-items-center overflow-hidden', holo ? 'bg-gold/10' : 'bg-[radial-gradient(circle_at_50%_40%,#8b6a3e,#3c2a14)]')}>
        <img
          src={image}
          alt=""
          className={clsx('h-full max-h-32 w-full object-contain', holo ? 'opacity-85 [filter:sepia(1)_saturate(3)_hue-rotate(5deg)_brightness(1.2)]' : 'sepia-[.6]')}
        />
      </div>
      <div className="relative text-center font-poster text-3xl leading-none">{name}</div>
      {subtitle && <div className="relative text-center font-poster text-sm tracking-[.2em] opacity-80">{subtitle}</div>}
      {stats.length > 0 && (
        <div className="relative mt-1.5 grid text-center font-poster" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map(s => (
            <div key={s.label}>
              <b className="block text-[28px] font-normal">{s.value}</b>
              <small className="text-xs tracking-[.12em]">{s.label}</small>
            </div>
          ))}
        </div>
      )}
      {reward && <div className={clsx('relative mt-2 text-center font-poster text-xl tracking-[.12em]', holo ? 'text-[#ff6a5f]' : 'text-wanted-red')}>{reward}</div>}
    </Tag>
  )
}
