import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Placeholder } from './pages/Placeholder'
import { NAV } from './nav'
import Ambiente from './pages/Ambiente'
import Nave from './pages/Nave'
import Mestre from './pages/Mestre'
import { iniciarSync } from './store/galaxy'

const PAGES: Partial<Record<string, React.ReactNode>> = { '/ambiente': <Ambiente />, '/nave': <Nave />, '/mestre': <Mestre /> }

// HashRouter: funciona no GitHub Pages sem configuração de servidor.
export default function App() {
  // Mesa ao vivo: mudanças do mestre chegam na hora aos jogadores.
  useEffect(iniciarSync, [])
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {NAV.map(n => (
            <Route key={n.path} path={n.path} element={PAGES[n.path] ?? <Placeholder title={n.label} />} />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  )
}
