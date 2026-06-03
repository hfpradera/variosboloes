import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  confronto_id: z.string().uuid(),
  selecao_vencedor_id: z.string().uuid(),
  placar_a: z.number().int().min(0).optional(),
  placar_b: z.number().int().min(0).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { confronto_id, selecao_vencedor_id, placar_a, placar_b } = parsed.data

  const { data: confronto } = await supabase
    .from('confrontos')
    .select('selecao_a_id, selecao_b_id, fases(apostas_liberadas, prazo_apostas_em)')
    .eq('id', confronto_id)
    .single()

  if (!confronto) return NextResponse.json({ error: 'Confronto não encontrado' }, { status: 404 })

  const fase = (confronto.fases as unknown as { apostas_liberadas: boolean; prazo_apostas_em: string | null } | null)

  if (!fase?.apostas_liberadas) {
    return NextResponse.json({ error: 'Apostas não liberadas para esta fase' }, { status: 403 })
  }

  if (fase.prazo_apostas_em && new Date(fase.prazo_apostas_em) <= new Date()) {
    return NextResponse.json({ error: 'Prazo encerrado para esta fase' }, { status: 403 })
  }

  if (selecao_vencedor_id !== confronto.selecao_a_id && selecao_vencedor_id !== confronto.selecao_b_id) {
    return NextResponse.json({ error: 'Seleção inválida para este confronto' }, { status: 400 })
  }

  const { error } = await supabase
    .from('apostas_confrontos')
    .upsert({
      user_id: user.id,
      confronto_id,
      selecao_vencedor_id,
      placar_a: placar_a ?? null,
      placar_b: placar_b ?? null,
      atualizado_em: new Date().toISOString(),
    } as never, { onConflict: 'user_id,confronto_id' })

  if (error) return NextResponse.json({ error: 'Erro ao salvar aposta' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
