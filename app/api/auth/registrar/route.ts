import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  })

  if (error) {
    if (error.message.includes('already') || error.message.includes('registered')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data.user) {
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 })
  }

  // Tentar auto-aprovar via admin client (se disponível)
  try {
    const admin = createAdminClient()
    const { data: preAprovado } = await admin
      .from('emails_pre_aprovados')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (preAprovado) {
      await admin.from('perfis').update({ aprovado: true }).eq('id', data.user.id)
    }
  } catch {
    // Admin client indisponível — ignora, usuário aguarda aprovação manual
  }

  return NextResponse.json({ ok: true })
}
