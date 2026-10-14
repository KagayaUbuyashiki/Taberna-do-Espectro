export function Placeholder({ title }: { title: string }) {
  return (
    <section className="border-l-4 border-blood bg-panel p-8">
      <h1 className="font-display text-5xl font-extrabold uppercase">{title}</h1>
      <p className="mt-3 text-ash">Em construção.</p>
    </section>
  )
}
