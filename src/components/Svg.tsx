/** Mostra uma string SVG gerada pelo próprio site (arte original, nunca conteúdo de usuário). */
export function Svg({ html, className }: { html: string; className?: string }) {
  return <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
}
