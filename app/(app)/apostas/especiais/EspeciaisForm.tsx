'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { CheckCircle, Loader2, Star, Shield, Zap, Trophy, ChevronDown } from 'lucide-react'

interface Aposta {
  jogador_nome: string | null
  craque_nome: string | null
  goleiro_nome: string | null
  campea_nome: string | null
}

interface Props {
  edicaoId: string
  aposta: Aposta | null
  prazoEncerrado: boolean
  selecoes: string[]
}

function SelectSelecao({
  value,
  onChange,
  disabled,
  placeholder,
  selecoes,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  placeholder: string
  selecoes: string[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = selecoes.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  function select(nome: string) {
    onChange(nome)
    setQuery(nome)
    setOpen(false)
  }

  const inputClass = `w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground
    placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary
    disabled:opacity-50 disabled:cursor-not-allowed`

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="off"
      />
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {filtered.map(nome => (
            <li
              key={nome}
              onMouseDown={() => select(nome)}
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors ${
                nome === value ? 'text-primary font-semibold' : 'text-foreground'
              }`}
            >
              {nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function EspeciaisForm({ edicaoId, aposta, prazoEncerrado, selecoes }: Props) {
  const [artilheiro, setArtilheiro] = useState(aposta?.jogador_nome ?? '')
  const [craque, setCraque] = useState(aposta?.craque_nome ?? '')
  const [goleiro, setGoleiro] = useState(aposta?.goleiro_nome ?? '')
  const [campea, setCampea] = useState(aposta?.campea_nome ?? '')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  async function salvar() {
    if (!artilheiro && !craque && !goleiro && !campea) {
      setErro('Preencha ao menos um campo')
      return
    }
    setErro(''); setSalvo(false)
    start(async () => {
      const res = await fetch('/api/apostas/especiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edicao_id: edicaoId,
          jogador_nome: artilheiro || undefined,
          craque_nome: craque || undefined,
          goleiro_nome: goleiro || undefined,
          campea_nome: campea || undefined,
        }),
      })
      if (res.ok) {
        setSalvo(true)
        setTimeout(() => setSalvo(false), 4000)
      } else {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao salvar')
      }
    })
  }

  const inputClass = `w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground
    placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary
    disabled:opacity-50 disabled:cursor-not-allowed`

  return (
    <div className="space-y-4">
      <div className="card-copa p-6 space-y-5">

        {/* Artilheiro */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Zap size={16} className="text-secondary" />
            Artilheiro da Copa
          </label>
          <p className="text-xs text-muted-foreground">Jogador com mais gols no torneio</p>
          <input
            value={artilheiro}
            onChange={e => setArtilheiro(e.target.value)}
            disabled={prazoEncerrado}
            placeholder="Ex: Kylian Mbappé"
            className={inputClass}
          />
        </div>

        {/* Craque */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Star size={16} className="text-secondary" />
            Craque da Copa
          </label>
          <p className="text-xs text-muted-foreground">Melhor jogador do torneio (Bola de Ouro)</p>
          <input
            value={craque}
            onChange={e => setCraque(e.target.value)}
            disabled={prazoEncerrado}
            placeholder="Ex: Vinicius Jr."
            className={inputClass}
          />
        </div>

        {/* Goleiro */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Shield size={16} className="text-secondary" />
            Melhor Goleiro
          </label>
          <p className="text-xs text-muted-foreground">Luva de Ouro da Copa</p>
          <input
            value={goleiro}
            onChange={e => setGoleiro(e.target.value)}
            disabled={prazoEncerrado}
            placeholder="Ex: Alisson Becker"
            className={inputClass}
          />
        </div>

        {/* Seleção Campeã */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Trophy size={16} className="text-secondary" />
            Seleção Campeã
          </label>
          <p className="text-xs text-muted-foreground">País que vai vencer a Copa do Mundo 2026</p>
          <SelectSelecao
            value={campea}
            onChange={setCampea}
            disabled={prazoEncerrado}
            placeholder="Digite ou escolha a seleção..."
            selecoes={selecoes}
          />
        </div>

        {erro && <p className="text-red-400 text-sm">{erro}</p>}
        {salvo && (
          <p className="text-green-400 text-sm flex items-center gap-1">
            <CheckCircle size={14} /> Apostas salvas com sucesso!
          </p>
        )}

        {!prazoEncerrado && (
          <button
            onClick={salvar}
            disabled={saving}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar Apostas
          </button>
        )}
      </div>

      {/* Resumo de pontuação */}
      <div className="card-copa p-4">
        <div className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wide">
          Pontuação
        </div>
        <div className="space-y-2 text-sm">
          {[
            { label: 'Artilheiro da Copa', pts: 10, icon: <Zap size={14} className="text-secondary" /> },
            { label: 'Craque da Copa', pts: 10, icon: <Star size={14} className="text-secondary" /> },
            { label: 'Melhor Goleiro', pts: 10, icon: <Shield size={14} className="text-secondary" /> },
            { label: 'Seleção Campeã', pts: 10, icon: <Trophy size={14} className="text-secondary" /> },
          ].map(({ label, pts, icon }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
              <span className="font-bold text-secondary">+{pts} pts</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Máximo possível</span>
            <span className="text-secondary">40 pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}
