import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarNotificacaoNovoCadastro } from '@/lib/email'

const schema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const { nome, email } = parsed.data

  void enviarNotificacaoNovoCadastro({
    nomeUsuario: nome,
    emailUsuario: email,
    timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
