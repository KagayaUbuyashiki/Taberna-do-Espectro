// Inimigos do mapa tático: miniaturas vistas de frente, de pé sobre a ficha. Arte original.
// Cada um tem "parado" (4 quadros, respiração e um detalhe que pisca). O ataque, o dano e a queda
// são feitos pelo site por cima desses quadros (avanço, piscada branca, tombo).
pal({
  k: "#0b0b0d", K: "#1c1c22", d: "#2e2e36", D: "#4a4a54", m: "#6c6c78", M: "#9a9aa6", S: "#cfcfd6", W: "#fffbe8",
  w: "#efe6d2", s: "#bdb29a", v: "#8a7f68",
  B: "#3a2414", b: "#5a3d22", O: "#8b6a3e", o: "#e2a417", y: "#ffd24a", Y: "#fff3a8",
  R: "#7a0a0f", r: "#c4141c", p: "#ff6a5f",
  n: "#e8b07a", N: "#b77a4a", h: "#4a2e18", H: "#7a4e2a",
  g: "#3d4a3a", G: "#5c6b52", e: "#1f5a78", c: "#6fd3ff", C: "#d8f6ff",
  t: "#c9a96b", T: "#8f7444", u: "#5a4a2a",
  f: "#7a3a22", F: "#b0603a", x: "#6b5a7a",
})
ramps("kKdDmMSW", "vswW", "BbOoyY", "Rrp", "hHNn", "gG", "ecC", "uTt", "fF")

const OUT = { outline: "k", selout: true }
// respiração: o corpo desce 1 px nos quadros 2 e 3
const bob = (f) => (f === 1 || f === 2 ? 1 : 0)

// ------------------------------------------------------------------ Stormtrooper
sprite("_st", { mx: true }, `
  .....SSS
  ...SSWWW
  ..SWWWWW
  .SWWWWWW
  .SMMMMMM
  .SWkkWWW
  .SWkkkWW
  .SWWkkMW
  ..SmWkWM
  ..SWkMkM
  ...SWWWW
  ..KkKWWW
  .SWWkSWW
  SWWWkSWW
  SWWWkSWW
  mkkkkkkk
  .MSkWWMS
  ..kkWWWk
  ..SWWWk.
  ..SWWWk.
  .kkkkkk.`)
anim("stormtrooper", { w: 20, h: 25, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_st", 2, 2 + dy)
  // rifle E-11 na diagonal, preso pelas duas mãos
  c.grid(5, 13 + dy, `
    kk.........
    kDkk.......
    .kDDkk.....
    ..kdDDkkk..
    ...kkdDDDkk
    .....kkMkk.`)
  if (f === 3) { c.px(4, 8 + dy, "m"); c.px(15, 8 + dy, "m") }   // reflexo correndo no visor
})

// ------------------------------------------------------------------ Stormtrooper pesado: mochila e repetidora
anim("stormtrooper_pesado", { w: 22, h: 25, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.rect(2, 12 + dy, 3, 6, "D"); c.rect(17, 12 + dy, 3, 6, "D")     // mochila aparecendo dos lados
  c.stamp("_st", 3, 2 + dy)
  c.grid(1, 14 + dy, `
    .kkkkkkkkkkkkkkk...
    kDDMMMMDDDDDDDDDkkk
    kddDDDDdDkDkDkDdddk
    .kkkkkdkkk.kkkkkkk.
    .....kdk...........
    .....kkk...........`)
  if (f === 0 || f === 2) c.px(19, 15 + dy, "p")                    // luz de pronto na arma
  if (f === 3) { c.px(5, 8 + dy, "m"); c.px(16, 8 + dy, "m") }
})

// ------------------------------------------------------------------ Soldado clone: viseira em T e marcas laranja
sprite("_clone", { mx: true }, `
  .....SSS
  ...SWWWW
  ..SWWoWW
  .SWWWWoW
  .SWWWWWo
  .SkkkkkW
  .SWWWkkW
  .SWWWkkW
  ..SWWkkW
  ..SmWWWM
  ...SWWWW
  ..KkKWWW
  .SWoWSWW
  SWWoWSWW
  SWWWWSWW
  mkkkkkkk
  .MSkWWMS
  ..kkWWWk
  ..SWWoWk
  ..SWWWk.
  .kkkkkk.`)
anim("clone", { w: 20, h: 25, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_clone", 2, 2 + dy)
  c.grid(5, 13 + dy, `
    kk.........
    kDkk.......
    .kDDkk.....
    ..kdDDkkk..
    ...kkdDDDkk
    .....kkMkk.`)
  if (f === 3) { c.px(5, 8 + dy, "m"); c.px(14, 8 + dy, "m") }
})

// ------------------------------------------------------------------ Oficial imperial: quepe, farda cinza-oliva, insígnia
sprite("_oficial", { mx: true }, `
  ...gggggg
  ..gGGGGGG
  ..gGGGGGG
  ..kkkkkkk
  ...NnnnnN
  ...Nnnnnn
  ...nkknnn
  ...nnnnnn
  ....NnnNN
  .....NNnn
  ...ggGkGG
  ..gGGGGkG
  .gGGGGGkG
  .gGGGGGkG
  .nGGGGGGG
  .nkkkkkkM
  ..gGGGGGG
  ..gGGGkgg
  ..gGGGkk.
  ..kkkkkk.
  .kkkkkkk.`)
anim("oficial", { w: 20, h: 25, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_oficial", 1, 2 + dy)
  c.grid(3, 13 + dy, `
    rcr
    rcy`)                                                           // placa de patente no peito
  c.rect(15, 18 + dy, 2, 3, "k")                                     // coldre
  if (f === 3) { c.px(5, 8 + dy, "n"); c.px(6, 8 + dy, "n"); c.px(12, 8 + dy, "n"); c.px(13, 8 + dy, "n") } // piscada
})

// ------------------------------------------------------------------ Soldado rebelde: capacete bege, colete
sprite("_rebelde", { mx: true }, `
  ....vvvv
  ..vsssss
  .vsswsss
  .vssssss
  vvvvvvvv
  ..NnnnnN
  ..Nnnnnn
  ..nkknnn
  ..nnnnnn
  ...NnnNN
  ....NNnn
  ..TwwwTT
  .TttwwtT
  .TttTwtT
  .nTtTwTT
  .nkkkkkk
  ..DDDDDD
  ..DDDmDD
  ..DDDmD.
  ..kkkkk.
  .kkkkkk.`)
anim("rebelde", { w: 20, h: 25, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_rebelde", 2, 2 + dy)
  c.grid(14, 14 + dy, `
    kkkkk
    kMMDk
    .kDk.
    .kk..`)                                                          // pistola na mão
  if (f === 3) { c.px(5, 9 + dy, "n"); c.px(6, 9 + dy, "n"); c.px(11, 9 + dy, "n"); c.px(12, 9 + dy, "n") }
})

// ------------------------------------------------------------------ Bandido: capuz, lenço e vibromachado
sprite("_bandido", { mx: true }, `
  .....BBB
  ...BBbbb
  ..BbbbOb
  .BbbBBBB
  .BbBNNNN
  .BbNkpNN
  .BbNNNNN
  .BbRrrrr
  .BbRrRrr
  ..BbRRRR
  ..BbbbOb
  .BbbOObb
  BbbbOObb
  BbbbObbb
  NbbBBBBB
  NkkkkkoK
  .HHHHHHH
  .hHHHHHH
  ..hHHhH.
  ..kkkkk.
  .kkkkkk.`)
anim("bandido", { w: 21, h: 26, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_bandido", 1, 3 + dy)
  // vibromachado erguido: lâmina zumbe (brilho muda)
  c.grid(15, 1 + dy, `
    .SSS
    SMMWS
    SMMMS
    .SSk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    ..Hk.
    .NNk.`)
  c.px(17, 2 + dy, f % 2 ? "Y" : "y")
  if (f === 3) { c.px(5, 8 + dy, "N"); c.px(14, 8 + dy, "N") }     // os olhos se apertam
})

// ------------------------------------------------------------------ Dróide de batalha B1: magro, cabeça comprida
anim("b1", { w: 18, h: 26, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = f === 2 ? 1 : 0
  c.grid(5, 0 + dy, `
    ...tTT...
    ..tttTT..
    ..tkttkT.
    ..ttttTT.
    ...tttT..
    ...tttT..
    ...ttTT..
    ....tT...
    ....tT...
    ....uu...
    .ttttTTT.
    tTTttTTTu
    tu.tTT.uT
    tu.tTT.uT
    tu.uTu.uT
    Tu..T..uT
    ...uTu...
    ..tT.Tu..
    ..tT.Tu..
    ..tu.Tu..
    ..tu.Tu..
    .ttu.TTu.
    .uuu.uuu.`)
  // carabina atravessada
  c.grid(1, 13 + dy, `
    kkkkkkkk....
    kDDDDDDDkkk.
    .kkkkkdkk...
    .....kk.....`)
  if (f === 1) { c.px(7, 2 + dy, "y"); c.px(10, 2 + dy, "y") }      // olhos acendem
})

// ------------------------------------------------------------------ Droideka: tripé de bronze e escudo
anim("droideka", { w: 22, h: 24, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame
  c.grid(3, 2, `
    ......bOOb......
    .....bOooOb.....
    .....bOkkOb.....
    ......bOOb......
    ....b.bOOb.b....
    ...bO.bOOb.Ob...
    ..bOkbOooObkOb..
    ..bO..bOOb..Ob..
    ..kk..bOOb..kk..
    ..kp..bOOb..pk..
    ......bOOb......
    .....bOOOOb.....
    ....bO.bb.Ob....
    ...bO..bb..Ob...
    ..bO...bb...Ob..
    .bO....bb....Ob.
    .bb....bb....bb.
    kkk...kkkk...kkk`)
  // o escudo pisca em volta
  if (f !== 3) c.ellipse(11, 11, 10, 11, f === 1 ? "C" : "c", { stroke: true })
  if (f === 1) { c.px(9, 4, "p"); c.px(12, 4, "p") }
})

// ------------------------------------------------------------------ Wampa: pelo branco, chifres, garras
sprite("_wampa", { mx: true }, `
  .v.......
  .sv......
  ..svwwww.
  ..swwwwww
  .swwwwwww
  .swkwwwww
  .swwwsRRR
  swwwwRRWR
  swwwwRrrr
  swwwwwRRR
  swwwwwwww
  wwwwwwwww
  wwswwwwww
  wwswwwwww
  wsswwwwws
  w.swwwwws
  WSWswwwws
  S.Sswwwss
  ..swwwsss
  ..swws...
  .sswws...
  vvvvv....`)
anim("wampa", { w: 22, h: 26, frames: 4, fps: 3, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_wampa", 2, 2 + dy)
  if (f === 1 || f === 2) { c.hline(9, 11 + dy, 4, "r"); c.px(10, 12 + dy, "W") }   // boca abre: respira
})

// ------------------------------------------------------------------ Rancor: cabeçorra, presas, braços enormes
sprite("_rancor", { mx: true }, `
  .....fff..
  ...ffFFFf.
  ..fFFFFFF.
  ..fFkyFFF.
  .fFFFFFFFF
  .fFFFFFFFF
  .fRRRRRRRR
  fFRWRWRWRW
  fFRrrrrrrr
  fFRWRWRWRW
  fFFRRRRRRR
  fFFFFFFFFF
  FFfFFFFFFF
  FFffFFFFFF
  FFffFFFfFF
  WFf.fFFfFF
  WWf.fFFFFF
  W...fFFFff
  ....fFFf..
  ...ffFFf..
  ..fffff...`)
anim("rancor", { w: 24, h: 25, frames: 4, fps: 3, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_rancor", 2, 2 + dy)
  if (f === 2) { c.hline(6, 10 + dy, 12, "R"); c.hline(6, 11 + dy, 12, "r") }        // a boca abre mais
  if (f === 3) { c.px(7, 5 + dy, "F"); c.px(16, 5 + dy, "F") }                     // piscada
})

// ------------------------------------------------------------------ Genérico: figura encapuzada, olhos acesos
sprite("_generico", { mx: true }, `
  ....DDDD
  ..DDdddd
  .DdddKKK
  .DddKkkk
  .DdKkkpk
  .DdKkkkk
  .DddKkkk
  ..DddKKK
  ..Dddddd
  .DddddDd
  DdddddDd
  DdddddDd
  DddddDdd
  DdddDDdd
  DdddDddd
  DddDdddd
  DdddDddd
  .DddDddd
  .DdddDdd
  .kkkkkkk`)
anim("generico", { w: 20, h: 24, frames: 4, fps: 4, ...OUT }, (c) => {
  const f = c.frame, dy = bob(f)
  c.stamp("_generico", 2, 2 + dy)
  if (f === 3) { c.px(7, 6 + dy, "k"); c.px(12, 6 + dy, "k") }      // piscada
  else if (f === 1) { c.px(7, 6 + dy, "Y"); c.px(12, 6 + dy, "Y") }
})
