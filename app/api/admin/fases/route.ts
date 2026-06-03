import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

type PosType = 'primeiro' | 'segundo'
type BracketEntry = { posicao: number; grupoA: string; tipoA: PosType; grupoB: string; tipoB: PosType }
type BracketEntryMeio = { posicao: number; grupoA: string; tipoA: 'primeiro' } // vs 3º TBD

// ── Bracket oficial Copa 2026 — 16 Avos de Final (Jogos 73-88) ───────────────
// 8 confrontos automáticos (1ºs e 2ºs conhecidos após grupos)
const BRACKET_AVOS_DEFINIDOS: BracketEntry[] = [
  { posicao:  1, grupoA: 'A', tipoA: 'segundo',  grupoB: 'B', tipoB: 'segundo'  }, // J73: 2A x 2B
  { posicao:  3, grupoA: 'F', tipoA: 'primeiro', grupoB: 'C', tipoB: 'segundo'  }, // J75: 1F x 2C
  { posicao:  4, grupoA: 'C', tipoA: 'primeiro', grupoB: 'F', tipoB: 'segundo'  }, // J76: 1C x 2F
  { posicao:  6, grupoA: 'E', tipoA: 'segundo',  grupoB: 'I', tipoB: 'segundo'  }, // J78: 2E x 2I
  { posicao: 11, grupoA: 'K', tipoA: 'segundo',  grupoB: 'L', tipoB: 'segundo'  }, // J83: 2K x 2L
  { posicao: 12, grupoA: 'H', tipoA: 'primeiro', grupoB: 'J', tipoB: 'segundo'  }, // J84: 1H x 2J
  { posicao: 14, grupoA: 'J', tipoA: 'primeiro', grupoB: 'H', tipoB: 'segundo'  }, // J86: 1J x 2H
  { posicao: 16, grupoA: 'D', tipoA: 'segundo',  grupoB: 'G', tipoB: 'segundo'  }, // J88: 2D x 2G
]

// 8 confrontos com 3º colocado TBD — pré-preenche o 1º conhecido, admin informa o 3º
const BRACKET_AVOS_COM_TERCEIRO: BracketEntryMeio[] = [
  { posicao:  2, grupoA: 'E', tipoA: 'primeiro' }, // J74: 1E x 3º(A/B/C/D/F)
  { posicao:  5, grupoA: 'I', tipoA: 'primeiro' }, // J77: 1I x 3º(C/D/F/G/H)
  { posicao:  7, grupoA: 'A', tipoA: 'primeiro' }, // J79: 1A x 3º(C/E/F/H/I)
  { posicao:  8, grupoA: 'L', tipoA: 'primeiro' }, // J80: 1L x 3º(E/H/I/J/K)
  { posicao:  9, grupoA: 'D', tipoA: 'primeiro' }, // J81: 1D x 3º(B/E/F/I/J)
  { posicao: 10, grupoA: 'G', tipoA: 'primeiro' }, // J82: 1G x 3º(A/E/H/I/J)
  { posicao: 13, grupoA: 'B', tipoA: 'primeiro' }, // J85: 1B x 3º(E/F/G/I/J)
  { posicao: 15, grupoA: 'K', tipoA: 'primeiro' }, // J87: 1K x 3º(D/E/I/J/L)
]

// ── Cruzamentos oficiais entre fases ─────────────────────────────────────────
// Cada par [posA, posB] indica quais posições da fase anterior se enfrentam
const PAIRINGS: Record<string, [number, number][]> = {
  // 16 Avos → Oitavas (J89-96)
  oitavas: [
    [ 1,  3], // J89: W73 x W75
    [ 2,  5], // J90: W74 x W77
    [ 4,  6], // J91: W76 x W78
    [ 7,  8], // J92: W79 x W80
    [11, 12], // J93: W83 x W84
    [ 9, 10], // J94: W81 x W82
    [14, 16], // J95: W86 x W88
    [13, 15], // J96: W85 x W87
  ],
  // Oitavas → Quartas (J97-100)
  quartas: [
    [1, 2], // J97: W89 x W90
    [5, 6], // J98: W93 x W94
    [3, 4], // J99: W91 x W92
    [7, 8], // J100: W95 x W96
  ],
  // Quartas → Semifinal (J101-102)
  semifinal: [
    [1, 2], // J101: W97 x W98
    [3, 4], // J102: W99 x W100
  ],
  // Semifinal → Final (J104)
  semi: [
    [1, 2], // J104: W101 x W102
  ],
}

const PROXIMA_FASE: Record<string, string> = {
  oitavas:   'quartas',
  quartas:   'semifinal',
  semifinal: 'semi',
  semi:      'final',
}

const schemaGerarOitavas = z.object({
  tipo: z.literal('gerar_oitavas'),
  edicao_id: z.string().uuid(),
  inicio_em: z.string().datetime(),
  prazo_apostas_em: z.string().datetime(),
})

const schemaGerarProxima = z.object({
  tipo: z.literal('gerar_proxima'),
  fase_id: z.string().uuid(), // fase atual (oitavas/quartas/semifinal)
})

const schemaAtualizarTimes = z.object({
  tipo: z.literal('atualizar_times'),
  confronto_id: z.string().uuid(),
  selecao_a_id: z.string().uuid(),
  selecao_b_id: z.string().uuid(),
})

const schemaLiberarApostas = z.object({
  tipo: z.literal('liberar_apostas'),
  fase_id: z.string().uuid(),
})

const schema = z.discriminatedUnion('tipo', [
  schemaGerarOitavas,
  schemaGerarProxima,
  schemaAtualizarTimes,
  schemaLiberarApostas,
])

async function verificarAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from('perfis').select('is_admin').eq('id', userId).single() as any
  return !!(data as any)?.is_admin
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

  // ── Gerar fase de oitavas ─────────────────────────────────────────────────
  if (parsed.data.tipo === 'gerar_oitavas') {
    const { edicao_id, inicio_em, prazo_apostas_em } = parsed.data

    // Verificar se já existe
    const { data: faseExistente } = await admin
      .from('fases')
      .select('id')
      .eq('edicao_id', edicao_id)
      .eq('nome', 'oitavas')
      .single()

    if (faseExistente) {
      return NextResponse.json({ error: 'Fase de oitavas já existe' }, { status: 409 })
    }

    // Buscar todos os resultados dos grupos
    const { data: resultados } = await admin
      .from('resultados_grupos')
      .select('grupo_id, primeiro_id, segundo_id, grupos(nome)')
      .not('primeiro_id', 'is', null)
      .not('segundo_id', 'is', null) as any

    if (!resultados || resultados.length < 12) {
      return NextResponse.json(
        { error: `Resultados incompletos: ${resultados?.length ?? 0}/12 grupos concluídos` },
        { status: 400 }
      )
    }

    // Mapear grupo.nome → { primeiro_id, segundo_id }
    const mapaGrupos: Record<string, { primeiro_id: string; segundo_id: string }> = {}
    for (const r of resultados) {
      const nomeGrupo = (r.grupos as any)?.nome as string
      if (nomeGrupo) {
        mapaGrupos[nomeGrupo] = { primeiro_id: r.primeiro_id, segundo_id: r.segundo_id }
      }
    }

    // Criar fase
    const { data: fase, error: errFase } = await admin
      .from('fases')
      .insert({ edicao_id, nome: 'oitavas', inicio_em, prazo_apostas_em } as any)
      .select('id')
      .single() as any

    if (errFase || !fase) {
      return NextResponse.json({ error: 'Erro ao criar fase' }, { status: 500 })
    }

    const getSelecaoId = (g: string, tipo: PosType) =>
      mapaGrupos[g]?.[tipo === 'primeiro' ? 'primeiro_id' : 'segundo_id'] ?? null

    // 8 confrontos automáticos (1ºs e 2ºs definidos pelo resultado dos grupos)
    const confrontosAuto = BRACKET_AVOS_DEFINIDOS.map(({ posicao, grupoA, tipoA, grupoB, tipoB }) => ({
      fase_id: (fase as any).id,
      posicao,
      selecao_a_id: getSelecaoId(grupoA, tipoA),
      selecao_b_id: getSelecaoId(grupoB, tipoB),
    }))

    // 8 confrontos com 3º TBD — pré-preenche o 1º colocado, admin informa o 3º
    const confrontosTerceiros = BRACKET_AVOS_COM_TERCEIRO.map(({ posicao, grupoA, tipoA }) => ({
      fase_id: (fase as any).id,
      posicao,
      selecao_a_id: getSelecaoId(grupoA, tipoA),
      selecao_b_id: null, // 3º colocado — admin preenche após definir os 8 melhores
    }))

    const { error: errConf } = await admin
      .from('confrontos')
      .insert([...confrontosAuto, ...confrontosTerceiros] as any)

    if (errConf) {
      return NextResponse.json({ error: 'Erro ao criar confrontos' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, fase_id: (fase as any).id, confrontos: 16 })
  }

  // ── Gerar próxima fase a partir dos vencedores da atual ───────────────────
  if (parsed.data.tipo === 'gerar_proxima') {
    const { fase_id } = parsed.data

    const { data: fase } = await admin
      .from('fases')
      .select('nome, edicao_id')
      .eq('id', fase_id)
      .single() as any

    if (!fase) return NextResponse.json({ error: 'Fase não encontrada' }, { status: 404 })

    const proximaNome = PROXIMA_FASE[(fase as any).nome]
    if (!proximaNome) return NextResponse.json({ error: 'Não há próxima fase após esta' }, { status: 400 })

    // Verificar se já existe
    const { data: jaExiste } = await admin
      .from('fases')
      .select('id')
      .eq('edicao_id', (fase as any).edicao_id)
      .eq('nome', proximaNome)
      .single() as any

    if (jaExiste) return NextResponse.json({ error: `Fase ${proximaNome} já existe` }, { status: 409 })

    // Buscar confrontos da fase atual COM vencedores, ordenados por posição
    const { data: confrontos } = await admin
      .from('confrontos')
      .select('posicao, vencedor_id')
      .eq('fase_id', fase_id)
      .not('vencedor_id', 'is', null)
      .order('posicao') as any

    if (!confrontos || (confrontos as any[]).length === 0) {
      return NextResponse.json({ error: 'Nenhum confronto com resultado' }, { status: 400 })
    }

    // Verificar se todos têm vencedor
    const { data: total } = await admin
      .from('confrontos')
      .select('id', { count: 'exact' })
      .eq('fase_id', fase_id) as any

    if (((total as any[])?.length ?? 0) !== (confrontos as any[]).length) {
      return NextResponse.json(
        { error: `Fase incompleta: ${(confrontos as any[]).length}/${(total as any[])?.length ?? '?'} jogos com resultado` },
        { status: 400 }
      )
    }

    // Criar nova fase (sem prazo ainda — admin define depois)
    const { data: novaFase, error: errFase } = await admin
      .from('fases')
      .insert({
        edicao_id: (fase as any).edicao_id,
        nome: proximaNome,
        inicio_em: null,
        prazo_apostas_em: null,
      } as any)
      .select('id')
      .single() as any

    if (errFase || !novaFase) {
      return NextResponse.json({ error: 'Erro ao criar próxima fase' }, { status: 500 })
    }

    // Criar confrontos da próxima fase usando cruzamentos oficiais
    const pairings = PAIRINGS[(fase as any).nome]
    if (!pairings) {
      return NextResponse.json({ error: 'Cruzamentos não definidos para esta fase' }, { status: 400 })
    }

    const vencedorPorPosicao = new Map(
      (confrontos as any[]).map((c: any) => [c.posicao, c.vencedor_id])
    )

    const novoConfrots: any[] = pairings.map(([posA, posB], idx) => ({
      fase_id: (novaFase as any).id,
      posicao: idx + 1,
      selecao_a_id: vencedorPorPosicao.get(posA) ?? null,
      selecao_b_id: vencedorPorPosicao.get(posB) ?? null,
    }))

    if (novoConfrots.length === 0) {
      return NextResponse.json({ error: 'Nenhum confronto gerado' }, { status: 400 })
    }

    const { error: errConf } = await admin.from('confrontos').insert(novoConfrots as any)
    if (errConf) return NextResponse.json({ error: 'Erro ao criar confrontos' }, { status: 500 })

    return NextResponse.json({ ok: true, fase_id: (novaFase as any).id, fase_nome: proximaNome, confrontos: novoConfrots.length })
  }

  // ── Atualizar times de um confronto (melhores 3ºs) ───────────────────────
  if (parsed.data.tipo === 'atualizar_times') {
    const { confronto_id, selecao_a_id, selecao_b_id } = parsed.data
    const { error } = await (admin.from('confrontos') as any)
      .update({ selecao_a_id, selecao_b_id })
      .eq('id', confronto_id)

    if (error) return NextResponse.json({ error: 'Erro ao atualizar confronto' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Liberar apostas (revelar apostas após prazo) ──────────────────────────
  if (parsed.data.tipo === 'liberar_apostas') {
    const { fase_id } = parsed.data
    const { error } = await (admin.from('fases') as any)
      .update({ apostas_liberadas: true })
      .eq('id', fase_id)

    if (error) return NextResponse.json({ error: 'Erro ao liberar apostas' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

// GET — listar fases de uma edição
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await verificarAdmin(user.id))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const edicaoId = searchParams.get('edicao_id')
  if (!edicaoId) return NextResponse.json({ error: 'edicao_id obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { data: fases } = await admin
    .from('fases')
    .select(`
      id, nome, inicio_em, prazo_apostas_em, apostas_liberadas,
      confrontos(id, posicao, selecao_a_id, selecao_b_id, vencedor_id, placar_a, placar_b)
    `)
    .eq('edicao_id', edicaoId)
    .order('nome') as any

  return NextResponse.json({ fases: fases ?? [] })
}
