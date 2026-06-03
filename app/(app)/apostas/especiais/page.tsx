import { createClient } from '@/lib/supabase/server'
import { EspeciaisForm } from './EspeciaisForm'
import { Star } from 'lucide-react'

export const revalidate = 0

export default async function EspeciaisPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [edicaoRes, selecoesRes] = await Promise.all([
    supabase
      .from('edicoes')
      .select('id, status')
      .in('status', ['aberto', 'em_andamento'])
      .eq('ano', 2026)
      .single() as any,
    supabase
      .from('selecoes')
      .select('nome')
      .order('nome') as any,
  ])

  const edicao = edicaoRes.data
  const selecoes: string[] = (selecoesRes.data ?? []).map((s: { nome: string }) => s.nome)

  if (!edicao) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Sem edição ativa no momento.</p>
      </div>
    )
  }

  const { data: aposta } = await supabase
    .from('apostas_artilheiro')
    .select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
    .eq('user_id', user!.id)
    .eq('edicao_id', edicao.id)
    .single() as any

  const prazoEncerrado = new Date() >= new Date('2026-06-11T02:59:00Z')

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Star className="text-secondary" size={28} />
          Pré-Copa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Apostas especiais — prazo até <strong className="text-foreground">10/06/2026</strong>.
          Cada acerto vale <strong className="text-foreground">10 pontos</strong>.
        </p>
      </div>

      {prazoEncerrado && (
        <div className="card-copa p-4 text-center text-muted-foreground text-sm">
          O prazo para apostas especiais foi encerrado em 10/06/2026.
        </div>
      )}

      <EspeciaisForm
        edicaoId={edicao.id}
        aposta={aposta ?? null}
        prazoEncerrado={prazoEncerrado}
        selecoes={selecoes}
      />
    </div>
  )
}
