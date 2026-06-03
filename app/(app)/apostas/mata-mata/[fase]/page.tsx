import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConfrontoCard } from '@/components/apostas/ConfrontoCard'
import { Shield, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const FASE_INFO: Record<string, { nome: string; pts: number }> = {
  oitavas:   { nome: '16 Avos de Final', pts: 10 },
  quartas:   { nome: 'Oitavas de Final', pts: 15 },
  semifinal: { nome: 'Quartas de Final', pts: 20 },
  semi:      { nome: 'Semifinais',       pts: 25 },
  final:     { nome: 'Final',            pts: 30 },
}

export const revalidate = 0

interface Props {
  params: Promise<{ fase: string }>
}

export default async function MataMataFasePage({ params }: Props) {
  const { fase: faseParam } = await params

  if (!FASE_INFO[faseParam]) notFound()

  const info = FASE_INFO[faseParam]
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: edicao } = await supabase
    .from('edicoes')
    .select('id')
    .in('status', ['aberto', 'em_andamento'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  if (!edicao) notFound()

  const { data: fase } = await supabase
    .from('fases')
    .select('id, apostas_liberadas, prazo_apostas_em')
    .eq('edicao_id', edicao.id)
    .eq('nome', faseParam)
    .single() as any

  if (!fase || !fase.apostas_liberadas) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="text-primary" size={28} />
            {info.nome}
          </h1>
        </div>
        <div className="card-copa p-8 text-center space-y-3">
          <Lock size={32} className="mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">As apostas para esta fase ainda não foram liberadas.</p>
          <Link href="/apostas/mata-mata" className="text-sm text-primary hover:underline">
            ← Voltar ao mata-mata
          </Link>
        </div>
      </div>
    )
  }

  const agora = new Date()
  const prazoEncerrado = fase.prazo_apostas_em ? new Date(fase.prazo_apostas_em) <= agora : false

  // Buscar confrontos com seleções
  const { data: confrontosRaw } = await supabase
    .from('confrontos')
    .select(`
      id, posicao,
      selecao_a:selecao_a_id ( id, nome, codigo_iso ),
      selecao_b:selecao_b_id ( id, nome, codigo_iso )
    `)
    .eq('fase_id', fase.id)
    .order('posicao') as any

  const confrontos = (confrontosRaw ?? []).filter(
    (c: any) => c.selecao_a && c.selecao_b
  )

  if (confrontos.length === 0) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="text-primary" size={28} />
            {info.nome}
          </h1>
        </div>
        <div className="card-copa p-8 text-center space-y-3">
          <p className="text-muted-foreground">Os confrontos desta fase ainda não foram definidos.</p>
          <Link href="/apostas/mata-mata" className="text-sm text-primary hover:underline">
            ← Voltar ao mata-mata
          </Link>
        </div>
      </div>
    )
  }

  // Buscar apostas existentes do usuário
  const confrontoIds = confrontos.map((c: any) => c.id)
  const { data: apostasRaw } = await supabase
    .from('apostas_confrontos')
    .select('confronto_id, selecao_vencedor_id, placar_a, placar_b')
    .eq('user_id', user!.id)
    .in('confronto_id', confrontoIds) as any

  const apostasMap = new Map(
    (apostasRaw ?? []).map((a: any) => [a.confronto_id, a])
  )

  const apostados = confrontos.filter((c: any) => apostasMap.has(c.id)).length
  const total = confrontos.length

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/apostas/mata-mata" className="text-xs text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Mata-mata
          </Link>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="text-primary" size={28} />
            {info.nome}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {info.pts} pts por acerto
            {faseParam === 'final' && ' · +10 pts por placar exato'}
          </p>
        </div>
        {fase.prazo_apostas_em && (
          <div className={`text-xs px-3 py-2 rounded-lg ${prazoEncerrado ? 'bg-muted text-muted-foreground' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {prazoEncerrado ? 'Prazo encerrado' : `Prazo: ${new Date(fase.prazo_apostas_em).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            })}`}
          </div>
        )}
      </div>

      {/* Progresso */}
      <div className="card-copa p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Apostas feitas</span>
            <span className="font-semibold">{apostados}/{total}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${total > 0 ? (apostados / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        {apostados === total ? (
          <CheckCircle size={20} className="text-green-500 shrink-0" />
        ) : (
          <AlertCircle size={20} className="text-yellow-500 shrink-0" />
        )}
      </div>

      {prazoEncerrado && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
          <Lock size={16} />
          Prazo encerrado. Suas apostas foram registradas.
        </div>
      )}

      {/* Grid de confrontos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {confrontos.map((c: any) => (
          <ConfrontoCard
            key={c.id}
            confronto={{
              id: c.id,
              posicao: c.posicao,
              selecao_a: c.selecao_a,
              selecao_b: c.selecao_b,
              apostaAtual: apostasMap.get(c.id) ?? null,
            }}
            fase={faseParam}
            prazoEncerrado={prazoEncerrado}
          />
        ))}
      </div>
    </div>
  )
}
