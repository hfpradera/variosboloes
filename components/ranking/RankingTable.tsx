'use client'

import { useState } from 'react'
import { Share2, Medal } from 'lucide-react'
import { cn, formatarPontos } from '@/lib/utils'

interface RankingRow {
  pontos_total: number
  pontos_grupos: number
  pontos_oitavas: number
  pontos_quartas: number
  pontos_semifinal: number
  pontos_final: number
  pontos_artilheiro: number
  acertos_total: number
  perfis: { id: string; nome: string; avatar_url: string | null } | null
}

const medalhas = ['🥇', '🥈', '🥉']

export function RankingTable({ ranking }: { ranking: RankingRow[] }) {
  const [expandido, setExpandido] = useState<string | null>(null)

  function compartilharWhatsApp() {
    const top3 = ranking.slice(0, 3).map((r, i) =>
      `${medalhas[i]} ${r.perfis?.nome ?? '?'} — ${r.pontos_total} pts`
    ).join('\n')

    const texto = `🏆 *Bolão Copa 2026 — Ranking*\n\n${top3}\n\nVeja o ranking completo!`
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-3">
      {/* Botão compartilhar */}
      <div className="flex justify-end">
        <button
          onClick={compartilharWhatsApp}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
        >
          <Share2 size={16} />
          Compartilhar no WhatsApp
        </button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_5rem_5rem] sm:grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <span>#</span>
        <span>Participante</span>
        <span className="text-right">Total</span>
        <span className="text-right">Acertos</span>
        <span className="hidden sm:block text-right">Grupos</span>
        <span className="hidden sm:block text-right">Mata-mata</span>
      </div>

      {/* Linhas */}
      {ranking.map((row, i) => {
        const id = row.perfis?.id ?? i.toString()
        const aberto = expandido === id
        const posicao = i + 1
        const mataMata = row.pontos_oitavas + row.pontos_quartas + row.pontos_semifinal + row.pontos_final

        return (
          <div key={id}>
            <button
              onClick={() => setExpandido(aberto ? null : id)}
              className={cn(
                'w-full grid grid-cols-[2rem_1fr_5rem_5rem] sm:grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem] gap-2 items-center px-4 py-3 rounded-xl transition-colors text-left',
                posicao === 1 ? 'bg-secondary/10 border border-secondary/30' :
                posicao === 2 ? 'bg-muted/60 border border-border' :
                posicao === 3 ? 'bg-muted/40 border border-border' :
                'card-copa hover:bg-muted/50',
              )}
            >
              {/* Posição */}
              <span className="text-sm font-bold text-center">
                {posicao <= 3 ? medalhas[posicao - 1] : posicao}
              </span>

              {/* Nome */}
              <span className="font-medium text-sm truncate">
                {row.perfis?.nome ?? 'Participante'}
              </span>

              {/* Total */}
              <span className={cn(
                'text-right font-black text-base',
                posicao === 1 ? 'text-secondary' : 'text-foreground'
              )}>
                {formatarPontos(row.pontos_total)}
              </span>

              {/* Acertos */}
              <span className="text-right text-sm text-muted-foreground">
                {row.acertos_total}
              </span>

              {/* Grupos (desktop) */}
              <span className="hidden sm:block text-right text-sm text-muted-foreground">
                {row.pontos_grupos}
              </span>

              {/* Mata-mata (desktop) */}
              <span className="hidden sm:block text-right text-sm text-muted-foreground">
                {mataMata}
              </span>
            </button>

            {/* Detalhe expandido */}
            {aberto && (
              <div className="mx-4 mb-2 p-3 rounded-b-xl bg-muted text-xs grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: 'Grupos', valor: row.pontos_grupos },
                  { label: 'Oitavas', valor: row.pontos_oitavas },
                  { label: 'Quartas', valor: row.pontos_quartas },
                  { label: 'Semifinal', valor: row.pontos_semifinal },
                  { label: 'Final', valor: row.pontos_final },
                  { label: 'Artilheiro', valor: row.pontos_artilheiro },
                ].map(({ label, valor }) => (
                  <div key={label} className="text-center">
                    <div className="font-bold text-foreground">{valor}</div>
                    <div className="text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {ranking.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Medal size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma pontuação registrada ainda.</p>
        </div>
      )}
    </div>
  )
}
