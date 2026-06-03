'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Loader2, AlertTriangle, ChevronDown, ArrowRight, Unlock } from 'lucide-react'
import { urlBandeira } from '@/lib/utils'
import Image from 'next/image'

type Selecao = { id: string; nome: string; codigo_iso: string }
type Confronto = {
  id: string
  posicao: number
  vencedor_id: string | null
  placar_a: number | null
  placar_b: number | null
  selecao_a: Selecao | null
  selecao_b: Selecao | null
  vencedor: Selecao | null
}
type Fase = {
  id: string
  nome: string
  inicio_em: string | null
  prazo_apostas_em: string | null
  apostas_liberadas: boolean
  confrontos: Confronto[]
}

const FASE_LABELS: Record<string, string> = {
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semifinal: 'Semifinal',
  final: 'Final',
}

const PROXIMA_FASE: Record<string, string> = {
  oitavas: 'quartas',
  quartas: 'semifinal',
  semifinal: 'final',
}

interface Props {
  edicaoId: string
  fases: Fase[]
  selecoes: Selecao[]
}

export function FasesManager({ edicaoId, fases, selecoes }: Props) {
  if (fases.length === 0) {
    return (
      <div className="card-copa p-8 text-center text-muted-foreground">
        Nenhuma fase criada ainda. Conclua os grupos e gere as oitavas na página de{' '}
        <strong className="text-foreground">Grupos</strong>.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {fases.map(fase => (
        <FaseSection
          key={fase.id}
          fase={fase}
          selecoes={selecoes}
          temProxima={!!PROXIMA_FASE[fase.nome]}
          proximaJaExiste={fases.some(f => f.nome === PROXIMA_FASE[fase.nome])}
        />
      ))}
    </div>
  )
}

function FaseSection({
  fase,
  selecoes,
  temProxima,
  proximaJaExiste,
}: {
  fase: Fase
  selecoes: Selecao[]
  temProxima: boolean
  proximaJaExiste: boolean
}) {
  const totalComResultado = fase.confrontos.filter(c => c.vencedor_id).length
  const totalConfrots = fase.confrontos.length
  const faseConcluida = totalComResultado === totalConfrots && totalConfrots > 0

  const [gerandoProxima, startGerar] = useTransition()
  const [liberando, startLiberar] = useTransition()
  const [erroGerar, setErroGerar] = useState('')
  const [okGerar, setOkGerar] = useState('')

  async function gerarProxima() {
    setErroGerar(''); setOkGerar('')
    startGerar(async () => {
      const res = await fetch('/api/admin/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'gerar_proxima', fase_id: fase.id }),
      })
      const data = await res.json()
      if (data.ok) {
        setOkGerar(`Fase "${PROXIMA_FASE[fase.nome]}" criada com ${data.confrontos} confrontos! Recarregue a página.`)
      } else {
        setErroGerar(data.error ?? 'Erro ao gerar')
      }
    })
  }

  async function liberarApostas() {
    startLiberar(async () => {
      await fetch('/api/admin/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'liberar_apostas', fase_id: fase.id }),
      })
      window.location.reload()
    })
  }

  return (
    <div className="card-copa overflow-hidden">
      {/* Header da fase */}
      <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-black text-xl">{FASE_LABELS[fase.nome] ?? fase.nome}</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {totalComResultado}/{totalConfrots} resultados inseridos
            {fase.prazo_apostas_em && (
              <> · Prazo: {new Date(fase.prazo_apostas_em).toLocaleString('pt-BR')}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!fase.apostas_liberadas && (
            <button
              onClick={liberarApostas}
              disabled={liberando}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Unlock size={13} />
              Revelar apostas
            </button>
          )}
          {fase.apostas_liberadas && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle size={13} /> Apostas reveladas
            </span>
          )}
        </div>
      </div>

      {/* Lista de confrontos */}
      <div className="divide-y divide-border">
        {fase.confrontos.map(confronto => (
          <ConfrontoRow key={confronto.id} confronto={confronto} selecoes={selecoes} />
        ))}
      </div>

      {/* Gerar próxima fase */}
      {temProxima && (
        <div className="p-4 border-t border-border bg-muted/30">
          {proximaJaExiste ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle size={13} className="text-green-400" />
              Fase seguinte ({PROXIMA_FASE[fase.nome]}) já foi gerada.
            </p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={gerarProxima}
                disabled={!faseConcluida || gerandoProxima}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {gerandoProxima ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                Gerar {PROXIMA_FASE[fase.nome]}
              </button>
              {!faseConcluida && (
                <p className="text-xs text-muted-foreground">
                  Complete todos os {totalConfrots} resultados antes de avançar.
                </p>
              )}
              {erroGerar && <p className="text-red-400 text-xs">{erroGerar}</p>}
              {okGerar && <p className="text-green-400 text-xs">{okGerar}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConfrontoRow({ confronto, selecoes }: { confronto: Confronto; selecoes: Selecao[] }) {
  const [vencedorId, setVencedorId] = useState(confronto.vencedor_id ?? '')
  const [placarA, setPlacarA] = useState(confronto.placar_a?.toString() ?? '')
  const [placarB, setPlacarB] = useState(confronto.placar_b?.toString() ?? '')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  // Modos: sem times → admin seleciona times
  const [selecaoAId, setSelecaoAId] = useState(confronto.selecao_a?.id ?? '')
  const [selecaoBId, setSelecaoBId] = useState(confronto.selecao_b?.id ?? '')
  const [updatingTimes, startTimes] = useTransition()
  const [okTimes, setOkTimes] = useState(false)

  const semTimes = !confronto.selecao_a && !confronto.selecao_b

  async function atualizarTimes() {
    if (!selecaoAId || !selecaoBId) return
    setOkTimes(false)
    startTimes(async () => {
      const res = await fetch('/api/admin/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'atualizar_times', confronto_id: confronto.id, selecao_a_id: selecaoAId, selecao_b_id: selecaoBId }),
      })
      if (res.ok) { setOkTimes(true); window.location.reload() }
    })
  }

  async function salvar() {
    if (!vencedorId) { setErro('Selecione o vencedor'); return }
    setErro(''); setSalvo(false)
    start(async () => {
      const res = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'confronto',
          confronto_id: confronto.id,
          vencedor_id: vencedorId,
          placar_a: placarA ? parseInt(placarA) : undefined,
          placar_b: placarB ? parseInt(placarB) : undefined,
        }),
      })
      if (res.ok) {
        setSalvo(true)
        setTimeout(() => setSalvo(false), 3000)
      } else {
        const d = await res.json()
        setErro(d.error ?? 'Erro')
      }
    })
  }

  const timesDoConfrontoParaVencedor = [
    confronto.selecao_a,
    confronto.selecao_b,
  ].filter(Boolean) as Selecao[]

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs w-6">#{confronto.posicao}</span>

        {semTimes ? (
          /* Confronto de melhor 3º — preencher times */
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertTriangle size={12} /> Melhor 3º — defina os times
            </p>
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <SelectInline value={selecaoAId} onChange={setSelecaoAId} selecoes={selecoes} label="Time A" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <SelectInline value={selecaoBId} onChange={setSelecaoBId} selecoes={selecoes} label="Time B" />
              </div>
              <button
                onClick={atualizarTimes}
                disabled={!selecaoAId || !selecaoBId || updatingTimes}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                {updatingTimes ? <Loader2 size={12} className="animate-spin" /> : 'Salvar times'}
              </button>
            </div>
          </div>
        ) : (
          /* Confronto normal */
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <TeamChip selecao={confronto.selecao_a} />
            <span className="text-muted-foreground text-xs">vs</span>
            <TeamChip selecao={confronto.selecao_b} />

            {confronto.vencedor && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={12} />
                {confronto.vencedor.nome}
              </span>
            )}
          </div>
        )}
      </div>

      {!semTimes && (
        <div className="flex gap-2 items-end flex-wrap pl-8">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-muted-foreground mb-1">Vencedor</label>
            <div className="relative">
              <select
                value={vencedorId}
                onChange={e => setVencedorId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— selecione —</option>
                {timesDoConfrontoParaVencedor.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="w-16">
            <label className="block text-xs text-muted-foreground mb-1">Pl. A</label>
            <input type="number" min="0" value={placarA} onChange={e => setPlacarA(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="w-16">
            <label className="block text-xs text-muted-foreground mb-1">Pl. B</label>
            <input type="number" min="0" value={placarB} onChange={e => setPlacarB(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button
            onClick={salvar}
            disabled={saving}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : 'Salvar'}
          </button>
          {erro && <p className="text-red-400 text-xs w-full">{erro}</p>}
          {salvo && <p className="text-green-400 text-xs w-full flex items-center gap-1"><CheckCircle size={11} /> Salvo!</p>}
        </div>
      )}
    </div>
  )
}

function TeamChip({ selecao }: { selecao: Selecao | null }) {
  if (!selecao) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Image src={urlBandeira(selecao.codigo_iso)} alt={selecao.nome} width={18} height={14} className="rounded-sm" />
      {selecao.nome}
    </div>
  )
}

function SelectInline({ value, onChange, selecoes, label }: { value: string; onChange: (v: string) => void; selecoes: Selecao[]; label: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 pr-6 rounded-lg border border-border bg-background text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">— {label} —</option>
        {selecoes.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-2 text-muted-foreground pointer-events-none" />
    </div>
  )
}
