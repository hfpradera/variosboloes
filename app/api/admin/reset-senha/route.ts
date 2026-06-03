import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarResetSenha } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  user_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: perfil } = await admin.from('perfis').select('is_admin').eq('id', user.id).single()
  if (!perfil?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(parsed.data.user_id)
  if (userError || !targetUser.user.email) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const { origin } = new URL(request.url)
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: targetUser.user.email,
    options: { redirectTo: `${origin}/update-password` },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 })
  }

  void enviarResetSenha({
    para: targetUser.user.email,
    link: data.properties.action_link,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
