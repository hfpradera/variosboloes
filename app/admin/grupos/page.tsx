import { createAdminClient } from '@/lib/supabase/admin'
import { GruposManager } from './GruposManager'

export const revalidate = 0

export default async function AdminGruposPage() {
  const admin = createAdminClient()

  const { data: edicao } = await admin
    .from('edicoes')
    .select('id, status')
    .eq('ano', 2026)
    .single() as any

  if (!edicao) {
    return <p className="text-muted-foreground">Edição 2026 não encontrada.</p>
  }

  // Buscar grupos com seleções
  const { data: grupos } = await admin
    .from('grupos')
    .select(`
      id, nome, encerrado,
      grupos_selecoes(selecao_id, selecoes(id, nome, codigo_iso)),
      resultados_grupos(primeiro_id, segundo_id, terceiro_id)
    `)
    .eq('edicao_id', edicao.id)
    .order('nome') as any

  // Verificar se fase de oitavas já foi gerada
  const { data: faseOitavas } = await admin
    .from('fases')
    .select('id, prazo_apostas_em')
    .eq('edicao_id', edicao.id)
    .eq('nome', 'oitavas')
    .single() as any

  const gruposFormatados = (grupos ?? []).map((g: any) => ({
    id: g.id,
    nome: g.nome,
    encerrado: g.encerrado,
    selecoes: (g.grupos_selecoes ?? []).map((gs: any) => gs.selecoes).filter(Boolean),
    resultado: g.resultados_grupos?.[0] ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Grupos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre os classificados de cada grupo e gere a fase de oitavas.
        </p>
      </div>
      <GruposManager
        edicaoId={edicao.id}
        grupos={gruposFormatados}
        faseOitavasId={faseOitavas?.id ?? null}
      />
    </div>
  )
}
