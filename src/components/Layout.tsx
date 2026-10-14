import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { NAV } from '../nav'

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-blood bg-void/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <img src="./brand/logo-256.png" alt="" className="h-11 w-11" />
            <span className="font-display text-2xl font-extrabold uppercase leading-none tracking-[.12em]">
              Taberna do Espectro
              <small className="mt-1 block text-[11px] font-semibold tracking-[.5em] text-ember">RPG · Edição Saga</small>
            </span>
          </NavLink>
          <nav aria-label="Seções" className="-mx-1 flex basis-full gap-1 overflow-x-auto lg:ml-auto lg:basis-auto">
            {NAV.map(n => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.path === '/'}
                className={({ isActive }) => clsx(
                  'shrink-0 px-3 py-2 font-display text-sm font-semibold uppercase tracking-[.2em] transition-colors',
                  isActive ? 'bg-blood text-bone' : 'text-ash hover:text-bone',
                )}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
