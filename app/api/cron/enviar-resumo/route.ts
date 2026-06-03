import { createAdminClient } from '@/lib/supabase/admin'
import { enviarResumoUsuario, enviarResumoFase, ADMIN_EMAIL } from '@/lib/email'
import { NextResponse, type NextRequest } from 'next/server'

const GRUPOS_DEADLINE = new Date('2026-06-11T02:59:00Z') // 10/06/2026 23h59 Brasília

const FASE_NOME_DISPLAY: Record<string, string> = {
  oitavas:   '16 Avos de Final',
  quartas:   'Oitavas de Final',
  semifinal: 'Quartas de Final',
  semi:      'Semifinais',
  final:     'Final',
}

export const maxDuration = 300 // 5 min — envio em lote pode demorar

export async function POST(request: NextRequest) {
  // Verifica CRON_SECRET (Vercel injeta automaticamente)
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const agora = new Date()
  const resultados: Record<string, { enviados: number; pulado?: boolean; motivo?: string }> = {}

  // ── Buscar o que já foi enviado ──────────────────────────────
  const { data: logRows } = await admin
    .from('emails_fase_log')
    .select('fase_nome') as any
  const jaEnviados = new Set((logRows ?? []).map((r: any) => r.fase_nome))

  // ── Edição ativa ─────────────────────────────────────────────
  const { data: edicao } = await admin
    .from('edicoes')
    .select('id')
    .in('status', ['aberto', 'em_andamento', 'encerrado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  if (!edicao) {
    return NextResponse.json({ ok: true, mensagem: 'Nenhuma edição ativa.' })
  }

  // ─────────────────────────────────────────────────────────────
  // FASE DE GRUPOS
  // ─────────────────────────────────────────────────────────────
  if (!jaEnviados.has('grupos')) {
    if (agora < GRUPOS_DEADLINE) {
      resultados.grupos = { enviados: 0, pulado: true, motivo: 'prazo ainda não encerrou' }
    } else {
      const enviados = await enviarResumoGrupos(admin, edicao.id)
      await admin.from('emails_fase_log').insert({ fase_nome: 'grupos', total_enviados: enviados })
      resultados.grupos = { enviados }
    }
  } else {
    resultados.grupos = { enviados: 0, pulado: true, motivo: 'já enviado' }
  }

  // ─────────────────────────────────────────────────────────────
  // FASES MATA-MATA
  // ─────────────────────────────────────────────────────────────
  const { data: fases } = await admin
    .from('fases')
    .select('id, nome, prazo_apostas_em')
    .eq('edicao_id', edicao.id)
    .eq('apostas_liberadas', true) as any

  for (const fase of fases ?? []) {
    if (jaEnviados.has(fase.nome)) {
      resultados[fase.nome] = { enviados: 0, pulado: true, motivo: 'já enviado' }
      continue
    }
    if (!fase.prazo_apostas_em || new Date(fase.prazo_apostas_em) > agora) {
      resultados[fase.nome] = { enviados: 0, pulado: true, motivo: 'prazo ainda não encerrou' }
      continue
    }

    const enviados = await enviarResumoMataMata(admin, edicao.id, fase.id, fase.nome)
    await admin.from('emails_fase_log').insert({ fase_nome: fase.nome, total_enviados: enviados })
    resultados[fase.nome] = { enviados }
  }

  return NextResponse.json({ ok: true, resultados })
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function enviarResumoGrupos(admin: ReturnType<typeof createAdminClient>, edicaoId: string) {
  // Reutiliza a mesma lógica do endpoint manual /api/admin/enviar-resumo
  const { data: grupos } = await admin
    .from('grupos')
    .select('id, nome')
    .eq('edicao_id', edicaoId)
    .order('nome') as any
  const grupoMap = new Map((grupos ?? []).map((g: any) => [g.id, g.nome]))

  const { data: apostasGrupos } = await admin
    .from('apostas_grupos')
    .select('user_id, grupo_id, primeiro_id, segundo_id, terceiro_id') as any

  const { data: apostasEspeciais } = await admin
    .from('apostas_artilheiro')
    .select('user_id, jogador_nome, craque_nome, goleiro_nome, campea_nome')
    .eq('edicao_id', edicaoId) as any

  const selecaoIds = new Set<string>()
  for (const a of apostasGrupos ?? []) {
    if (a.primeiro_id) selecaoIds.add(a.primeiro_id)
    if (a.segundo_id) selecaoIds.add(a.segundo_id)
    if (a.terceiro_id) selecaoIds.add(a.terceiro_id)
  }
  const { data: selecoes } = selecaoIds.size > 0
    ? await admin.from('selecoes').select('id, nome').in('id', [...selecaoIds]) as any
    : { data: [] }
  const selMap = new Map((selecoes ?? []).map((s: any) => [s.id, s.nome]))

  const apostasGruposPorUser = new Map<string, any[]>()
  for (const a of apostasGrupos ?? []) {
    const lista = apostasGruposPorUser.get(a.user_id) ?? []
    lista.push(a)
    apostasGruposPorUser.set(a.user_id, lista)
  }
  const apostasEspeciaisPorUser = new Map<string, any>()
  for (const a of apostasEspeciais ?? []) apostasEspeciaisPorUser.set(a.user_id, a)

  const userIds = new Set([...apostasGruposPorUser.keys(), ...apostasEspeciaisPorUser.keys()])
  if (userIds.size === 0) return 0

  const { data: perfis } = await admin.from('perfis').select('id, nome').in('id', [...userIds]) as any
  const perfilMap = new Map((perfis ?? []).map((p: any) => [p.id, p]))

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map<string, string>()
  for (const u of authUsers ?? []) { if (u.email) emailMap.set(u.id, u.email) }

  let enviados = 0
  for (const userId of userIds) {
    const email = emailMap.get(userId)
    if (!email) continue
    const perfil = perfilMap.get(userId)
    const nomeUsuario = perfil?.nome ?? email.split('@')[0]

    const apostasDoUser = (apostasGruposPorUser.get(userId) ?? [])
      .sort((a: any, b: any) => (grupoMap.get(a.grupo_id) ?? '').localeCompare(grupoMap.get(b.grupo_id) ?? ''))
      .map((a: any) => ({
        nomeGrupo: grupoMap.get(a.grupo_id) ?? '?',
        primeiro: selMap.get(a.primeiro_id) ?? '?',
        segundo: selMap.get(a.segundo_id) ?? '?',
        terceiro: a.terceiro_id ? selMap.get(a.terceiro_id) : undefined,
      }))

    const especiais = apostasEspeciaisPorUser.get(userId)
    const destinatarios = ADMIN_EMAIL && ADMIN_EMAIL !== email
      ? [email, ADMIN_EMAIL]
      : email
    try {
      await enviarResumoUsuario({
        para: destinatarios,
        nomeUsuario,
        grupos: apostasDoUser,
        artilheiro: especiais?.jogador_nome,
        craque: especiais?.craque_nome,
        goleiro: especiais?.goleiro_nome,
        campea: especiais?.campea_nome,
      })
      enviados++
    } catch { /* continua */ }
  }
  return enviados
}

async function enviarResumoMataMata(
  admin: ReturnType<typeof createAdminClient>,
  edicaoId: string,
  faseId: string,
  faseNome: string,
) {
  const nomeFaseDisplay = FASE_NOME_DISPLAY[faseNome] ?? faseNome

  // Buscar confrontos da fase com seleções
  const { data: confrontosRaw } = await admin
    .from('confrontos')
    .select(`
      id, posicao,
      selecao_a:selecao_a_id(id, nome),
      selecao_b:selecao_b_id(id, nome)
    `)
    .eq('fase_id', faseId)
    .order('posicao') as any

  const confrontos = (confrontosRaw ?? []).filter((c: any) => c.selecao_a && c.selecao_b)
  if (confrontos.length === 0) return 0

  const confrontoIds = confrontos.map((c: any) => c.id)
  const confrontoMap = new Map(confrontos.map((c: any) => [c.id, c]))

  // Buscar todas as apostas desses confrontos
  const { data: apostas } = await admin
    .from('apostas_confrontos')
    .select('user_id, confronto_id, selecao_vencedor_id, placar_a, placar_b')
    .in('confronto_id', confrontoIds) as any

  // Buscar nomes das seleções vencedoras apostadas
  const vencedorIds = new Set((apostas ?? []).map((a: any) => a.selecao_vencedor_id).filter(Boolean))
  const { data: selVenc } = vencedorIds.size > 0
    ? await admin.from('selecoes').select('id, nome').in('id', [...vencedorIds]) as any
    : { data: [] }
  const selVencMap = new Map((selVenc ?? []).map((s: any) => [s.id, s.nome]))

  // Agrupar apostas por usuário
  const apostasPorUser = new Map<string, any[]>()
  for (const a of apostas ?? []) {
    const lista = apostasPorUser.get(a.user_id) ?? []
    lista.push(a)
    apostasPorUser.set(a.user_id, lista)
  }

  // Buscar todos os usuários com apostas nessa fase
  const userIds = [...apostasPorUser.keys()]
  if (userIds.length === 0) return 0

  const { data: perfis } = await admin.from('perfis').select('id, nome').in('id', userIds) as any
  const perfilMap = new Map((perfis ?? []).map((p: any) => [p.id, p]))

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map<string, string>()
  for (const u of authUsers ?? []) { if (u.email) emailMap.set(u.id, u.email) }

  let enviados = 0
  for (const userId of userIds) {
    const email = emailMap.get(userId)
    if (!email) continue
    const perfil = perfilMap.get(userId)
    const nomeUsuario = perfil?.nome ?? email.split('@')[0]

    const apostasDoUser = new Map((apostasPorUser.get(userId) ?? []).map((a: any) => [a.confronto_id, a]))

    const confrontosFormatados = confrontos.map((c: any) => {
      const aposta = apostasDoUser.get(c.id)
      return {
        posicao: c.posicao,
        selecaoA: c.selecao_a.nome,
        selecaoB: c.selecao_b.nome,
        apostou: aposta ? selVencMap.get(aposta.selecao_vencedor_id) : undefined,
        placarA: aposta?.placar_a,
        placarB: aposta?.placar_b,
      }
    })

    const destinatarios = ADMIN_EMAIL && ADMIN_EMAIL !== email
      ? [email, ADMIN_EMAIL]
      : email
    try {
      await enviarResumoFase({
        para: destinatarios,
        nomeUsuario,
        nomeFase: nomeFaseDisplay,
        confrontos: confrontosFormatados,
      })
      enviados++
    } catch { /* continua */ }
  }
  return enviados
}
