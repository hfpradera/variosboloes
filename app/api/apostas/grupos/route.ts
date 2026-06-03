import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarNotificacaoAdminGrupo } from '@/lib/email'

const schema = z.object({
  grupo_id: z.string().uuid(),
  primeiro_id: z.string().uuid(),
  segundo_id: z.string().uuid(),
  terceiro_id: z.string().uuid(), // obrigatório
})

const DEADLINE = new Date('2026-06-11T02:59:00Z') // 10/06/2026 23h59 Brasília

export async function POST(request: Request) {
  if (new Date() >= DEADLINE) {
    return NextResponse.json(
      { error: 'As apostas foram encerradas em 10/06/2026.' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { grupo_id, primeiro_id, segundo_id, terceiro_id } = parsed.data

  const ids = [primeiro_id, segundo_id, terceiro_id]
  if (new Set(ids).size !== 3) {
    return NextResponse.json({ error: '1º, 2º e 3º devem ser seleções diferentes' }, { status: 400 })
  }

  // Verificar prazo no servidor (nunca confiar no cliente)
  const { data: grupo, error: grupoError } = await supabase
    .from('grupos')
    .select('inicio_em, encerrado')
    .eq('id', grupo_id)
    .single()

  if (grupoError || !grupo) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
  }

  const prazoEncerrado =
    grupo.encerrado ||
    (grupo.inicio_em && new Date(grupo.inicio_em) <= new Date())

  if (prazoEncerrado) {
    return NextResponse.json({ error: 'Prazo encerrado para este grupo' }, { status: 403 })
  }

  // Verificar que todas as seleções apostadas pertencem ao grupo
  const idsParaVerificar = [primeiro_id, segundo_id, terceiro_id]
  const { data: membros } = await supabase
    .from('grupos_selecoes')
    .select('selecao_id')
    .eq('grupo_id', grupo_id)
    .in('selecao_id', idsParaVerificar)

  if (!membros || membros.length < 3) {
    return NextResponse.json({ error: 'Seleções inválidas para este grupo' }, { status: 400 })
  }

  // Upsert da aposta
  const { error } = await supabase
    .from('apostas_grupos')
    .upsert({
      user_id: user.id,
      grupo_id,
      primeiro_id,
      segundo_id,
      terceiro_id,
      atualizado_em: new Date().toISOString(),
    } as any, { onConflict: 'user_id,grupo_id' })

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar aposta' }, { status: 500 })
  }

  // Notificar admin com estado completo de todos os grupos (fire-and-forget)
  void (async () => {
    try {
      const [{ data: profile }, { data: todasApostas }] = await Promise.all([
        supabase.from('perfis').select('nome').eq('id', user.id).single() as any,
        supabase.from('apostas_grupos').select('grupo_id, primeiro_id, segundo_id, terceiro_id').eq('user_id', user.id) as any,
      ])

      const grupoIds = (todasApostas ?? []).map((a: any) => a.grupo_id)
      const selIds = new Set<string>()
      for (const a of todasApostas ?? []) {
        if (a.primeiro_id) selIds.add(a.primeiro_id)
        if (a.segundo_id) selIds.add(a.segundo_id)
        if (a.terceiro_id) selIds.add(a.terceiro_id)
      }

      const [{ data: gruposRows }, { data: selecoesRows }] = await Promise.all([
        grupoIds.length > 0 ? supabase.from('grupos').select('id, nome').in('id', grupoIds).order('nome') as any : Promise.resolve({ data: [] }),
        selIds.size > 0 ? supabase.from('selecoes').select('id, nome').in('id', [...selIds]) as any : Promise.resolve({ data: [] }),
      ])

      const grupoMap = new Map((gruposRows ?? []).map((g: any) => [g.id, g.nome]))
      const selMap = new Map((selecoesRows ?? []).map((s: any) => [s.id, s.nome]))

      const grupos = (todasApostas ?? [])
        .sort((a: any, b: any) => (grupoMap.get(a.grupo_id) ?? '').localeCompare(grupoMap.get(b.grupo_id) ?? ''))
        .map((a: any) => ({
          nomeGrupo: grupoMap.get(a.grupo_id) ?? '?',
          primeiro: selMap.get(a.primeiro_id) ?? '?',
          segundo: selMap.get(a.segundo_id) ?? '?',
          terceiro: a.terceiro_id ? selMap.get(a.terceiro_id) : undefined,
          atualizado: a.grupo_id === grupo_id,
        }))

      await enviarNotificacaoAdminGrupo({
        nomeUsuario: profile?.nome ?? user.email!.split('@')[0],
        emailUsuario: user.email!,
        grupos,
        timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      })
    } catch {
      // falhou — não bloquear resposta
    }
  })()

  return NextResponse.json({ ok: true })
}
