import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Placeholder } from './pages/Placeholder'
import { NAV } from './nav'

// HashRouter: funciona no GitHub Pages sem configuração de servidor.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {NAV.map(n => (
            <Route key={n.path} path={n.path} element={<Placeholder title={n.label} />} />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  )
}
