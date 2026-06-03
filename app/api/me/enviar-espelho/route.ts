import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { enviarResumoUsuario } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: edicao } = await supabase
    .from('edicoes')
    .select('id')
    .in('status', ['aberto', 'em_andamento', 'encerrado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  const [{ data: perfil }, { data: apostasGrupos }, { data: especiais }] = await Promise.all([
    supabase.from('perfis').select('nome').eq('id', user.id).single() as any,
    supabase.from('apostas_grupos')
      .select('grupo_id, primeiro_id, segundo_id, terceiro_id')
      .eq('user_id', user.id) as any,
    edicao
      ? supabase.from('apostas_artilheiro')
          .select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
          .eq('user_id', user.id)
          .eq('edicao_id', edicao.id)
          .maybeSingle() as any
      : Promise.resolve({ data: null }),
  ])

  const grupoIds = (apostasGrupos ?? []).map((a: any) => a.grupo_id)
  const selIds = new Set<string>()
  for (const a of apostasGrupos ?? []) {
    if (a.primeiro_id) selIds.add(a.primeiro_id)
    if (a.segundo_id) selIds.add(a.segundo_id)
    if (a.terceiro_id) selIds.add(a.terceiro_id)
  }

  const [{ data: gruposRows }, { data: selecoesRows }] = await Promise.all([
    grupoIds.length > 0
      ? supabase.from('grupos').select('id, nome').in('id', grupoIds).order('nome') as any
      : Promise.resolve({ data: [] }),
    selIds.size > 0
      ? supabase.from('selecoes').select('id, nome').in('id', [...selIds]) as any
      : Promise.resolve({ data: [] }),
  ])

  const grupoMap = new Map((gruposRows ?? []).map((g: any) => [g.id, g.nome]))
  const selMap = new Map((selecoesRows ?? []).map((s: any) => [s.id, s.nome]))

  const gruposFormatados = (apostasGrupos ?? [])
    .sort((a: any, b: any) => (grupoMap.get(a.grupo_id) ?? '').localeCompare(grupoMap.get(b.grupo_id) ?? ''))
    .map((a: any) => ({
      nomeGrupo: grupoMap.get(a.grupo_id) ?? '?',
      primeiro: selMap.get(a.primeiro_id) ?? '?',
      segundo: selMap.get(a.segundo_id) ?? '?',
      terceiro: a.terceiro_id ? selMap.get(a.terceiro_id) : undefined,
    }))

  const nomeUsuario = (perfil as any)?.nome ?? user.email!.split('@')[0]

  await enviarResumoUsuario({
    para: user.email!,
    nomeUsuario,
    grupos: gruposFormatados,
    artilheiro: (especiais as any)?.jogador_nome,
    craque: (especiais as any)?.craque_nome,
    goleiro: (especiais as any)?.goleiro_nome,
    campea: (especiais as any)?.campea_nome,
    assunto: '📋 Suas apostas atuais — Bolão Copa 2026',
    mensagemIntro: 'Aqui está o estado atual de todas as suas apostas registradas.',
  })

  return NextResponse.json({ ok: true })
}
