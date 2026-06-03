import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { enviarResumoUsuario } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const userIdFiltro: string | null = body?.user_id ?? null
  // Só admin pode chamar
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: perfil } = await admin.from('perfis').select('is_admin').eq('id', user.id).single() as any
  if (!perfil?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  // Buscar edição ativa
  const { data: edicao } = await admin
    .from('edicoes')
    .select('id, nome')
    .in('status', ['aberto', 'em_andamento', 'encerrado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  if (!edicao) return NextResponse.json({ error: 'Nenhuma edição encontrada' }, { status: 404 })

  // Buscar todos os grupos da edição
  const { data: grupos } = await admin
    .from('grupos')
    .select('id, nome')
    .eq('edicao_id', edicao.id)
    .order('nome') as any

  const grupoMap = new Map((grupos ?? []).map((g: any) => [g.id, g.nome]))

  // Buscar todas as apostas de grupos
  const { data: apostasGrupos } = await admin
    .from('apostas_grupos')
    .select('user_id, grupo_id, primeiro_id, segundo_id, terceiro_id') as any

  // Buscar todas as apostas especiais
  const { data: apostasEspeciais } = await admin
    .from('apostas_artilheiro')
    .select('user_id, jogador_nome, craque_nome, goleiro_nome, campea_nome')
    .eq('edicao_id', edicao.id) as any

  // Buscar todos os IDs de seleções usados
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

  // Agrupar apostas de grupos por user_id
  const apostasGruposPorUser = new Map<string, any[]>()
  for (const a of apostasGrupos ?? []) {
    const lista = apostasGruposPorUser.get(a.user_id) ?? []
    lista.push(a)
    apostasGruposPorUser.set(a.user_id, lista)
  }

  const apostasEspeciaisPorUser = new Map<string, any>()
  for (const a of apostasEspeciais ?? []) {
    apostasEspeciaisPorUser.set(a.user_id, a)
  }

  // Buscar todos os usuários que têm alguma aposta
  let userIds = new Set([
    ...apostasGruposPorUser.keys(),
    ...apostasEspeciaisPorUser.keys(),
  ])

  // Se veio um user_id específico, filtrar só ele
  if (userIdFiltro) {
    userIds = new Set([userIdFiltro])
  }

  if (userIds.size === 0) {
    return NextResponse.json({ ok: true, enviados: 0, mensagem: 'Nenhum participante com apostas.' })
  }

  // Buscar perfis + emails via auth.users (admin client)
  const { data: perfis } = await admin
    .from('perfis')
    .select('id, nome')
    .in('id', [...userIds]) as any

  const perfilMap = new Map((perfis ?? []).map((p: any) => [p.id, p]))

  // Buscar emails via auth (listUsers)
  const emailMap = new Map<string, string>()
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  for (const u of authUsers ?? []) {
    if (u.email) emailMap.set(u.id, u.email)
  }

  // Enviar emails
  let enviados = 0
  const erros: string[] = []

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

    try {
      await enviarResumoUsuario({
        para: email,
        nomeUsuario,
        grupos: apostasDoUser,
        artilheiro: especiais?.jogador_nome,
        craque: especiais?.craque_nome,
        goleiro: especiais?.goleiro_nome,
        campea: especiais?.campea_nome,
      })
      enviados++
    } catch (e: any) {
      erros.push(`${email}: ${e?.message ?? 'erro desconhecido'}`)
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    total: userIds.size,
    erros: erros.length > 0 ? erros : undefined,
  })
}
