/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

async function verificarSuperAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await (admin.from('perfis') as any).select('is_admin').eq('id', userId).single()
  return !!(data as any)?.is_admin
}

const schemaCriar = z.object({
  acao: z.literal('criar'),
  nome: z.string().min(2),
  descricao: z.string().optional(),
  edicao_id: z.string().uuid(),
})

const schemaAprovar = z.object({
  acao: z.literal('aprovar'),
  bolao_id: z.string().uuid(),
  user_id: z.string().uuid(),
  aprovado: z.boolean(),
})

const schemaBloquear = z.object({
  acao: z.literal('bloquear'),
  bolao_id: z.string().uuid(),
  user_id: z.string().uuid(),
  bloqueado: z.boolean(),
})

const schemaPagamento = z.object({
  acao: z.literal('pagamento'),
  bolao_id: z.string().uuid(),
  user_id: z.string().uuid(),
  confirmado: z.boolean(),
})

const schemaAdmin = z.object({
  acao: z.literal('admin_bolao'),
  bolao_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_admin: z.boolean(),
})

const schemaToggle = z.object({
  acao: z.literal('toggle_ativo'),
  bolao_id: z.string().uuid(),
  ativo: z.boolean(),
})

const schema = z.discriminatedUnion('acao', [
  schemaCriar, schemaAprovar, schemaBloquear,
  schemaPagamento, schemaAdmin, schemaToggle,
])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await verificarSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const data = parsed.data

  if (data.acao === 'criar') {
    const { error, data: bolao } = await (admin.from('boloes') as any)
      .insert({ nome: data.nome, descricao: data.descricao ?? null, edicao_id: data.edicao_id })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao criar bolão' }, { status: 500 })
    return NextResponse.json({ ok: true, bolao_id: (bolao as any).id })
  }

  if (data.acao === 'aprovar') {
    const { error } = await (admin.from('bolao_membros') as any)
      .update({ aprovado: data.aprovado })
      .eq('bolao_id', data.bolao_id)
      .eq('user_id', data.user_id)
    if (error) return NextResponse.json({ error: 'Erro ao atualizar aprovação' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (data.acao === 'bloquear') {
    const { error } = await (admin.from('bolao_membros') as any)
      .update({ bloqueado: data.bloqueado })
      .eq('bolao_id', data.bolao_id)
      .eq('user_id', data.user_id)
    if (error) return NextResponse.json({ error: 'Erro ao bloquear' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (data.acao === 'pagamento') {
    const { error } = await (admin.from('bolao_membros') as any)
      .update({ pagamento_confirmado: data.confirmado })
      .eq('bolao_id', data.bolao_id)
      .eq('user_id', data.user_id)
    if (error) return NextResponse.json({ error: 'Erro ao confirmar pagamento' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (data.acao === 'admin_bolao') {
    const { error } = await (admin.from('bolao_membros') as any)
      .update({ is_admin: data.is_admin })
      .eq('bolao_id', data.bolao_id)
      .eq('user_id', data.user_id)
    if (error) return NextResponse.json({ error: 'Erro ao atualizar admin' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (data.acao === 'toggle_ativo') {
    const { error } = await (admin.from('boloes') as any)
      .update({ ativo: data.ativo })
      .eq('id', data.bolao_id)
    if (error) return NextResponse.json({ error: 'Erro ao atualizar bolão' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await verificarSuperAdmin(user.id))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const bolaoId = searchParams.get('bolao_id')

  if (bolaoId) {
    // Membros de um bolão específico
    const { data: membros } = await (admin.from('bolao_membros') as any)
      .select('user_id, is_admin, aprovado, pagamento_confirmado, bloqueado, criado_em, perfis(nome)')
      .eq('bolao_id', bolaoId)
      .order('criado_em')
    return NextResponse.json({ membros: membros ?? [] })
  }

  // Todos os bolões
  const { data: boloes } = await (admin.from('boloes') as any)
    .select('id, nome, descricao, ativo, criado_em, edicao_id, edicoes(nome)')
    .order('criado_em')
  return NextResponse.json({ boloes: boloes ?? [] })
}
