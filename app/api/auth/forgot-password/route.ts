import { createAdminClient } from '@/lib/supabase/admin'
import { enviarResetSenha } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })

  const { origin } = new URL(request.url)
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: parsed.data.email,
    options: { redirectTo: `${origin}/update-password` },
  })

  // Sempre retorna ok para não revelar se o e-mail existe
  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ ok: true })
  }

  void enviarResetSenha({
    para: parsed.data.email,
    link: data.properties.action_link,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
