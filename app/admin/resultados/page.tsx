'use client'

import { useState, useEffect, useTransition } from 'react'
import { CheckCircle, Loader2, Trophy, Shield, Star, RefreshCw } from 'lucide-react'

type Selecao = { id: string; nome: string }
type ResultadoGrupo = { primeiro_id?: string; segundo_id?: string; terceiro_id?: string; terceiro_classificou?: boolean }
type Grupo = { id: string; nome: string; selecoes: Selecao[]; resultado?: ResultadoGrupo | null }
type Confronto = { id: string; posicao: number; selecao_a: Selecao; selecao_b: Selecao; vencedor_id?: string | null; placar_a?: number | null; placar_b?: number | null }
type Fase = { id: string; nome: string; display: string; confrontos: Confronto[] }
type Dados = { edicao: { id: string; nome: string }; grupos: Grupo[]; fases: Fase[]; especiais: Record<string, string> }

const inputClass = 'w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary'

export default function ResultadosAdminPage() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [loading, setLoading] = useState(true)
  const [erroGlobal, setErroGlobal] = useState('')

  const recarregar = () => {
    setLoading(true)
    fetch('/api/admin/resultados')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false) })
      .catch(() => { setErroGlobal('Erro ao carregar dados'); setLoading(false) })
  }

  useEffect(() => { recarregar() }, [])

  if (loading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-12 justify-center">
      <Loader2 size={16} className="animate-spin" /> Carregando dados...
    </div>
  )

  if (erroGlobal || !dados) return (
    <div className="text-red-400 text-sm py-8 text-center">
      {erroGlobal || 'Nenhuma edição ativa encontrada.'}
    </div>
  )

  const gruposComResultado = dados.grupos.filter(g => g.resultado?.primeiro_id).length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Inserir Resultados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A pontuação de todos os participantes é recalculada automaticamente ao salvar.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Edição: <strong className="text-foreground">{dados.edicao.nome}</strong>
            {' · '}{gruposComResultado}/{dados.grupos.length} grupos com resultado
          </p>
        </div>
        <button onClick={recarregar} className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* ── Fase de Grupos ── */}
      <section className="space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Trophy size={18} className="text-primary" />
          Fase de Grupos
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Selecione quais seleções ficaram em 1º, 2º e 3º em cada grupo. Marque se o 3º avançou como melhor terceiro.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dados.grupos.map(grupo => (
            <GrupoCard key={grupo.id} grupo={grupo} onSalvo={recarregar} />
          ))}
        </div>
      </section>

      {/* ── Mata-mata ── */}
      {dados.fases.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Mata-mata
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Clique no nome do vencedor de cada confronto e preencha o placar (opcional).
          </p>
          {dados.fases.map(fase => (
            <FaseSection key={fase.id} fase={fase} onSalvo={recarregar} />
          ))}
        </section>
      )}

      {/* ── Pré-Copa ── */}
      <section className="space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Star size={18} className="text-secondary" />
          Resultados Pré-Copa
        </h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Preencha apenas o que já foi definido. Pode salvar parcialmente e complementar depois.
        </p>
        <EspeciaisForm edicaoId={dados.edicao.id} inicial={dados.especiais} onSalvo={recarregar} />
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Grupo Card
// ─────────────────────────────────────────────────────────────

function GrupoCard({ grupo, onSalvo }: { grupo: Grupo; onSalvo: () => void }) {
  const r = grupo.resultado
  const [primeiro, setPrimeiro] = useState(r?.primeiro_id ?? '')
  const [segundo, setSegundo] = useState(r?.segundo_id ?? '')
  const [terceiro, setTerceiro] = useState(r?.terceiro_id ?? '')
  const [tercClassificou, setTercClassificou] = useState(r?.terceiro_classificou ?? false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  function salvar() {
    setErro(''); setSalvo(false)
    if (!primeiro || !segundo || !terceiro) { setErro('Selecione os 3 colocados.'); return }
    if (new Set([primeiro, segundo, terceiro]).size !== 3) { setErro('Os times devem ser diferentes.'); return }
    start(async () => {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'grupo',
          grupo_id: grupo.id,
          primeiro_id: primeiro,
          segundo_id: segundo,
          terceiro_id: terceiro,
          terceiro_classificou: tercClassificou,
        }),
      })
      if (res.ok) { setSalvo(true); setTimeout(() => setSalvo(false), 3000); onSalvo() }
      else { const d = await res.json(); setErro(d.error ?? 'Erro ao salvar') }
    })
  }

  const temResultado = !!r?.primeiro_id
  const opts = grupo.selecoes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)

  return (
    <div className={`card-copa p-4 space-y-3 ${temResultado ? 'border-green-500/30' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">Grupo {grupo.nome}</span>
        {temResultado && <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle size={12} /> Salvo</span>}
      </div>

      <div className="space-y-2">
        {([
          { label: '🥇 1º lugar', val: primeiro, set: setPrimeiro },
          { label: '🥈 2º lugar', val: segundo, set: setSegundo },
          { label: '🥉 3º lugar', val: terceiro, set: setTerceiro },
        ] as const).map(({ label, val, set }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
            <select value={val} onChange={e => (set as (v: string) => void)(e.target.value)} className={inputClass}>
              <option value="">— selecionar —</option>
              {opts}
            </select>
          </div>
        ))}

        {terceiro && (
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={tercClassificou}
              onChange={e => setTercClassificou(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs text-muted-foreground">3º avançou como melhor terceiro</span>
          </label>
        )}
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}
      {salvo && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> Resultado salvo!</p>}

      <button onClick={salvar} disabled={saving}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />}
        Salvar Grupo {grupo.nome}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Fase Section + Confronto Card
// ─────────────────────────────────────────────────────────────

function FaseSection({ fase, onSalvo }: { fase: Fase; onSalvo: () => void }) {
  const total = fase.confrontos.length
  const comResultado = fase.confrontos.filter(c => c.vencedor_id).length

  return (
    <div className="card-copa p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{fase.display}</h3>
        <span className="text-xs text-muted-foreground">{comResultado}/{total} com resultado</span>
      </div>
      {fase.confrontos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum confronto cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {fase.confrontos.map(c => (
            <ConfrontoCard key={c.id} confronto={c} onSalvo={onSalvo} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConfrontoCard({ confronto: c, onSalvo }: { confronto: Confronto; onSalvo: () => void }) {
  const [vencedor, setVencedor] = useState(c.vencedor_id ?? '')
  const [placarA, setPlacarA] = useState(c.placar_a?.toString() ?? '')
  const [placarB, setPlacarB] = useState(c.placar_b?.toString() ?? '')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  function salvar() {
    setErro(''); setSalvo(false)
    if (!vencedor) { setErro('Selecione o vencedor.'); return }
    start(async () => {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'confronto',
          confronto_id: c.id,
          vencedor_id: vencedor,
          placar_a: placarA !== '' ? parseInt(placarA) : undefined,
          placar_b: placarB !== '' ? parseInt(placarB) : undefined,
        }),
      })
      if (res.ok) { setSalvo(true); setTimeout(() => setSalvo(false), 3000); onSalvo() }
      else { const d = await res.json(); setErro(d.error ?? 'Erro') }
    })
  }

  const temResultado = !!c.vencedor_id
  const numInput = 'w-14 px-2 py-1.5 rounded-lg border border-border bg-muted text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${temResultado ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground w-12 shrink-0">Jogo {c.posicao}</span>

        {/* Time A */}
        <button
          onClick={() => setVencedor(c.selecao_a.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${vencedor === c.selecao_a.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/60'}`}
        >
          {c.selecao_a.nome}
        </button>

        {/* Placar */}
        <div className="flex items-center gap-1">
          <input value={placarA} onChange={e => setPlacarA(e.target.value)} type="number" min="0" placeholder="0" className={numInput} />
          <span className="text-muted-foreground text-xs px-0.5">×</span>
          <input value={placarB} onChange={e => setPlacarB(e.target.value)} type="number" min="0" placeholder="0" className={numInput} />
        </div>

        {/* Time B */}
        <button
          onClick={() => setVencedor(c.selecao_b.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${vencedor === c.selecao_b.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/60'}`}
        >
          {c.selecao_b.nome}
        </button>

        <button onClick={salvar} disabled={saving || !vencedor}
          className="ml-auto px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1 shrink-0">
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Salvar
        </button>
      </div>

      {erro && <p className="text-red-400 text-xs">{erro}</p>}
      {salvo && <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> Salvo!</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Especiais Form
// ─────────────────────────────────────────────────────────────

function EspeciaisForm({ edicaoId, inicial, onSalvo }: { edicaoId: string; inicial: Record<string, string>; onSalvo: () => void }) {
  const [artilheiro, setArtilheiro] = useState(inicial.jogador_nome ?? '')
  const [craque, setCraque] = useState(inicial.craque_nome ?? '')
  const [goleiro, setGoleiro] = useState(inicial.goleiro_nome ?? '')
  const [campea, setCampea] = useState(inicial.campea_nome ?? '')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  function salvar() {
    setErro(''); setSalvo(false)
    start(async () => {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'artilheiro',
          edicao_id: edicaoId,
          jogador_nome: artilheiro.trim() || undefined,
          craque_nome: craque.trim() || undefined,
          goleiro_nome: goleiro.trim() || undefined,
          campea_nome: campea.trim() || undefined,
        }),
      })
      if (res.ok) { setSalvo(true); setTimeout(() => setSalvo(false), 3000); onSalvo() }
      else { const d = await res.json(); setErro(d.error ?? 'Erro ao salvar') }
    })
  }

  const campos = [
    { label: '⚽ Artilheiro da Copa', placeholder: 'Nome do jogador', val: artilheiro, set: setArtilheiro },
    { label: '🌟 Craque da Copa', placeholder: 'Nome do jogador (Bola de Ouro)', val: craque, set: setCraque },
    { label: '🧤 Melhor Goleiro', placeholder: 'Nome do goleiro (Luva de Ouro)', val: goleiro, set: setGoleiro },
    { label: '🏆 Seleção Campeã', placeholder: 'Nome da seleção', val: campea, set: setCampea },
  ]

  return (
    <div className="card-copa p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {campos.map(({ label, placeholder, val, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium mb-1">{label}</label>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      {erro && <p className="text-red-400 text-sm">{erro}</p>}
      {salvo && (
        <p className="text-green-400 text-sm flex items-center gap-1.5">
          <CheckCircle size={15} /> Salvo e pontuação recalculada!
        </p>
      )}
      <button onClick={salvar} disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Salvar Resultados Pré-Copa
      </button>
    </div>
  )
}
