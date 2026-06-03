import { createAdminClient } from '@/lib/supabase/admin'
import { FasesManager } from './FasesManager'

export const revalidate = 0

export default async function AdminFasesPage() {
  const admin = createAdminClient()

  const { data: edicao } = await admin
    .from('edicoes')
    .select('id')
    .eq('ano', 2026)
    .single() as any

  if (!edicao) return <p className="text-muted-foreground">Edição 2026 não encontrada.</p>

  // Buscar fases com confrontos e seleções
  const { data: fases } = await admin
    .from('fases')
    .select(`
      id, nome, inicio_em, prazo_apostas_em, apostas_liberadas,
      confrontos(
        id, posicao, vencedor_id, placar_a, placar_b,
        selecao_a:selecoes!confrontos_selecao_a_id_fkey(id, nome, codigo_iso),
        selecao_b:selecoes!confrontos_selecao_b_id_fkey(id, nome, codigo_iso),
        vencedor:selecoes!confrontos_vencedor_id_fkey(id, nome, codigo_iso)
      )
    `)
    .eq('edicao_id', edicao.id)
    .order('nome') as any

  // Buscar todas as seleções (para select de vencedor)
  const { data: selecoes } = await admin
    .from('selecoes')
    .select('id, nome, codigo_iso')
    .order('nome') as any

  const fasesFormatadas = (fases ?? []).map((f: any) => ({
    ...f,
    confrontos: (f.confrontos ?? []).sort((a: any, b: any) => a.posicao - b.posicao),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Mata-Mata</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre resultados por fase e gere a próxima automaticamente.
        </p>
      </div>
      <FasesManager
        edicaoId={edicao.id}
        fases={fasesFormatadas}
        selecoes={selecoes ?? []}
      />
    </div>
  )
}
