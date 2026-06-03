import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2).max(60),
  email: z.string().email(),
  senha: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { nome, email, senha } = parsed.data
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already registered')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userId = data.user.id

  // Auto-aprovar se email estiver na lista de pré-aprovados
  const { data: preAprovado } = await admin
    .from('emails_pre_aprovados')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (preAprovado) {
    await admin.from('perfis').update({ aprovado: true }).eq('id', userId)
  }

  return NextResponse.json({ ok: true })
}
