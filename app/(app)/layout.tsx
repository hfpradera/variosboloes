import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { getBolaoId } from '@/lib/bolao/session'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const bolaoId = await getBolaoId()
  if (!bolaoId) redirect('/')

  type Perfil = { nome: string; bloqueado: boolean; is_admin: boolean }
  type Membro = { aprovado: boolean; bloqueado: boolean; pagamento_confirmado: boolean; is_admin: boolean; bolao_id: string }

  // Busca perfil global e membership no bolão em paralelo
  const [perfilRes, membroRes] = await Promise.all([
    supabase
      .from('perfis')
      .select('nome, bloqueado, is_admin')
      .eq('id', user.id)
      .single(),
    supabase
      .from('bolao_membros')
      .select('aprovado, bloqueado, pagamento_confirmado, is_admin, bolao_id')
      .eq('bolao_id', bolaoId)
      .eq('user_id', user.id)
      .single(),
  ])

  const perfil = perfilRes.data as Perfil | null
  const membro = membroRes.data as Membro | null

  if (perfil?.bloqueado) redirect('/login?error=bloqueado')

  // Não é membro deste bolão — volta para a seleção
  if (!membro) redirect('/')

  // Bloqueado no bolão
  if (membro.bloqueado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
        <div style={{ background: '#1a1d2e', borderRadius: '12px', padding: '48px 32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: '0 0 8px' }}>
            Acesso bloqueado
          </h1>
          <p style={{ color: '#a0a8c0', fontSize: '14px', lineHeight: '1.6', margin: '0 0 32px' }}>
            Você foi bloqueado neste bolão. Entre em contato com o administrador.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ background: '#1e2235', color: '#a0a8c0', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', cursor: 'pointer' }}>
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Aguardando aprovação no bolão (super-admin tem acesso imediato)
  if (!membro.aprovado && !perfil?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
        <div style={{ background: '#1a1d2e', borderRadius: '12px', padding: '48px 32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: '0 0 8px' }}>
            Aguardando aprovação
          </h1>
          <p style={{ color: '#a0a8c0', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Olá, <strong style={{ color: '#fff' }}>{perfil?.nome ?? 'participante'}</strong>! Sua solicitação para entrar no bolão está aguardando aprovação do administrador.
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 32px' }}>
            Você receberá um e-mail assim que seu acesso for liberado.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ background: '#1e2235', color: '#a0a8c0', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', cursor: 'pointer' }}>
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header nomeUsuario={perfil?.nome} />

      {!membro.pagamento_confirmado && (
        <div className="w-full bg-yellow-500/15 border-b border-yellow-500/30">
          <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-yellow-300 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                <strong>Pagamento pendente.</strong> Suas apostas só serão computadas após a confirmação.
              </span>
            </div>
            <Link
              href="/pagamento"
              className="shrink-0 text-xs font-semibold bg-yellow-500 text-black px-3 py-1.5 rounded-full hover:bg-yellow-400 transition-colors"
            >
              Pagar agora
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
