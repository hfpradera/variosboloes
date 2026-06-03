import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Trophy, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'
import { EnviarResumoBtn } from './EnviarResumoBtn'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [usuariosRes, confirmadosRes, edicaoRes] = await Promise.all([
    supabase.from('perfis').select('id', { count: 'exact', head: true }),
    supabase.from('perfis').select('id', { count: 'exact', head: true }).eq('pagamento_confirmado', true),
    supabase.from('edicoes').select('*').order('created_at', { ascending: false }).limit(1).single(),
  ])

  const totalUsuarios = usuariosRes.count ?? 0
  const confirmados = confirmadosRes.count ?? 0
  const edicao = edicaoRes.data

  const arrecadado = confirmados * (edicao?.valor_bolao ?? 0)
  const premio1 = arrecadado * 0.7
  const premio2 = arrecadado * 0.3

  const stats = [
    { label: 'Participantes', valor: totalUsuarios, icon: Users, cor: 'text-blue-400' },
    { label: 'Pagamentos', valor: confirmados, icon: Target, cor: 'text-green-400' },
    { label: 'Arrecadado', valor: `R$ ${arrecadado.toFixed(2).replace('.', ',')}`, icon: DollarSign, cor: 'text-secondary' },
    { label: '1º Prêmio', valor: `R$ ${premio1.toFixed(2).replace('.', ',')}`, icon: Trophy, cor: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Dashboard Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {edicao?.nome ?? 'Copa do Mundo 2026'} · {edicao?.status}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, valor, icon: Icon, cor }) => (
          <div key={label} className="card-copa p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon size={20} className={cor} />
            </div>
            <div className={`text-2xl font-black ${cor}`}>{valor}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/resultados" className="card-copa p-5 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold mb-1">Inserir Resultados</h3>
          <p className="text-sm text-muted-foreground">Registre os resultados dos grupos e confrontos do mata-mata.</p>
        </Link>
        <Link href="/admin/usuarios" className="card-copa p-5 hover:border-primary/50 transition-colors">
          <h3 className="font-semibold mb-1">Gerenciar Usuários</h3>
          <p className="text-sm text-muted-foreground">Confirme pagamentos, bloqueie participantes ou veja apostas.</p>
        </Link>
      </div>

      <EnviarResumoBtn />
    </div>
  )
}
