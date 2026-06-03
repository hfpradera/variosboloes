import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBolaoId } from '@/lib/bolao/session'
import { LandingClient } from '@/components/landing/LandingClient'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const bolaoId = await getBolaoId()

  if (user && bolaoId) {
    // Verifica se o usuário é membro aprovado deste bolão
    const { data: membroRaw } = await supabase
      .from('bolao_membros')
      .select('aprovado')
      .eq('bolao_id', bolaoId)
      .eq('user_id', user.id)
      .single()

    const membro = membroRaw as { aprovado: boolean } | null
    if (membro?.aprovado) redirect('/dashboard')
  }

  type BolaoRow = { id: string; nome: string; descricao: string | null; edicoes: { nome: string } | null }

  // Busca bolões ativos com nome da edição
  const { data: boloesRaw } = await supabase
    .from('boloes')
    .select('id, nome, descricao, edicoes(nome)')
    .eq('ativo', true)
    .order('criado_em', { ascending: true })

  const boloesFormatados = ((boloesRaw ?? []) as BolaoRow[]).map((b) => ({
    id: b.id,
    nome: b.nome,
    descricao: b.descricao,
    edicao: b.edicoes?.nome ?? '',
  }))

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#0f1117' }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-5xl">⚽</div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-primary">Bolão</span>{' '}
            <span className="text-secondary">2026</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Copa do Mundo · EUA · Canadá · México
          </p>
        </div>

        {/* Lista de bolões */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Escolha seu bolão
          </p>
          <LandingClient boloes={boloesFormatados} />
        </div>

        {!user && (
          <p className="text-center text-xs text-muted-foreground">
            Selecione um bolão para entrar ou criar sua conta.
          </p>
        )}
      </div>
    </div>
  )
}
