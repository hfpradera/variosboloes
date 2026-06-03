import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST — solicitar entrada num bolão
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { bolao_id } = await request.json().catch(() => ({}))
  if (!bolao_id) {
    return NextResponse.json({ error: 'bolao_id obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar se bolão existe e está ativo
  const { data: bolao } = await (admin.from('boloes') as any)
    .select('id')
    .eq('id', bolao_id)
    .eq('ativo', true)
    .single()

  if (!bolao) {
    return NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 })
  }

  // Verificar se já é membro
  const { data: membroExistente } = await (admin.from('bolao_membros') as any)
    .select('id, aprovado, bloqueado')
    .eq('bolao_id', bolao_id)
    .eq('user_id', user.id)
    .single()

  if (membroExistente) {
    if ((membroExistente as any).bloqueado) {
      return NextResponse.json({ error: 'Você está bloqueado neste bolão' }, { status: 403 })
    }
    if ((membroExistente as any).aprovado) {
      return NextResponse.json({ ok: true, status: 'ja_aprovado' })
    }
    return NextResponse.json({ ok: true, status: 'aguardando_aprovacao' })
  }

  // Criar solicitação de entrada
  const { error } = await (admin.from('bolao_membros') as any).insert({
    bolao_id,
    user_id: user.id,
    is_admin: false,
    aprovado: false,
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao solicitar entrada' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: 'aguardando_aprovacao' })
}

// GET — verificar status do usuário num bolão
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ status: 'nao_autenticado' })
  }

  const { searchParams } = new URL(request.url)
  const bolaoId = searchParams.get('bolao_id')
  if (!bolaoId) {
    return NextResponse.json({ error: 'bolao_id obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: membro } = await (admin.from('bolao_membros') as any)
    .select('aprovado, bloqueado, is_admin, pagamento_confirmado')
    .eq('bolao_id', bolaoId)
    .eq('user_id', user.id)
    .single()

  if (!membro) return NextResponse.json({ status: 'nao_membro' })
  if ((membro as any).bloqueado) return NextResponse.json({ status: 'bloqueado' })
  if (!(membro as any).aprovado) return NextResponse.json({ status: 'aguardando_aprovacao' })

  return NextResponse.json({
    status: 'aprovado',
    is_admin: (membro as any).is_admin,
    pagamento_confirmado: (membro as any).pagamento_confirmado,
  })
}
