import { createClient } from '@/lib/supabase/server'
import { RankingTable } from '@/components/ranking/RankingTable'
import { Trophy, DollarSign } from 'lucide-react'
import { getBolaoId } from '@/lib/bolao/session'
import { redirect } from 'next/navigation'

export const revalidate = 60

export default async function RankingPage() {
  const supabase = await createClient()
  const bolaoId = await getBolaoId()
  if (!bolaoId) redirect('/')

  const [edicaoRes, membrosRes] = await Promise.all([
    supabase
      .from('edicoes')
      .select('id, nome, valor_bolao')
      .in('status', ['aberto', 'em_andamento', 'encerrado'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    // Membros aprovados e não bloqueados deste bolão
    supabase
      .from('bolao_membros')
      .select('user_id, pagamento_confirmado')
      .eq('bolao_id', bolaoId)
      .eq('aprovado', true)
      .eq('bloqueado', false),
  ])

  const edicao = edicaoRes.data
  if (!edicao) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Nenhuma edição ativa.</p>
      </div>
    )
  }

  type MembroBolao = { user_id: string; pagamento_confirmado: boolean }
  const membros = (membrosRes.data ?? []) as MembroBolao[]
  const confirmados = membros.filter(m => m.pagamento_confirmado).length
  const memberIds = membros.map(m => m.user_id)

  type Edicao = { id: string; nome: string; valor_bolao: number | null }
  const edicaoTyped = edicao as Edicao
  const premioTotal = confirmados * (edicaoTyped.valor_bolao ?? 0)
  const premio1 = premioTotal * 0.7
  const premio2 = premioTotal * 0.3

  // Ranking filtrado pelos membros deste bolão
  const { data: ranking } = await supabase
    .from('pontuacoes')
    .select(`
      pontos_total, pontos_grupos, pontos_oitavas, pontos_quartas,
      pontos_semifinal, pontos_final, pontos_artilheiro,
      acertos_total, acertos_final, acertos_semifinal,
      perfis ( id, nome, avatar_url )
    `)
    .eq('edicao_id', edicaoTyped.id)
    .in('user_id', memberIds.length > 0 ? memberIds : ['00000000-0000-0000-0000-000000000000'])
    .order('pontos_total', { ascending: false })
    .limit(200)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Trophy className="text-secondary" size={28} />
          Ranking Geral
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{edicaoTyped.nome}</p>
      </div>

      {/* Prêmios */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-copa p-4 text-center">
          <DollarSign size={18} className="mx-auto text-muted-foreground mb-1" />
          <div className="text-xs text-muted-foreground mb-1">Total arrecadado</div>
          <div className="text-lg font-black">{fmt(premioTotal)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{confirmados} participante{confirmados !== 1 ? 's' : ''}</div>
        </div>
        <div className="card-copa p-4 text-center border-secondary/30">
          <div className="text-2xl mb-1">🥇</div>
          <div className="text-xs text-muted-foreground mb-1">1º lugar (70%)</div>
          <div className="text-lg font-black text-secondary">{fmt(premio1)}</div>
        </div>
        <div className="card-copa p-4 text-center">
          <div className="text-2xl mb-1">🥈</div>
          <div className="text-xs text-muted-foreground mb-1">2º lugar (30%)</div>
          <div className="text-lg font-black">{fmt(premio2)}</div>
        </div>
      </div>

      <RankingTable ranking={ranking ?? []} />
    </div>
  )
}
