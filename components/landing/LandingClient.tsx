'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2, ChevronRight, CheckCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Bolao {
  id: string
  nome: string
  descricao: string | null
  edicao: string
}

export function LandingClient({ boloes }: { boloes: Bolao[] }) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [fase, setFase] = useState<'escolha' | 'auth' | 'aguardando' | 'entrando'>('escolha')
  const [pending, start] = useTransition()
  const [erro, setErro] = useState('')

  // Fase 1 — usuário clica num bolão
  async function selecionarBolao(bolaoId: string) {
    setSelecionado(bolaoId)
    setErro('')

    // Setar cookie do bolão selecionado
    const res = await fetch('/api/bolao/selecionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bolao_id: bolaoId }),
    })
    if (!res.ok) { setErro('Erro ao selecionar bolão'); return }

    // Verificar se usuário já está logado
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirecionar para login
      router.push('/login')
      return
    }

    // Verificar status no bolão
    setFase('entrando')
    start(async () => {
      const statusRes = await fetch(`/api/bolao/entrar?bolao_id=${bolaoId}`)
      const { status } = await statusRes.json()

      if (status === 'aprovado') {
        router.push('/dashboard')
      } else if (status === 'nao_membro') {
        // Solicitar entrada
        const entrarRes = await fetch('/api/bolao/entrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bolao_id: bolaoId }),
        })
        const data = await entrarRes.json()
        if (data.status === 'aprovado' || data.status === 'ja_aprovado') {
          router.push('/dashboard')
        } else {
          setFase('aguardando')
        }
      } else if (status === 'aguardando_aprovacao') {
        setFase('aguardando')
      } else if (status === 'bloqueado') {
        setErro('Você está bloqueado neste bolão.')
        setFase('escolha')
        setSelecionado(null)
      } else {
        router.push('/dashboard')
      }
    })
  }

  const bolaoAtual = boloes.find(b => b.id === selecionado)

  // Tela de aguardando aprovação
  if (fase === 'aguardando') {
    return (
      <div className="card-copa p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
          <Lock size={28} className="text-yellow-400" />
        </div>
        <h2 className="font-black text-lg">Solicitação enviada!</h2>
        <p className="text-muted-foreground text-sm">
          Sua solicitação para entrar em <strong className="text-foreground">{bolaoAtual?.nome}</strong> foi enviada.
          Aguarde o admin aprovar sua participação.
        </p>
        <button
          onClick={() => { setFase('escolha'); setSelecionado(null) }}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Voltar à lista de bolões
        </button>
      </div>
    )
  }

  // Tela principal — lista de bolões
  return (
    <div className="space-y-3">
      {boloes.length === 0 && (
        <div className="card-copa p-8 text-center text-muted-foreground">
          <p>Nenhum bolão disponível no momento.</p>
        </div>
      )}

      {boloes.map(bolao => (
        <button
          key={bolao.id}
          onClick={() => selecionarBolao(bolao.id)}
          disabled={pending && selecionado === bolao.id}
          className={`w-full text-left card-copa p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group ${
            selecionado === bolao.id ? 'border-primary/60 bg-primary/5' : ''
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Users size={20} className="text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground">{bolao.nome}</div>
            {bolao.descricao && (
              <div className="text-sm text-muted-foreground truncate">{bolao.descricao}</div>
            )}
            <div className="text-xs text-muted-foreground mt-0.5">{bolao.edicao}</div>
          </div>

          {pending && selecionado === bolao.id ? (
            <Loader2 size={18} className="text-primary animate-spin shrink-0" />
          ) : selecionado === bolao.id && fase !== 'escolha' ? (
            <CheckCircle size={18} className="text-green-400 shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          )}
        </button>
      ))}

      {erro && (
        <p className="text-red-400 text-sm text-center">{erro}</p>
      )}

      <p className="text-center text-xs text-muted-foreground pt-2">
        Ao entrar num bolão, sua participação precisa ser aprovada pelo administrador.
      </p>
    </div>
  )
}
