import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useAsset } from '../../lib/assets'

/**
 * Mostra a imagem da lista de assets quando ela já foi enviada; senão, o `fallback` (arte provisória).
 * `holo` aplica o tom dourado de holograma (planetas e equipamento, estilo C).
 */
export function AssetImg({ path, alt = '', className, fallback, holo }: { path: string; alt?: string; className?: string; fallback?: ReactNode; holo?: boolean }) {
  const url = useAsset(path)
  if (!url) return <>{fallback ?? null}</>
  return <img src={url} alt={alt} loading="lazy" className={clsx(className, holo && 'mix-blend-screen')} />
}
