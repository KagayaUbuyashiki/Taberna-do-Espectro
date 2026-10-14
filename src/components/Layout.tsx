import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BridgeBackground } from './BridgeBackground'
import { SaberNav } from './SaberNav'
import { AlienText } from './AlienText'
import { DiceTray } from './dice/DiceTray'
import { RollPopup } from './dice/RollPopup'
import { Toasts } from './Toasts'

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={compact ? 'flex items-center gap-3' : 'block text-center'}>
      <img src="./brand/logo-256.png" alt="" className={compact ? 'h-10 w-10' : 'mx-auto h-36 w-36 drop-shadow-[0_8px_18px_rgba(0,0,0,.7)]'} />
      <span className={compact ? 'block' : 'mt-2 block'}>
        <b className={compact ? 'title-outline block text-xl [-webkit-text-stroke-width:1px]' : 'title-outline block text-[30px] [-webkit-text-stroke-width:1.5px]'}>
          Taberna do{compact ? ' ' : <br />}Espectro
        </b>
        {!compact && <small className="mt-2 block font-display text-[15px] tracking-[.4em] text-gold">Ponte de comando</small>}
      </span>
    </Link>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  return (
    <div className="relative min-h-screen">
      <BridgeBackground variant={pathname === '/' ? 'home' : 'page'} />

      {/* Barra do celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-black/90 px-4 py-2 backdrop-blur lg:hidden">
        <Brand compact />
        <button className="btn btn-sm" aria-expanded={open} aria-controls="drawer" onClick={() => setOpen(o => !o)}>
          {open ? 'Fechar' : 'Menu'}
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            id="drawer"
            className="fixed inset-0 z-40 flex lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <motion.aside
              className="relative w-72 max-w-[85vw] overflow-y-auto border-r border-line bg-black/95 px-6 py-6"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <Brand />
              <div className="mt-6"><SaberNav onNavigate={() => setOpen(false)} /></div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-line bg-gradient-to-r from-black/95 to-black/80 px-6 py-7 lg:flex">
          <Brand />
          <div className="mt-7"><SaberNav /></div>
          <div className="mt-auto pt-6 text-[#6b6553]"><AlienText text="taberna do espectro" size={11} /></div>
        </aside>
        <main className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <DiceTray />
      <RollPopup />
      <Toasts />
    </div>
  )
}
