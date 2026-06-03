import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { enviarNotificacaoAdminEspeciais } from '@/lib/email'

const DEADLINE = new Date('2026-06-11T02:59:00Z') // 10/06/2026 23h59 Brasília

const schema = z.object({
  edicao_id: z.string().uuid(),
  jogador_nome: z.string().min(2).max(100).optional(),
  craque_nome: z.string().min(2).max(100).optional(),
  goleiro_nome: z.string().min(2).max(100).optional(),
  campea_nome: z.string().min(2).max(100).optional(),
})

export async function POST(request: Request) {
  if (new Date() >= DEADLINE) {
    return NextResponse.json(
      { error: 'Prazo encerrado. As apostas foram bloqueadas em 10/06/2026.' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { edicao_id, jogador_nome, craque_nome, goleiro_nome, campea_nome } = parsed.data

  // Verificar que a edição está aberta
  const { data: edicao } = await supabase
    .from('edicoes')
    .select('status')
    .eq('id', edicao_id)
    .single()

  if (!edicao || !(edicao as any).status || !['aberto', 'em_andamento'].includes((edicao as any).status)) {
    return NextResponse.json({ error: 'Edição não disponível para apostas' }, { status: 403 })
  }

  const { error } = await supabase
    .from('apostas_artilheiro')
    .upsert({
      user_id: user.id,
      edicao_id,
      ...(jogador_nome !== undefined ? { jogador_nome } : {}),
      ...(craque_nome !== undefined ? { craque_nome } : {}),
      ...(goleiro_nome !== undefined ? { goleiro_nome } : {}),
      ...(campea_nome !== undefined ? { campea_nome } : {}),
      atualizado_em: new Date().toISOString(),
    } as any, { onConflict: 'user_id,edicao_id' })

  if (error) return NextResponse.json({ error: 'Erro ao salvar aposta' }, { status: 500 })

  // Notificar admin com estado completo da página (fire-and-forget)
  void (async () => {
    try {
      const [{ data: profile }, { data: registroCompleto }] = await Promise.all([
        supabase.from('perfis').select('nome').eq('id', user.id).single() as any,
        supabase.from('apostas_artilheiro')
          .select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
          .eq('user_id', user.id)
          .eq('edicao_id', edicao_id)
          .single() as any,
      ])
      await enviarNotificacaoAdminEspeciais({
        nomeUsuario: profile?.nome ?? user.email!.split('@')[0],
        emailUsuario: user.email!,
        artilheiro: registroCompleto?.jogador_nome,
        craque: registroCompleto?.craque_nome,
        goleiro: registroCompleto?.goleiro_nome,
        campea: registroCompleto?.campea_nome,
        timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      })
    } catch {
      // falhou — não bloquear resposta
    }
  })()

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const edicaoId = searchParams.get('edicao_id')
  if (!edicaoId) return NextResponse.json({ error: 'edicao_id obrigatório' }, { status: 400 })

  const { data } = await supabase
    .from('apostas_artilheiro')
    .select('jogador_nome, craque_nome, goleiro_nome, campea_nome, atualizado_em')
    .eq('user_id', user.id)
    .eq('edicao_id', edicaoId)
    .single() as any

  return NextResponse.json({ aposta: data ?? null })
}
