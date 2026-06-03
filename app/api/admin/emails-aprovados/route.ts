import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: perfil } = await admin.from('perfis').select('is_admin').eq('id', user.id).single()
  return perfil?.is_admin ? admin : null
}

export async function GET() {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await admin
    .from('emails_pre_aprovados')
    .select('email, criado_em')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  return NextResponse.json(data)
}

const schemaPost = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = schemaPost.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })

  const email = parsed.data.email.toLowerCase()

  const { error } = await admin
    .from('emails_pre_aprovados')
    .upsert({ email }, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: 'Erro ao adicionar' }, { status: 500 })

  // Se o usuário já existe, aprová-lo imediatamente
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authUser = users.find(u => u.email?.toLowerCase() === email)
  if (authUser) {
    await admin.from('perfis').update({ aprovado: true }).eq('id', authUser.id)
  }

  return NextResponse.json({ ok: true })
}

const schemaDelete = z.object({
  email: z.string().email(),
})

export async function DELETE(request: Request) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = schemaDelete.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })

  const { error } = await admin
    .from('emails_pre_aprovados')
    .delete()
    .eq('email', parsed.data.email.toLowerCase())

  if (error) return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
