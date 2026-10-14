/** Parágrafos do texto de abertura (linha em branco ou quebra separa). */
export const paragrafos = (body: string) => body.split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean)

/** Cenas de narração (imagens em public/assets/narracao/<id>.jpg). */
export const CENAS: { id: string; nome: string }[] = [
  { id: 'base-imperial', nome: 'Base imperial' },
  { id: 'cantina', nome: 'Cantina' },
  { id: 'duelo', nome: 'Duelo' },
  { id: 'emboscada', nome: 'Emboscada' },
  { id: 'hiperespaco', nome: 'Hiperespaço' },
  { id: 'interrogatorio', nome: 'Interrogatório' },
  { id: 'mercado', nome: 'Mercado' },
  { id: 'perseguicao-espacial', nome: 'Perseguição espacial' },
  { id: 'pouso', nome: 'Pouso' },
  { id: 'templo-antigo', nome: 'Templo antigo' },
]
