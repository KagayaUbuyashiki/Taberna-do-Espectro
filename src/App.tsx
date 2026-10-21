import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Placeholder } from './pages/Placeholder'
import { NAV } from './nav'
import Ambiente from './pages/Ambiente'
import Nave from './pages/Nave'
import Mestre from './pages/Mestre'
import Home from './pages/Home'
import Mesa from './pages/Mesa'
import Criar from './pages/Criar'
import Narracao from './pages/Narracao'
import Regras from './pages/Regras'
import Fichas from './pages/Fichas'
import Mapas from './pages/Mapas'
import { iniciarSync } from './store/galaxy'
import { vigiarQuedas } from './combate/mapa'
import { ouvirEfeitos } from './combate/efeitos'

// A Forja carrega o three.js: só baixa quando a aba é aberta.
const Forja = lazy(() => import('./pages/Forja'))
const carregando = <p className="p-6 font-display tracking-[.2em] text-ash">Carregando a forja…</p>

const PAGES: Partial<Record<string, React.ReactNode>> = { '/': <Home />, '/criar': <Criar />, '/fichas': <Fichas />, '/forja': <Suspense fallback={carregando}><Forja /></Suspense>, '/mesa': <Mesa />, '/mapas': <Mapas />, '/narracao': <Narracao />, '/regras': <Regras />, '/ambiente': <Ambiente />, '/nave': <Nave />, '/mestre': <Mestre /> }

// HashRouter: funciona no GitHub Pages sem configuração de servidor.
export default function App() {
  // Mesa ao vivo: mudanças do mestre chegam na hora aos jogadores.
  useEffect(iniciarSync, [])
  // Combate no mapa: quedas viram efeito (e às vezes o grito), e os tiros dos outros aparelhos chegam aqui.
  useEffect(() => {
    const a = vigiarQuedas(), b = ouvirEfeitos()
    return () => { a(); b() }
  }, [])
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
