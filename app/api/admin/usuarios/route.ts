import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarAprovacaoUsuario } from '@/lib/email'

const schema = z.object({
  user_id: z.string().uuid(),
  campo: z.enum(['pagamento_confirmado', 'bloqueado', 'aprovado']),
  valor: z.boolean(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: perfil } = await admin.from('perfis').select('is_admin').eq('id', user.id).single()
  if (!perfil?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { user_id, campo, valor } = parsed.data

  const { error } = await admin
    .from('perfis')
    .update({ [campo]: valor, atualizado_em: new Date().toISOString() })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })

  // Enviar email de aprovação ao usuário
  if (campo === 'aprovado' && valor === true) {
    void (async () => {
      try {
        const [{ data: p }, { data: { users } }] = await Promise.all([
          admin.from('perfis').select('nome').eq('id', user_id).single() as any,
          admin.auth.admin.listUsers({ perPage: 1000 }),
        ])
        const authUser = users.find((u: any) => u.id === user_id)
        if (authUser?.email) {
          await enviarAprovacaoUsuario({
            para: authUser.email,
            nomeUsuario: (p as any)?.nome ?? authUser.email.split('@')[0],
          })
        }
      } catch { /* não bloquear */ }
    })()
  }

  return NextResponse.json({ ok: true })
}
