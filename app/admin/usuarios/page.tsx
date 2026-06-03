/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import { UsuariosTable } from './UsuariosTable'

export const revalidate = 0

export default async function UsuariosAdminPage() {
  const supabase = createAdminClient()

  const [usuariosRes, edicaoRes] = await Promise.all([
    supabase
      .from('perfis')
      .select('id, nome, pagamento_confirmado, bloqueado, is_admin, aprovado, criado_em')
      .order('nome'),
    supabase
      .from('edicoes')
      .select('id')
      .in('status', ['aberto', 'em_andamento', 'encerrado'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const usuarios = usuariosRes.data ?? []
  const edicaoId = (edicaoRes.data as any)?.id as string | null

  // Buscar contagem de apostas de grupos por usuário
  const { data: apostasGrupos } = await (supabase.from('apostas_grupos') as any)
    .select('user_id')

  const gruposPorUser = new Map<string, number>()
  for (const a of apostasGrupos ?? []) {
    gruposPorUser.set(a.user_id, (gruposPorUser.get(a.user_id) ?? 0) + 1)
  }

  // Buscar quem apostou nos especiais
  const { data: apostasEspeciais } = edicaoId
    ? await (supabase.from('apostas_artilheiro') as any)
        .select('user_id')
        .eq('edicao_id', edicaoId)
    : { data: [] }

  const especiaisPorUser = new Set<string>(
    (apostasEspeciais ?? []).map((a: any) => a.user_id)
  )

  // Montar lista com status de apostas
  const usuariosComStatus = usuarios.map((u: any) => ({
    ...u,
    grupos_apostados: gruposPorUser.get(u.id) ?? 0,
    apostou_especiais: especiaisPorUser.has(u.id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Confirme pagamentos, bloqueie participantes ou promova a admin.
        </p>
      </div>
      <UsuariosTable usuarios={usuariosComStatus} totalGrupos={12} />
    </div>
  )
}
