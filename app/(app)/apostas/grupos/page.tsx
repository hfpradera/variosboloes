/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { GrupoCard } from '@/components/apostas/GrupoCard'
import { AlertCircle, CheckCircle } from 'lucide-react'

export const revalidate = 60

type GrupoRow = { id: string; nome: string; inicio_em: string | null; encerrado: boolean }
type SelecaoPivot = { grupo_id: string; selecao_id: string }
type SelecaoMin = { id: string; nome: string; codigo_iso: string }
type ApostaRow = { grupo_id: string; primeiro_id: string; segundo_id: string; terceiro_id: string | null }

export default async function ApostasGruposPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Buscar edição ativa
  const edicaoRes = await (supabase as any)
    .from('edicoes')
    .select('id, nome, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const edicao = edicaoRes.data as { id: string; nome: string; status: string } | null

  if (!edicao || !['aberto', 'em_andamento'].includes(edicao.status)) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Nenhuma edição ativa no momento.</p>
      </div>
    )
  }

  // Buscar grupos
  const gruposRes = await (supabase as any)
    .from('grupos')
    .select('id, nome, inicio_em, encerrado')
    .eq('edicao_id', edicao.id)
    .order('nome')

  const grupos = (gruposRes.data ?? []) as GrupoRow[]

  // Buscar vínculos grupo → seleção
  const pivotRes = await (supabase as any)
    .from('grupos_selecoes')
    .select('grupo_id, selecao_id')
    .in('grupo_id', grupos.map(g => g.id))

  const gruposSelecoes = (pivotRes.data ?? []) as SelecaoPivot[]

  // Buscar todas as seleções envolvidas
  const selecaoIds = [...new Set(gruposSelecoes.map(gs => gs.selecao_id))]
  const selecoesMap = new Map<string, SelecaoMin>()

  if (selecaoIds.length > 0) {
    const selecoesRes = await (supabase as any)
      .from('selecoes')
      .select('id, nome, codigo_iso')
      .in('id', selecaoIds)
    for (const s of (selecoesRes.data ?? []) as SelecaoMin[]) {
      selecoesMap.set(s.id, s)
    }
  }

  // Buscar apostas existentes do usuário
  const apostasRes = await (supabase as any)
    .from('apostas_grupos')
    .select('grupo_id, primeiro_id, segundo_id, terceiro_id')
    .eq('user_id', user!.id)

  const apostasMap = new Map<string, ApostaRow>(
    ((apostasRes.data ?? []) as ApostaRow[]).map(a => [a.grupo_id, a])
  )

  // Agrupar seleções por grupo_id
  const selecoesPorGrupo = new Map<string, SelecaoMin[]>()
  for (const gs of gruposSelecoes) {
    const s = selecoesMap.get(gs.selecao_id)
    if (!s) continue
    const lista = selecoesPorGrupo.get(gs.grupo_id) ?? []
    lista.push(s)
    selecoesPorGrupo.set(gs.grupo_id, lista)
  }

  const agora = new Date()
  const gruposComStatus = grupos.map(g => ({
    ...g,
    prazoEncerrado: g.encerrado || (g.inicio_em ? new Date(g.inicio_em) <= agora : false),
    selecoes: selecoesPorGrupo.get(g.id) ?? [],
    apostaAtual: apostasMap.get(g.id) ?? null,
  }))

  const totalGrupos = gruposComStatus.length
  const apostados = gruposComStatus.filter(g => g.apostaAtual).length

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-black">Apostas — Fase de Grupos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escolha o 1º, 2º e 3º colocado de cada grupo antes do início dos jogos.
        </p>
      </div>

      {/* Progresso */}
      <div className="card-copa p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Grupos apostados</span>
            <span className="font-semibold">{apostados}/{totalGrupos}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${totalGrupos > 0 ? (apostados / totalGrupos) * 100 : 0}%` }}
            />
          </div>
        </div>
        {apostados === totalGrupos && totalGrupos > 0 ? (
          <CheckCircle size={20} className="text-green-500 shrink-0" />
        ) : (
          <AlertCircle size={20} className="text-yellow-500 shrink-0" />
        )}
      </div>

      {/* Grid de grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gruposComStatus.map(grupo => (
          <GrupoCard
            key={grupo.id}
            grupo={grupo}
            userId={user!.id}
          />
        ))}
      </div>
    </div>
  )
}
