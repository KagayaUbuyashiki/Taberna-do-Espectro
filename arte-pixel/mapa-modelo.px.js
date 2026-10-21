// MODELO de mapa em pixel art para o mapa tático (não é um mapa do jogo: é o ponto de partida).
// Copie este arquivo para arte-pixel/mapas/<id>.px.js, troque o desenho e gere com
//   node <pasta-do-pxl>/bin/pxl.js build arte-pixel/mapas/<id>.px.js --out /tmp/<id>
// Depois copie as PNG para public/assets/mapas-px/<id>/ e escreva o mapa.json (docs/MAPAS-PIXEL.md).
//
// Regras do site: 1 quadrado da grade = PX pixels da arte (20 é o padrão: casa com as miniaturas e os efeitos); toda camada tem o
// tamanho do mapa inteiro; uma camada animada é uma tira com os quadros lado a lado.
const PX = 20, COLS = 12, ROWS = 8
const W = COLS * PX, H = ROWS * PX

pal({
  k: "#08080c", K: "#15151c", d: "#24242e", D: "#363642", m: "#4c4c5a", M: "#6c6c7a", S: "#9a9aa6",
  b: "#3a2414", B: "#5a3d22", o: "#8b6a3e", O: "#b08a52",
  e: "#0f3a4a", c: "#1f6a7a", C: "#6fd3ff", w: "#d8f6ff",
  y: "#ffd24a", Y: "#fff3a8",
})
ramps("kKdDmMS", "bBoO", "ecCw", "yY")

// ------------------------------------------------------------------ chão (camada de baixo)
scene("chao", { w: W, h: H, bg: "d" }, (c) => {
  // placas de metal, uma por quadrado, com a junta escura
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const x = i * PX, y = j * PX
    c.rect(x, y, PX, PX, (i + j) % 2 ? "D" : "d")
    c.hline(x, y, PX, "K"); c.vline(x, y, PX, "K")
    c.px(x + 2, y + 2, "m"); c.px(x + PX - 3, y + 2, "m"); c.px(x + 2, y + PX - 3, "m"); c.px(x + PX - 3, y + PX - 3, "m")
  }
  c.noise(0, 0, W, H, "Km", 0.04, 7, "dD")
  // parede de cima (bate com a parede "0,1,12,1" do mapa.json)
  c.rect(0, 0, W, PX, "K"); c.hline(0, PX - 1, W, "m")
  // caixotes: cobertura nos quadrados 3,4 e 8,3 (cobertura.cobertura no mapa.json)
  for (const [i, j] of [[3, 4], [8, 3]]) {
    const x = i * PX + 2, y = j * PX + 2
    c.rect(x, y, PX - 4, PX - 4, "o"); c.box(x, y, PX - 4, PX - 4, "b")
    c.line(x, y, x + PX - 5, y + PX - 5, "B"); c.hline(x + 1, y + 1, PX - 6, "O")
  }
})

// ------------------------------------------------------------------ água animada (tira de 4 quadros)
anim("agua", { w: W, h: H, frames: 4, fps: 4 }, (c) => {
  const f = c.frame
  // canal de água nas duas últimas linhas da esquerda (terreno difícil no mapa.json)
  c.rect(0, 6 * PX, 4 * PX, 2 * PX, "e")
  for (let x = 0; x < 4 * PX; x += 6) c.hline(x + ((f * 2 + x) % 5), 6 * PX + 3 + ((x / 6 + f) % 3) * 8, 3, "c")
  c.px(5 + f * 9, 6 * PX + 10, "C")
})

// ------------------------------------------------------------------ luz (camada de cima, "screen", pulsa)
scene("luz", { w: W, h: H }, (c) => {
  c.circ(10 * PX, 2 * PX, 12, "e")
  c.circ(10 * PX, 2 * PX, 6, "c")
})
