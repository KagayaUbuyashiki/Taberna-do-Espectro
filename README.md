# Taberna do Espectro

Mesa de RPG para **Star Wars RPG Edição Saga**: criação de personagem, fichas interativas, mesa de combate, mapas e narração.

## Tecnologias

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zustand (estado salvo no navegador)
- React Router
- Motion (animações)
- Vitest (testes das regras)

## Rodando

```bash
npm install
npm run dev     # servidor local
npm test        # testes das regras
npm run build   # gera dist/
```

## Estrutura

- `src/data/saga.ts`: tabelas do livro (espécies, classes, talentos, aptidões, armas, poderes, bestiário).
- `src/rules/`: motor de regras (Defesas, limiar, perícias, ataques, dados) com testes.
- `src/store/`: estado da campanha e das fichas.
- `src/nav.ts`: abas do site.
- `src/combate/`: o combate no mapa. Armas e alcance (Tabela 8-5), cobertura, efeitos em pixel art
  (tiro, golpe de sabre, explosão, chamas, dano, queda), miniaturas animadas dos inimigos e o painel
  de ataque usado na página Mapas, na Mesa e na ficha.
- `src/lib/sfx.ts`: sons sintetizados (blaster, sabre, explosões, quedas e o grito raro, 1 em 10 mortes).
  Dá para trocar qualquer um por arquivo: `public/assets/sfx/LEIA-ME.md`.
- `src/mapas-px/`: mapas em pixel art para o mapa tático. Guia: `docs/MAPAS-PIXEL.md`.
- `src/forja/` e `src/pages/Forja.tsx`: a figura 3D do herói, com STL para imprimir. Guia: `docs/FORJA.md`.
- `arte-pixel/`: fontes da pixel art (pxl): os inimigos e o modelo de mapa.
- `public/brand/`: logo.
