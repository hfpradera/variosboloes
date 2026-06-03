import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BOLAO_COOKIE } from '@/lib/bolao/session'

export async function POST(request: Request) {
  const { bolao_id } = await request.json().catch(() => ({}))

  if (!bolao_id) {
    return NextResponse.json({ error: 'bolao_id obrigatório' }, { status: 400 })
  }

  // Verificar se bolão existe e está ativo (RLS já filtra ativos)
  const supabase = await createClient()
  const { data: bolao } = await (supabase as any)
    .from('boloes')
    .select('id, nome')
    .eq('id', bolao_id)
    .eq('ativo', true)
    .single()

  if (!bolao) {
    return NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 })
  }

  const response = NextResponse.json({ ok: true, bolao })
  response.cookies.set(BOLAO_COOKIE, bolao_id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(BOLAO_COOKIE)
  return response
}
