'use client'

import { useState, useTransition } from 'react'
import { Bandeira } from '@/components/bandeiras/Bandeira'
import { CheckCircle, Lock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Selecao {
  id: string
  nome: string
  codigo_iso: string
}

interface ApostaAtual {
  selecao_vencedor_id: string
  placar_a: number | null
  placar_b: number | null
}

interface ConfrontoCardProps {
  confronto: {
    id: string
    posicao: number
    selecao_a: Selecao
    selecao_b: Selecao
    apostaAtual: ApostaAtual | null
  }
  fase: string
  prazoEncerrado: boolean
}

export function ConfrontoCard({ confronto, fase, prazoEncerrado }: ConfrontoCardProps) {
  const [vencedor, setVencedor] = useState(confronto.apostaAtual?.selecao_vencedor_id ?? '')
  const [placarA, setPlacarA] = useState(confronto.apostaAtual?.placar_a?.toString() ?? '')
  const [placarB, setPlacarB] = useState(confronto.apostaAtual?.placar_b?.toString() ?? '')
  const [salvo, setSalvo] = useState(!!confronto.apostaAtual)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  const isFinal = fase === 'final'
  const podeApostar = !prazoEncerrado

  async function salvar(novoVencedor: string) {
    if (!podeApostar) return
    setErro('')

    start(async () => {
      const res = await fetch('/api/apostas/confrontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confronto_id: confronto.id,
          selecao_vencedor_id: novoVencedor,
          ...(isFinal && placarA !== '' && placarB !== ''
            ? { placar_a: parseInt(placarA), placar_b: parseInt(placarB) }
            : {}),
        }),
      })
      if (res.ok) {
        setSalvo(true)
      } else {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao salvar')
      }
    })
  }

  async function salvarPlacar() {
    if (!vencedor || !podeApostar) return
    setErro('')
    start(async () => {
      const res = await fetch('/api/apostas/confrontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confronto_id: confronto.id,
          selecao_vencedor_id: vencedor,
          placar_a: placarA !== '' ? parseInt(placarA) : undefined,
          placar_b: placarB !== '' ? parseInt(placarB) : undefined,
        }),
      })
      if (res.ok) {
        setSalvo(true)
      } else {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao salvar')
      }
    })
  }

  function selecionarTime(id: string) {
    if (!podeApostar) return
    setVencedor(id)
    setSalvo(false)
    if (!isFinal) salvar(id)
  }

  const { selecao_a, selecao_b } = confronto

  return (
    <div className={cn('card-copa p-4 space-y-3', prazoEncerrado && 'opacity-75')}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Jogo {confronto.posicao}</span>
        {prazoEncerrado ? (
          <span className="flex items-center gap-1"><Lock size={11} /> Encerrado</span>
        ) : salvo ? (
          <span className="flex items-center gap-1 text-green-400"><CheckCircle size={11} /> Salvo</span>
        ) : null}
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-2">
        {[selecao_a, selecao_b].map((selecao, idx) => {
          const selecionado = vencedor === selecao.id
          return (
            <button
              key={selecao.id}
              onClick={() => selecionarTime(selecao.id)}
              disabled={!podeApostar || saving}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium',
                selecionado
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground',
                (!podeApostar || saving) && 'cursor-not-allowed'
              )}
            >
              <Bandeira codigoISO={selecao.codigo_iso} nome={selecao.nome} tamanho="md" />
              <span className="text-xs text-center leading-tight">{selecao.nome}</span>
              {selecionado && (
                <span className="text-xs text-primary font-bold">✓ Escolhido</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Placar (apenas final) */}
      {isFinal && vencedor && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground font-medium">Placar final (incluindo prorrogação) · +10 pts</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={placarA}
              onChange={e => { setPlacarA(e.target.value); setSalvo(false) }}
              disabled={!podeApostar}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <span className="text-muted-foreground font-bold text-sm shrink-0">×</span>
            <input
              type="number"
              min={0}
              value={placarB}
              onChange={e => { setPlacarB(e.target.value); setSalvo(false) }}
              disabled={!podeApostar}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          {podeApostar && (
            <button
              onClick={salvarPlacar}
              disabled={saving}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Salvar aposta
            </button>
          )}
        </div>
      )}

      {saving && !isFinal && (
        <div className="flex justify-center">
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {erro && <p className="text-red-400 text-xs">{erro}</p>}
    </div>
  )
}
