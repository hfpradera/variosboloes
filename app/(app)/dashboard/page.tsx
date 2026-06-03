import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Target, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [perfilRes, edicaoRes, pontuacaoRes] = await Promise.all([
    supabase.from('perfis').select('nome, pagamento_confirmado, is_admin').eq('id', user!.id).single(),
    supabase.from('edicoes').select('*').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('pontuacoes').select('pontos_total, pontos_grupos, pontos_oitavas, pontos_quartas, pontos_semifinal, pontos_final, acertos_total').eq('user_id', user!.id).single(),
  ])

  const perfil = perfilRes.data
  const edicao = edicaoRes.data
  const pontuacao = pontuacaoRes.data

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="gradient-copa rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-green-200 text-sm font-medium mb-1">Bem-vindo de volta</p>
            <h1 className="text-3xl font-black mb-2">
              {perfil?.nome?.split(' ')[0]} ⚽
            </h1>
            <p className="text-green-100 text-sm">
              {edicao?.nome ?? 'Copa do Mundo 2026'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-secondary">{pontuacao?.pontos_total ?? 0}</div>
            <div className="text-green-200 text-sm">pontos totais</div>
          </div>
        </div>
      </div>

      {/* Status pagamento */}
      {!perfil?.pagamento_confirmado && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Pagamento pendente.</strong> Confirme sua participação com o administrador do bolão para que suas apostas sejam computadas.
          </div>
        </div>
      )}

      {/* Cards rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/apostas/grupos" className="card-copa p-5 flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-3 rounded-xl bg-primary/10">
            <Target size={24} className="text-primary" />
          </div>
          <div>
            <div className="font-semibold">Apostas</div>
            <div className="text-sm text-muted-foreground">Fase de grupos</div>
          </div>
        </Link>

        <Link href="/ranking" className="card-copa p-5 flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-3 rounded-xl bg-secondary/10">
            <BarChart3 size={24} className="text-secondary" />
          </div>
          <div>
            <div className="font-semibold">Ranking</div>
            <div className="text-sm text-muted-foreground">Veja a classificação</div>
          </div>
        </Link>

        <Link href="/historico" className="card-copa p-5 flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Clock size={24} className="text-blue-400" />
          </div>
          <div>
            <div className="font-semibold">Histórico</div>
            <div className="text-sm text-muted-foreground">Suas apostas</div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pontos Grupos', valor: pontuacao?.pontos_grupos ?? 0, desc: 'Pontos acumulados na fase de grupos', cor: 'text-primary' },
          { label: 'Pontos Mata-mata', valor: (pontuacao?.pontos_oitavas ?? 0) + (pontuacao?.pontos_quartas ?? 0) + (pontuacao?.pontos_semifinal ?? 0) + (pontuacao?.pontos_final ?? 0), desc: 'Pontos acumulados no mata-mata', cor: 'text-secondary' },
          { label: 'Acertos', valor: pontuacao?.acertos_total ?? 0, desc: 'Total de apostas certas em todas as fases', cor: 'text-blue-400' },
          { label: 'Total', valor: pontuacao?.pontos_total ?? 0, desc: 'Soma de todos os pontos', cor: 'text-green-400' },
        ].map(({ label, valor, desc, cor }) => (
          <div key={label} className="card-copa p-4 text-center group relative">
            <div className={`text-2xl font-black ${cor}`}>{valor}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 text-xs text-center bg-card border border-border rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none">
              {desc}
            </div>
          </div>
        ))}
      </div>

      {perfil?.is_admin && (
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 p-4 rounded-xl border border-secondary/30 bg-secondary/5 text-secondary text-sm font-medium hover:bg-secondary/10 transition-colors"
        >
          <Trophy size={18} />
          Acessar Painel Administrativo
        </Link>
      )}
    </div>
  )
}
