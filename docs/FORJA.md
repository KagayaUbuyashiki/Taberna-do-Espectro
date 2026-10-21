# Forja: a figura 3D do herói

A aba **Forja** monta o herói em 3D, peça por peça, no estilo dos criadores de miniaturas, e baixa
o arquivo para imprimir a miniatura de mesa ou a action figure. A figura é uma estátua: não anima.
No mapa tático, a ficha do herói mostra a foto da figura; só os inimigos têm animação.

## O que dá para montar

- **Espécie** (19): humano, twi'lek, togruta, zabrak, wookiee, rodiano, mon calamari, bothan,
  cereano, duros, ewok, gamorreano, gungan, ithoriano, kel dor, quarren, sullustano, trandoshano e
  dróide. Escolher a espécie traz as proporções e as cores típicas dela.
- **Corpo**: altura, corpo (magro a forte), ombros, cabeça e pernas; cor da pele, do cabelo e dos olhos; cabelo.
- **Roupa**: túnica, jaqueta, colete, armadura ou macacão de piloto; manto, manto com capuz ou capa curta.
- **Equipamento**: em cada mão, sabre de luz, sabre duplo, pistola, rifle, vibrolâmina ou cajado; cor da lâmina.
- **Pose**: parado, em guarda, mirando, heroico, meditando, avançando.
- **Base**: redonda, hexagonal ou quadrada, com o nome em relevo.
- **Modelo próprio**: um `.glb`, `.gltf`, `.stl` ou `.obj` feito em outro programa entra no lugar
  do boneco, em cima da base. O arquivo fica no IndexedDB do navegador (a ficha guarda só o id).

**Salvar na ficha** grava a figura e uma foto 256 × 256 na ficha do personagem (`figura` em
`Character`). Figuras salvas são normalizadas ao abrir (`normalizarFigura`), então campos novos
não quebram fichas antigas.

## Imprimir

| Tamanho | Para quê |
|---|---|
| 28 mm | miniatura de mesa (escala de wargame) |
| 32 mm | escala heroica, a dos criadores de miniaturas |
| 95 mm | action figure de 3¾" |
| 150 mm | action figure de 6" |

- **STL**: uma peça só, figura e base juntas, em milímetros. As peças são sólidos que se encostam e
  se cruzam; os fatiadores juntam os volumes (no Cura, "Unir volumes sobrepostos"; no PrusaSlicer,
  o reparo do modelo). Ligue suportes: braços, armas e manto ficam no ar.
- **GLB**: a mesma figura com as cores (em metros, como pede o glTF), para ver em outro programa,
  pintar de referência ou mandar a um serviço de impressão colorida.
- A aba Imprimir mostra a altura, o diâmetro da base e a grossura da lâmina do sabre, e avisa
  quando a lâmina fica fina demais para filamento.

## Código

| Arquivo | O que faz |
|---|---|
| `src/forja/tipos.ts` | o tipo `Figura`, as opções, os padrões por espécie e a normalização |
| `src/forja/montar.ts` | monta o `THREE.Group`: corpo articulado (quadril, joelho, ombro, cotovelo), cabeças das espécies, roupa, capa, itens, poses e base. Unidade: o humano padrão tem 1,86 |
| `src/forja/importar.ts` | guarda e abre o modelo próprio (IndexedDB) e o encaixa na base |
| `src/forja/exportar.ts` | STL binário em mm e GLB |
| `src/forja/Visor.tsx` | o visor (React Three Fiber): luz, sombra, giro, enquadramento e a foto da ficha |
| `src/pages/Forja.tsx` | a página |

Para acrescentar uma espécie: o id em `ESPECIES_3D`, o nome em `NOME_ESPECIE`, as proporções em
`PADRAO_ESPECIE` e um `case` em `montarCabeca`. Para uma pose: os ângulos em `POSES` de
`montar.ts` (`frente` leva o membro para a frente, `abre` para o lado, `arma` inclina o que está na mão).
