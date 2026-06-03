import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { recalcularPontuacaoEdicao } from '@/lib/pontuacao/calcular'

const FASE_DISPLAY: Record<string, string> = {
  oitavas:   '16 Avos de Final',
  quartas:   'Oitavas de Final',
  semifinal: 'Quartas de Final',
  semi:      'Semifinais',
  final:     'Final',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await verificarAdmin(user.id))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: edicao } = await admin
    .from('edicoes').select('id, nome')
    .in('status', ['aberto', 'em_andamento'])
    .order('created_at', { ascending: false }).limit(1).single() as any

  if (!edicao) return NextResponse.json({ error: 'Nenhuma edição ativa' }, { status: 404 })

  // Grupos com selecoes e resultado atual
  const { data: gruposRaw } = await admin
    .from('grupos').select('id, nome').eq('edicao_id', edicao.id).order('nome') as any

  const grupos = await Promise.all((gruposRaw ?? []).map(async (g: any) => {
    const [{ data: gs }, { data: resultado }] = await Promise.all([
      admin.from('grupos_selecoes').select('selecoes(id, nome)').eq('grupo_id', g.id) as any,
      admin.from('resultados_grupos')
        .select('primeiro_id, segundo_id, terceiro_id, terceiro_classificou')
        .eq('grupo_id', g.id).maybeSingle() as any,
    ])
    return {
      ...g,
      selecoes: (gs ?? []).map((r: any) => r.selecoes).filter(Boolean)
        .sort((a: any, b: any) => a.nome.localeCompare(b.nome)),
      resultado: resultado ?? null,
    }
  }))

  // Fases com confrontos
  const { data: fasesRaw } = await admin
    .from('fases').select('id, nome')
    .eq('edicao_id', edicao.id).eq('apostas_liberadas', true)
    .order('created_at') as any

  const fases = await Promise.all((fasesRaw ?? []).map(async (f: any) => {
    const { data: confrontos } = await admin
      .from('confrontos')
      .select('id, posicao, vencedor_id, placar_a, placar_b, selecao_a:selecao_a_id(id, nome), selecao_b:selecao_b_id(id, nome)')
      .eq('fase_id', f.id).order('posicao') as any
    return {
      ...f,
      display: FASE_DISPLAY[f.nome] ?? f.nome,
      confrontos: (confrontos ?? []).filter((c: any) => c.selecao_a && c.selecao_b),
    }
  }))

  // Especiais já salvos
  const { data: especiais } = await admin
    .from('artilheiros').select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
    .eq('edicao_id', edicao.id).maybeSingle() as any

  return NextResponse.json({ edicao, grupos, fases, especiais: especiais ?? {} })
}

const schemaGrupo = z.object({
  tipo: z.literal('grupo'),
  grupo_id: z.string().uuid(),
  primeiro_id: z.string().uuid(),
  segundo_id: z.string().uuid(),
  terceiro_id: z.string().uuid().optional(),
  terceiro_classificou: z.boolean().optional(),
})

const schemaConfronro = z.object({
  tipo: z.literal('confronto'),
  confronto_id: z.string().uuid(),
  vencedor_id: z.string().uuid(),
  placar_a: z.number().int().min(0).optional(),
  placar_b: z.number().int().min(0).optional(),
})

const schemaArtilheiro = z.object({
  tipo: z.literal('artilheiro'),
  edicao_id: z.string().uuid(),
  jogador_nome: z.string().min(2).optional(),
  craque_nome: z.string().min(2).optional(),
  goleiro_nome: z.string().min(2).optional(),
  campea_nome: z.string().min(2).optional(),
})

const schema = z.discriminatedUnion('tipo', [schemaGrupo, schemaConfronro, schemaArtilheiro])

async function verificarAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('perfis')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return !!data?.is_admin
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await verificarAdmin(user.id))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  if (parsed.data.tipo === 'grupo') {
    const { grupo_id, primeiro_id, segundo_id, terceiro_id, terceiro_classificou } = parsed.data

    // Buscar edicao_id para recalcular
    const { data: grupo } = await admin.from('grupos').select('edicao_id').eq('id', grupo_id).single()

    const { error } = await admin.from('resultados_grupos').upsert({
      grupo_id,
      primeiro_id,
      segundo_id,
      ...(terceiro_id !== undefined ? { terceiro_id } : {}),
      ...(terceiro_classificou !== undefined ? { terceiro_classificou } : {}),
      atualizado_em: new Date().toISOString(),
    } as any, { onConflict: 'grupo_id' })

    if (error) return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })

    // Encerrar grupo
    await admin.from('grupos').update({ encerrado: true }).eq('id', grupo_id)

    if (grupo) {
      await recalcularPontuacaoEdicao(grupo.edicao_id)
    }
  }

  if (parsed.data.tipo === 'confronto') {
    const { confronto_id, vencedor_id, placar_a, placar_b } = parsed.data

    const { data: confronto } = await admin
      .from('confrontos')
      .select('fase_id, fases(edicao_id)')
      .eq('id', confronto_id)
      .single()

    const { error } = await admin.from('confrontos').update({
      vencedor_id,
      placar_a: placar_a ?? null,
      placar_b: placar_b ?? null,
    }).eq('id', confronto_id)

    if (error) return NextResponse.json({ error: 'Erro ao salvar resultado' }, { status: 500 })

    const edicaoId = (confronto?.fases as unknown as { edicao_id: string } | null)?.edicao_id
    if (edicaoId) {
      await recalcularPontuacaoEdicao(edicaoId)
    }
  }

  if (parsed.data.tipo === 'artilheiro') {
    const { edicao_id, jogador_nome, craque_nome, goleiro_nome, campea_nome } = parsed.data

    const { error } = await admin.from('artilheiros').upsert({
      edicao_id,
      ...(jogador_nome ? { jogador_nome } : {}),
      ...(craque_nome ? { craque_nome } : {}),
      ...(goleiro_nome ? { goleiro_nome } : {}),
      ...(campea_nome ? { campea_nome } : {}),
      atualizado_em: new Date().toISOString(),
    } as any, { onConflict: 'edicao_id' })

    if (error) return NextResponse.json({ error: 'Erro ao salvar artilheiro' }, { status: 500 })

    await recalcularPontuacaoEdicao(edicao_id)
  }

  return NextResponse.json({ ok: true })
}
