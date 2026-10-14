import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { NAV } from '../nav'

function Hilt() {
  return (
    <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden className="shrink-0">
      <rect x="0" y="2" width="30" height="6" rx="1" fill="#9a9a9a" />
      <rect x="4" y="2" width="2" height="6" fill="#333" />
      <rect x="8" y="2" width="2" height="6" fill="#333" />
      <rect x="12" y="1" width="6" height="8" fill="#5a5a5a" />
      <rect x="22" y="3" width="3" height="4" fill="#c4141c" />
      <rect x="30" y="1" width="4" height="8" fill="#cfcfcf" />
    </svg>
  )
}

/** Menu lateral: cada item é um cabo de sabre; o da página aberta acende e a lâmina desliza até ele. */
export function SaberNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))
  return (
    <nav aria-label="Seções" className="flex flex-col gap-0.5">
      {NAV.map(n => {
        const on = isActive(n.path)
        return (
          <NavLink
            key={n.path}
            to={n.path}
            end={n.path === '/'}
            onClick={onNavigate}
            className={clsx(
              'group relative flex items-center gap-3 py-1.5 pl-1 font-display text-[23px] tracking-[.14em] transition-colors',
              on ? 'text-white' : 'text-[#b9b4a6] hover:text-gold',
            )}
          >
            <Hilt />
            {on && (
              <motion.span
                layoutId="saber-blade"
                className="absolute left-[38px] right-[-26px] top-1/2 h-[5px] -mt-[2px] origin-left rounded-full bg-[#fffbe8] shadow-[0_0_5px_2px_#ffd24a,0_0_16px_5px_rgba(255,190,40,.85)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className={clsx('relative z-10', on && '[text-shadow:0_0_3px_#000,0_0_8px_#000,0_0_12px_#000]')}>{n.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
