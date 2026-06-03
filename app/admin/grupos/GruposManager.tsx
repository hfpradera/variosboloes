'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Loader2, AlertTriangle, Trophy, ChevronDown } from 'lucide-react'
import { urlBandeira } from '@/lib/utils'
import Image from 'next/image'

type Selecao = { id: string; nome: string; codigo_iso: string }
type Resultado = { primeiro_id: string | null; segundo_id: string | null; terceiro_id: string | null; terceiro_classificou: boolean | null } | null
type Grupo = { id: string; nome: string; encerrado: boolean; selecoes: Selecao[]; resultado: Resultado }

interface Props {
  edicaoId: string
  grupos: Grupo[]
  faseOitavasId: string | null
}

export function GruposManager({ edicaoId, grupos, faseOitavasId }: Props) {
  const totalConcluidos = grupos.filter(g => g.resultado?.primeiro_id && g.resultado?.segundo_id).length

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <div className="card-copa p-4 flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">{totalConcluidos}/12 grupos concluídos</div>
          <div className="text-muted-foreground text-sm">
            {totalConcluidos === 12 ? 'Todos os grupos prontos!' : `Faltam ${12 - totalConcluidos} grupos`}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {grupos.map(g => (
            <span
              key={g.id}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-black ${
                g.resultado?.primeiro_id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-muted text-muted-foreground'
              }`}
            >
              {g.nome}
            </span>
          ))}
        </div>
      </div>

      {/* Grid de grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {grupos.map(grupo => (
          <GrupoCard key={grupo.id} grupo={grupo} />
        ))}
      </div>

      {/* Gerar Oitavas */}
      <GerarOitavasSection
        edicaoId={edicaoId}
        totalConcluidos={totalConcluidos}
        faseOitavasId={faseOitavasId}
      />
    </div>
  )
}

function GrupoCard({ grupo }: { grupo: Grupo }) {
  const [primeiroId, setPrimeiroId] = useState(grupo.resultado?.primeiro_id ?? '')
  const [segundoId, setSegundoId] = useState(grupo.resultado?.segundo_id ?? '')
  const [terceiroId, setTerceiroId] = useState(grupo.resultado?.terceiro_id ?? '')
  const [terceiroClassificou, setTerceiroClassificou] = useState(grupo.resultado?.terceiro_classificou ?? false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  async function salvar() {
    if (!primeiroId || !segundoId) { setErro('Selecione 1º e 2º colocado'); return }
    if (primeiroId === segundoId) { setErro('1º e 2º devem ser seleções diferentes'); return }
    setErro(''); setSalvo(false)

    start(async () => {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'grupo',
          grupo_id: grupo.id,
          primeiro_id: primeiroId,
          segundo_id: segundoId,
          ...(terceiroId ? { terceiro_id: terceiroId, terceiro_classificou: terceiroClassificou } : {}),
        }),
      })
      if (res.ok) {
        setSalvo(true)
        setTimeout(() => setSalvo(false), 3000)
      } else {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao salvar')
      }
    })
  }

  const isSalvoAntes = !!(grupo.resultado?.primeiro_id && grupo.resultado?.segundo_id)

  return (
    <div className={`card-copa p-5 space-y-4 ${isSalvoAntes ? 'ring-1 ring-green-500/30' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg">
          Grupo <span className="text-primary">{grupo.nome}</span>
        </h3>
        {isSalvoAntes && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle size={13} /> Salvo
          </span>
        )}
      </div>

      {/* Lista de seleções */}
      <div className="flex gap-2 flex-wrap">
        {grupo.selecoes.map(s => (
          <div key={s.id} className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded">
            <Image src={urlBandeira(s.codigo_iso)} alt={s.nome} width={16} height={12} className="rounded-sm" />
            {s.nome}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <SelectSelecao
          label="🥇 1º Colocado"
          value={primeiroId}
          onChange={setPrimeiroId}
          selecoes={grupo.selecoes}
          exclude={[segundoId, terceiroId]}
        />
        <SelectSelecao
          label="🥈 2º Colocado"
          value={segundoId}
          onChange={setSegundoId}
          selecoes={grupo.selecoes}
          exclude={[primeiroId, terceiroId]}
        />
        <SelectSelecao
          label="🥉 3º Colocado"
          value={terceiroId}
          onChange={setTerceiroId}
          selecoes={grupo.selecoes}
          exclude={[primeiroId, segundoId]}
          opcional
        />
        {terceiroId && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={terceiroClassificou}
              onChange={e => setTerceiroClassificou(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-muted-foreground">
              Este 3º foi um dos <strong className="text-foreground">8 melhores</strong> e avançou
            </span>
          </label>
        )}
      </div>

      {erro && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertTriangle size={12} /> {erro}
        </p>
      )}
      {salvo && (
        <p className="text-green-400 text-xs flex items-center gap-1">
          <CheckCircle size={12} /> Resultado salvo! Pontuação recalculada.
        </p>
      )}

      <button
        onClick={salvar}
        disabled={saving}
        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Salvar Resultado
      </button>
    </div>
  )
}

function SelectSelecao({
  label, value, onChange, selecoes, exclude, opcional,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  selecoes: Selecao[]
  exclude: string[]
  opcional?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-border bg-muted text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{opcional ? '— opcional —' : '— selecione —'}</option>
          {selecoes
            .filter(s => !exclude.filter(Boolean).includes(s.id))
            .map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))
          }
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  )
}

function GerarOitavasSection({
  edicaoId,
  totalConcluidos,
  faseOitavasId,
}: {
  edicaoId: string
  totalConcluidos: number
  faseOitavasId: string | null
}) {
  const [inicio, setInicio] = useState('')
  const [prazo, setPrazo] = useState('')
  const [resultado, setResultado] = useState<{ ok?: boolean; fase_id?: string; error?: string } | null>(null)
  const [saving, start] = useTransition()

  if (faseOitavasId) {
    return (
      <div className="card-copa p-6 flex items-center gap-3">
        <CheckCircle className="text-green-400 shrink-0" size={24} />
        <div>
          <div className="font-bold">Fase de Oitavas criada</div>
          <div className="text-muted-foreground text-sm">
            Acesse <strong>Admin → Fases</strong> para ver os confrontos e registrar vencedores.
          </div>
        </div>
      </div>
    )
  }

  async function gerarOitavas() {
    if (!inicio || !prazo) { setResultado({ error: 'Preencha início e prazo de apostas' }); return }
    setResultado(null)
    start(async () => {
      const res = await fetch('/api/admin/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'gerar_oitavas',
          edicao_id: edicaoId,
          inicio_em: new Date(inicio).toISOString(),
          prazo_apostas_em: new Date(prazo).toISOString(),
        }),
      })
      const data = await res.json()
      setResultado(data)
    })
  }

  const podeGerar = totalConcluidos === 12

  return (
    <div className={`card-copa p-6 space-y-4 ${!podeGerar ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <Trophy className="text-secondary" size={20} />
        <h2 className="font-bold text-lg">Gerar Fase de Oitavas</h2>
      </div>

      {!podeGerar && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <AlertTriangle size={16} />
          Complete todos os 12 grupos antes de gerar as oitavas.
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Cria automaticamente os 16 confrontos de oitavas. Os 12 primeiros usam os classificados dos grupos;
        os confrontos 13–16 (melhores 3ºs) ficam em aberto para você preencher na página de Resultados.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Início das Oitavas</label>
          <input
            type="datetime-local"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            disabled={!podeGerar}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Prazo das Apostas</label>
          <input
            type="datetime-local"
            value={prazo}
            onChange={e => setPrazo(e.target.value)}
            disabled={!podeGerar}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {resultado?.error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertTriangle size={14} /> {resultado.error}
        </p>
      )}
      {resultado?.ok && (
        <p className="text-green-400 text-sm flex items-center gap-1">
          <CheckCircle size={14} /> 16 confrontos criados! Recarregue a página para ver o status.
        </p>
      )}

      <button
        onClick={gerarOitavas}
        disabled={!podeGerar || saving}
        className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Gerar 16 Confrontos de Oitavas
      </button>
    </div>
  )
}
