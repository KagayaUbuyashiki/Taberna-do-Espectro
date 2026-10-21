# Mapas em pixel art

O mapa tático aceita cenários desenhados em pixel art, com camadas animadas, luz que pulsa e dados
de jogo (paredes, cobertura, terreno difícil, posições de início). Nenhum mapa está pronto ainda:
este guia e o modelo `arte-pixel/mapa-modelo.px.js` são o ponto de partida.

## Como o site lê um mapa

```
public/assets/mapas-px/
  indice.json            ["hangar", "cantina-mos-eisley", ...]   (só os mapas prontos)
  hangar/
    mapa.json            o que está abaixo
    chao.png             camadas (PNG ou WebP)
    agua.png
    luz.png
```

O `indice.json` lista os ids. Sem ele o site continua com os cenários de sempre. Cada mapa listado
aparece no seletor **Cenário** da página Mapas, no grupo "Mapas em pixel art". Escolher um mapa
ajusta colunas e linhas, troca as paredes pelas do mapa e limpa a névoa. "Trazer combatentes" e
"Trazer heróis" usam as posições de início do mapa.

## O `mapa.json`

```json
{
  "versao": 1,
  "nome": "Hangar com canal",
  "px": 20,
  "colunas": 12,
  "linhas": 8,
  "camadas": [
    { "id": "chao", "img": "chao.png" },
    { "id": "agua", "img": "agua.png", "quadros": 4, "ms": 250 },
    { "id": "luz", "img": "luz.png", "acima": true, "mistura": "screen", "pulso": { "ms": 2400, "min": 0.35, "max": 0.8 } }
  ],
  "paredes": ["0,1,12,1"],
  "cobertura": { "cobertura": ["3,4", "8,3"], "melhorada": [] },
  "terrenoDificil": ["0,6", "1,6"],
  "inicio": { "herois": ["1,3", "1,4"], "inimigos": ["10,4", "10,5"] },
  "creditos": "Arte original"
}
```

| Campo | O que é |
|---|---|
| `px` | Pixels da arte por quadrado. **Use 20**: o quadrado do site tem 40 pixels de tela, então cada pixel da arte vira 2×2, igual às miniaturas dos inimigos e aos efeitos de combate. |
| `colunas`, `linhas` | Tamanho da grade (até 60 × 40). Cada quadrado vale 1,5 m. |
| `camadas` | Desenhadas na ordem da lista. **Toda camada tem o tamanho do mapa inteiro** (`colunas × px` por `linhas × px`). |
| `quadros`, `ms` | Camada animada: os quadros ficam lado a lado na imagem (uma tira `quadros` vezes mais larga). `ms` por quadro, padrão 150. |
| `acima` | Desenhada por cima das fichas: telhados, copas de árvore, fumaça, luz. |
| `mistura` | Modo do canvas. Luz: `screen` ou `lighter`. Sombra: `multiply`. |
| `opacidade`, `pulso` | Opacidade fixa, ou luz que vai de `min` a `max` e volta em `ms`. |
| `paredes` | Mesmo formato da ferramenta Parede: `"x1,y1,x2,y2"` nos cantos da grade. Bloqueiam a régua e a visão como as paredes desenhadas à mão. |
| `cobertura` | Quadrados (`"x,y"`, começando em 0) que dão **cobertura (+5 Reflexo)** ou **cobertura melhorada (+10)** a quem está neles. O ataque à distância soma isso sozinho na defesa do alvo. |
| `terrenoDificil` | Quadrados que custam 2 de movimento (aparecem pontilhados para o mestre). |
| `inicio` | Onde as fichas entram ao trazer heróis e inimigos. |

O site confere tudo ao carregar: coordenada fora do mapa, camada que não é PNG/WebP e camada do
tamanho errado aparecem no console do navegador ("Mapas em pixel art com problema").

## Desenhando com o pxl

O modelo `arte-pixel/mapa-modelo.px.js` usa o [pxl](https://github.com/augusto-scarvalho/claude-pxl)
(pixel art como código, MIT), o mesmo das miniaturas dos inimigos (`arte-pixel/inimigos.px.js`).
Ele já tem as três camadas típicas: o chão (`scene`), a água animada (`anim`, sai como tira) e a
luz (`scene` que o `mapa.json` mistura com `screen`).

1. Copie o modelo: `arte-pixel/mapas/<id>.px.js`, e o JSON: `arte-pixel/mapa-modelo.json`.
2. Ajuste `COLS` e `ROWS` e desenhe. Mantenha a grade na cabeça: um quadrado = 20 pixels.
3. Gere: `node <pasta-do-pxl>/bin/pxl.js build arte-pixel/mapas/<id>.px.js --out /tmp/<id>`.
   Confira as prévias em `/tmp/<id>/_preview/`.
4. Copie `scenes/*.png` e `anims/*.png` para `public/assets/mapas-px/<id>/`, ponha o `mapa.json`
   e acrescente o id no `indice.json`.
5. `npm run dev`, página Mapas, escolha o mapa em Cenário.

Dá para desenhar no Aseprite, no LibreSprite ou no Piskel também: o site só quer as PNG no tamanho
certo e o `mapa.json`.

## Dicas de arte

- Paleta curta e escura, como o resto do site; o dourado (`#ffd24a`) fica para luz e destaque.
- Desenhe a cobertura (caixotes, muretas, destroços) no próprio chão e marque os quadrados no JSON:
  o mestre vê um escudo pequeno no canto de cada um.
- O que passa por cima das fichas (marquise, galhos, vapor) vai numa camada `acima`.
- Animação sutil: 4 quadros a 200–300 ms. Água, tela de computador, fogo, letreiro.
