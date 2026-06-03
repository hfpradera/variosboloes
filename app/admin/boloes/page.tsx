/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import { BolaoManager } from './BolaoManager'

export const revalidate = 0

export default async function AdminBoloesPage() {
  const admin = createAdminClient()

  const [boloesRes, edicoesRes] = await Promise.all([
    (admin.from('boloes') as any)
      .select('id, nome, descricao, ativo, criado_em, edicao_id, edicoes(nome)')
      .order('criado_em'),
    (admin.from('edicoes') as any)
      .select('id, nome')
      .order('created_at', { ascending: false }),
  ])

  const boloes = ((boloesRes.data ?? []) as any[]).map((b: any) => ({
    id: b.id as string,
    nome: b.nome as string,
    descricao: b.descricao as string | null,
    ativo: b.ativo as boolean,
    criado_em: b.criado_em as string,
    edicao_id: b.edicao_id as string,
    edicao_nome: (b.edicoes as any)?.nome as string,
  }))

  const edicoes = ((edicoesRes.data ?? []) as any[]).map((e: any) => ({
    id: e.id as string,
    nome: e.nome as string,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Bolões</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie e gerencie os bolões. Cada bolão é um grupo independente de participantes.
        </p>
      </div>
      <BolaoManager boloes={boloes} edicoes={edicoes} />
    </div>
  )
}
