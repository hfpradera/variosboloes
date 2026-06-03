import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarRelatoErro } from '@/lib/email'

const schema = z.object({
  mensagem: z.string().min(3).max(1000),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { data: perfil } = await supabase
    .from('perfis').select('nome').eq('id', user.id).single() as any

  await enviarRelatoErro({
    nomeUsuario: perfil?.nome ?? user.email!.split('@')[0],
    emailUsuario: user.email!,
    mensagem: parsed.data.mensagem,
    timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  })

  return NextResponse.json({ ok: true })
}
