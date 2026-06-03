'use client'

import { useState, useTransition } from 'react'
import { Plus, Users, CheckCircle, XCircle, Loader2, Shield, Ban, CreditCard, Layers } from 'lucide-react'

interface Bolao {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  criado_em: string
  edicao_id: string
  edicao_nome: string
}

interface Edicao { id: string; nome: string }

interface Membro {
  user_id: string
  is_admin: boolean
  aprovado: boolean
  pagamento_confirmado: boolean
  bloqueado: boolean
  criado_em: string
  perfis: { nome: string } | null
}

export function BolaoManager({ boloes: inicial, edicoes }: { boloes: Bolao[]; edicoes: Edicao[] }) {
  const [boloes, setBoloes] = useState(inicial)
  const [bolaoSelecionado, setBolaoSelecionado] = useState<Bolao | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [carregandoMembros, setCarregandoMembros] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Criar novo bolão
  const [novoNome, setNovoNome] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [novaEdicao, setNovaEdicao] = useState(edicoes[0]?.id ?? '')
  const [criando, startCriar] = useTransition()
  const [erroCriar, setErroCriar] = useState('')

  async function criarBolao() {
    if (!novoNome.trim()) { setErroCriar('Nome obrigatório'); return }
    setErroCriar('')
    startCriar(async () => {
      const res = await fetch('/api/admin/boloes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'criar', nome: novoNome, descricao: novaDesc || undefined, edicao_id: novaEdicao }),
      })
      const data = await res.json()
      if (res.ok) {
        setNovoNome(''); setNovaDesc('')
        // Recarregar página simplificado
        window.location.reload()
      } else {
        setErroCriar(data.error ?? 'Erro ao criar')
      }
    })
  }

  async function carregarMembros(bolao: Bolao) {
    setBolaoSelecionado(bolao)
    setCarregandoMembros(true)
    const res = await fetch(`/api/admin/boloes?bolao_id=${bolao.id}`)
    const data = await res.json()
    setMembros(data.membros ?? [])
    setCarregandoMembros(false)
  }

  async function acaoMembro(acao: string, userId: string, valor: boolean) {
    const bolaoId = bolaoSelecionado!.id
    setPendingId(userId + acao)
    const res = await fetch('/api/admin/boloes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, bolao_id: bolaoId, user_id: userId, ...(
        acao === 'aprovar' ? { aprovado: valor } :
        acao === 'bloquear' ? { bloqueado: valor } :
        acao === 'pagamento' ? { confirmado: valor } :
        acao === 'admin_bolao' ? { is_admin: valor } : {}
      )}),
    })
    setPendingId(null)
    if (res.ok) await carregarMembros(bolaoSelecionado!)
  }

  const pendentes = membros.filter(m => !m.aprovado && !m.bloqueado)
  const aprovados = membros.filter(m => m.aprovado && !m.bloqueado)
  const bloqueados = membros.filter(m => m.bloqueado)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Coluna esquerda: lista de bolões + criar */}
      <div className="space-y-4">

        {/* Criar bolão */}
        <div className="card-copa p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Plus size={16} /> Criar Bolão</h2>
          <input
            type="text"
            placeholder="Nome do bolão (ex: Família 2026)"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={novaDesc}
            onChange={e => setNovaDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={novaEdicao}
            onChange={e => setNovaEdicao(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {edicoes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
          {erroCriar && <p className="text-red-400 text-xs">{erroCriar}</p>}
          <button
            onClick={criarBolao}
            disabled={criando}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {criando && <Loader2 size={14} className="animate-spin" />}
            Criar Bolão
          </button>
        </div>

        {/* Lista de bolões */}
        <div className="space-y-2">
          {boloes.map(bolao => (
            <button
              key={bolao.id}
              onClick={() => carregarMembros(bolao)}
              className={`w-full text-left card-copa p-4 flex items-center gap-3 hover:border-primary/40 transition-colors ${
                bolaoSelecionado?.id === bolao.id ? 'border-primary/60 bg-primary/5' : ''
              }`}
            >
              <Layers size={16} className={bolao.ativo ? 'text-green-400' : 'text-muted-foreground'} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{bolao.nome}</div>
                <div className="text-xs text-muted-foreground">{bolao.edicao_nome}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${bolao.ativo ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {bolao.ativo ? 'ativo' : 'inativo'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Coluna direita: membros do bolão selecionado */}
      <div className="lg:col-span-2">
        {!bolaoSelecionado ? (
          <div className="card-copa p-12 text-center text-muted-foreground">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p>Selecione um bolão para ver seus membros</p>
          </div>
        ) : carregandoMembros ? (
          <div className="card-copa p-12 text-center">
            <Loader2 size={24} className="animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">{bolaoSelecionado.nome}</h2>
              <span className="text-sm text-muted-foreground">{membros.length} membros</span>
            </div>

            {/* Pendentes */}
            {pendentes.length > 0 && (
              <div className="card-copa p-5 space-y-3">
                <h3 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
                  <Loader2 size={14} /> Aguardando aprovação ({pendentes.length})
                </h3>
                {pendentes.map(m => (
                  <MemberRow key={m.user_id} m={m} pendingId={pendingId} onAcao={acaoMembro} />
                ))}
              </div>
            )}

            {/* Aprovados */}
            {aprovados.length > 0 && (
              <div className="card-copa p-5 space-y-3">
                <h3 className="font-bold text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle size={14} /> Aprovados ({aprovados.length})
                </h3>
                {aprovados.map(m => (
                  <MemberRow key={m.user_id} m={m} pendingId={pendingId} onAcao={acaoMembro} />
                ))}
              </div>
            )}

            {/* Bloqueados */}
            {bloqueados.length > 0 && (
              <div className="card-copa p-5 space-y-3 opacity-60">
                <h3 className="font-bold text-sm text-red-400 flex items-center gap-2">
                  <Ban size={14} /> Bloqueados ({bloqueados.length})
                </h3>
                {bloqueados.map(m => (
                  <MemberRow key={m.user_id} m={m} pendingId={pendingId} onAcao={acaoMembro} />
                ))}
              </div>
            )}

            {membros.length === 0 && (
              <div className="card-copa p-8 text-center text-muted-foreground">
                Nenhum membro ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MemberRow({ m, pendingId, onAcao }: {
  m: Membro
  pendingId: string | null
  onAcao: (acao: string, userId: string, valor: boolean) => void
}) {
  const nome = m.perfis?.nome ?? 'Usuário'
  const isLoading = (acao: string) => pendingId === m.user_id + acao

  return (
    <div className="flex items-center gap-3 py-2 border-t border-border first:border-0 first:pt-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm flex items-center gap-2">
          {nome}
          {m.is_admin && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">admin</span>}
          {m.pagamento_confirmado && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">pago</span>}
        </div>
        <div className="text-xs text-muted-foreground">{new Date(m.criado_em).toLocaleDateString('pt-BR')}</div>
      </div>

      <div className="flex gap-1">
        {/* Aprovar / Reprovar */}
        {!m.bloqueado && (
          <button
            onClick={() => onAcao('aprovar', m.user_id, !m.aprovado)}
            disabled={!!pendingId}
            title={m.aprovado ? 'Reprovar' : 'Aprovar'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              m.aprovado
                ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                : 'bg-muted text-muted-foreground hover:bg-green-500/20 hover:text-green-400'
            }`}
          >
            {isLoading('aprovar') ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
          </button>
        )}

        {/* Pagamento */}
        {m.aprovado && (
          <button
            onClick={() => onAcao('pagamento', m.user_id, !m.pagamento_confirmado)}
            disabled={!!pendingId}
            title={m.pagamento_confirmado ? 'Cancelar pagamento' : 'Confirmar pagamento'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              m.pagamento_confirmado
                ? 'bg-green-500/20 text-green-400'
                : 'bg-muted text-muted-foreground hover:bg-green-500/20 hover:text-green-400'
            }`}
          >
            {isLoading('pagamento') ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
          </button>
        )}

        {/* Admin do bolão */}
        {m.aprovado && (
          <button
            onClick={() => onAcao('admin_bolao', m.user_id, !m.is_admin)}
            disabled={!!pendingId}
            title={m.is_admin ? 'Remover admin' : 'Tornar admin'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              m.is_admin
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
            }`}
          >
            {isLoading('admin_bolao') ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
          </button>
        )}

        {/* Bloquear */}
        <button
          onClick={() => onAcao('bloquear', m.user_id, !m.bloqueado)}
          disabled={!!pendingId}
          title={m.bloqueado ? 'Desbloquear' : 'Bloquear'}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            m.bloqueado
              ? 'bg-red-500/20 text-red-400'
              : 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-400'
          }`}
        >
          {isLoading('bloquear') ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
        </button>
      </div>
    </div>
  )
}
