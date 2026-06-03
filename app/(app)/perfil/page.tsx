import { createClient } from '@/lib/supabase/server'
import { User, Mail, Calendar, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { EnviarEspelhoButton } from './EnviarEspelhoButton'
import { ReportarErroButton } from './ReportarErroButton'

export const revalidate = 0

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, pagamento_confirmado, criado_em')
    .eq('id', user!.id)
    .single()

  const membro_desde = perfil?.criado_em
    ? new Date(perfil.criado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <User className="text-primary" size={28} />
          Meu Perfil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Suas informações de participação</p>
      </div>

      <div className="card-copa p-6 space-y-4">

        {/* Avatar / inicial */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-black text-primary">
            {perfil?.nome?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="text-xl font-bold">{perfil?.nome ?? '—'}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} />
              Membro desde {membro_desde}
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Email */}
        <div className="flex items-center gap-3">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">E-mail</div>
            <div className="text-sm font-medium">{user!.email}</div>
          </div>
        </div>

        {/* Status pagamento */}
        <div className="flex items-center gap-3">
          {perfil?.pagamento_confirmado ? (
            <CheckCircle size={16} className="text-green-400 shrink-0" />
          ) : (
            <Clock size={16} className="text-yellow-400 shrink-0" />
          )}
          <div>
            <div className="text-xs text-muted-foreground">Pagamento</div>
            {perfil?.pagamento_confirmado ? (
              <div className="text-sm font-medium text-green-400">Confirmado</div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-yellow-400">Pendente</span>
                <Link
                  href="/pagamento"
                  className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Pagar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="card-copa p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ações</h2>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Receber espelho por email</p>
          <EnviarEspelhoButton />
        </div>

        <div className="border-t border-border" />

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Encontrou algum problema no site?</p>
          <ReportarErroButton />
        </div>
      </div>
    </div>
  )
}
