import Image from 'next/image'
import { urlBandeira } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BandeiraProps {
  codigoISO: string
  nome: string
  tamanho?: 'sm' | 'md' | 'lg'
  className?: string
}

const tamanhos = {
  sm: { w: 20, h: 15, css: 'w-5 h-[15px]' },
  md: { w: 32, h: 24, css: 'w-8 h-6' },
  lg: { w: 48, h: 36, css: 'w-12 h-9' },
}

export function Bandeira({ codigoISO, nome, tamanho = 'md', className }: BandeiraProps) {
  const { w, h, css } = tamanhos[tamanho]
  return (
    <Image
      src={urlBandeira(codigoISO, tamanho === 'sm' ? '20x15' : tamanho === 'lg' ? '80x60' : '48x36')}
      alt={`Bandeira ${nome}`}
      width={w}
      height={h}
      className={cn(css, 'object-cover rounded-sm shadow-sm', className)}
      unoptimized
    />
  )
}
