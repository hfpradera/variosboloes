'use client'

import { useState, useTransition } from 'react'
import { Bandeira } from '@/components/bandeiras/Bandeira'
import { Lock, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Selecao {
  id: string
  nome: string
  codigo_iso: string
}

interface GrupoCardProps {
  grupo: {
    id: string
    nome: string
    prazoEncerrado: boolean
    selecoes: Selecao[]
    apostaAtual: { primeiro_id: string; segundo_id: string; terceiro_id: string | null } | null
  }
  userId: string
}

export function GrupoCard({ grupo }: GrupoCardProps) {
  const [primeiro, setPrimeiro] = useState(grupo.apostaAtual?.primeiro_id ?? '')
  const [segundo, setSegundo] = useState(grupo.apostaAtual?.segundo_id ?? '')
  const [terceiro, setTerceiro] = useState(grupo.apostaAtual?.terceiro_id ?? '')
  const [salvando, startSalvar] = useTransition()
  const [salvo, setSalvo] = useState(!!(grupo.apostaAtual?.primeiro_id && grupo.apostaAtual?.segundo_id && grupo.apostaAtual?.terceiro_id))
  const [erro, setErro] = useState('')

  const podeApostar = !grupo.prazoEncerrado

  async function salvar() {
    if (!primeiro || !segundo || !terceiro) {
      setErro('Escolha o 1º, 2º e 3º colocado.')
      return
    }
    if (new Set([primeiro, segundo, terceiro]).size !== 3) {
      setErro('1º, 2º e 3º colocado devem ser seleções diferentes.')
      return
    }
    setErro('')

    startSalvar(async () => {
      const res = await fetch('/api/apostas/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo_id: grupo.id,
          primeiro_id: primeiro,
          segundo_id: segundo,
          terceiro_id: terceiro,
        }),
      })
      if (res.ok) {
        setSalvo(true)
      } else {
        const { error } = await res.json()
        setErro(error ?? 'Erro ao salvar.')
      }
    })
  }

  const selecoesDisponiveis = (excluir: string[]) =>
    grupo.selecoes.filter(s => !excluir.filter(Boolean).includes(s.id))

  return (
    <div className={cn(
      'card-copa p-5 space-y-4',
      grupo.prazoEncerrado && 'opacity-75'
    )}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Grupo {grupo.nome}</h3>
        {grupo.prazoEncerrado ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <Lock size={12} /> Encerrado
          </span>
        ) : salvo ? (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircle size={12} /> Salvo
          </span>
        ) : null}
      </div>

      {/* 1º lugar */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">🥇 1º Colocado</label>
        <select
          value={primeiro}
          onChange={e => { setPrimeiro(e.target.value); setSalvo(false) }}
          disabled={!podeApostar}
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">Escolha a seleção...</option>
          {selecoesDisponiveis([segundo, terceiro]).map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>

      {/* 2º lugar */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">🥈 2º Colocado</label>
        <select
          value={segundo}
          onChange={e => { setSegundo(e.target.value); setSalvo(false) }}
          disabled={!podeApostar}
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">Escolha a seleção...</option>
          {selecoesDisponiveis([primeiro, terceiro]).map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>

      {/* 3º lugar */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">🥉 3º Colocado</label>
        <select
          value={terceiro}
          onChange={e => { setTerceiro(e.target.value); setSalvo(false) }}
          disabled={!podeApostar}
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">Escolha a seleção...</option>
          {selecoesDisponiveis([primeiro, segundo]).map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          +5 pts se avançar como um dos 8 melhores 3ºs · +5 pts bônus se acertar a posição exata
        </p>
      </div>

      {/* Preview */}
      {(primeiro || segundo || terceiro) && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg bg-muted text-sm">
          {[primeiro, segundo, terceiro].map((id, i) => {
            const s = grupo.selecoes.find(s => s.id === id)
            if (!s) return null
            return (
              <div key={id} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">·</span>}
                <Bandeira codigoISO={s.codigo_iso} nome={s.nome} tamanho="sm" />
                <span className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>{s.nome}</span>
              </div>
            )
          })}
        </div>
      )}

      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      {podeApostar && (
        <button
          onClick={salvar}
          disabled={salvando || salvo}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {salvando && <Loader2 size={16} className="animate-spin" />}
          {salvo ? 'Aposta salva ✓' : 'Salvar aposta'}
        </button>
      )}
    </div>
  )
}
