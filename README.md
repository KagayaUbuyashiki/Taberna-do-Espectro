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
- `public/brand/`: logo.
