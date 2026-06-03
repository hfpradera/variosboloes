import { createAdminClient } from '@/lib/supabase/admin'
import { calcularPontosGrupo } from './grupos'
import { calcularPontosMataMata, calcularPontosArtilheiro, type NomeFase } from './mata-mata'

export async function recalcularPontuacaoEdicao(edicaoId: string) {
  const supabase = createAdminClient()

  // Buscar todos os usuários que têm apostas nesta edição
  const { data: usuarios } = await supabase
    .from('apostas_grupos')
    .select('user_id')
    .eq('grupo_id', supabase.from('grupos').select('id').eq('edicao_id', edicaoId) as unknown as string)

  // Buscar todos os perfis confirmados
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id')
    .eq('pagamento_confirmado', true)
    .eq('bloqueado', false)

  if (!perfis) return

  for (const perfil of perfis) {
    await recalcularPontuacaoUsuario(edicaoId, perfil.id)
  }
}

export async function recalcularPontuacaoUsuario(edicaoId: string, userId: string) {
  const supabase = createAdminClient()

  let pontosGrupos = 0
  let pontosOitavas = 0
  let pontosQuartas = 0
  let pontosSemifinal = 0
  let pontosSemi = 0
  let pontosFinal = 0
  let pontosArtilheiro = 0
  let acertosTotal = 0
  let acertosFinal = 0
  let acertosSemifinal = 0

  // ── Pontos Grupos ──────────────────────────────────────────
  const { data: grupos } = await supabase
    .from('grupos')
    .select('id')
    .eq('edicao_id', edicaoId)

  if (grupos) {
    for (const grupo of grupos) {
      const [apostasRes, resultadoRes] = await Promise.all([
        supabase.from('apostas_grupos')
          .select('primeiro_id, segundo_id, terceiro_id')
          .eq('user_id', userId)
          .eq('grupo_id', grupo.id)
          .single(),
        supabase.from('resultados_grupos')
          .select('primeiro_id, segundo_id, terceiro_id, terceiro_classificou')
          .eq('grupo_id', grupo.id)
          .single(),
      ])

      if (apostasRes.data && resultadoRes.data) {
        const pts = calcularPontosGrupo(apostasRes.data, resultadoRes.data)
        pontosGrupos += pts
        if (pts > 0) acertosTotal++
      }
    }
  }

  // ── Pontos Mata-mata ───────────────────────────────────────
  const { data: fases } = await supabase
    .from('fases')
    .select('id, nome')
    .eq('edicao_id', edicaoId)

  if (fases) {
    for (const fase of fases) {
      const { data: confrontos } = await supabase
        .from('confrontos')
        .select('id, vencedor_id, placar_a, placar_b')
        .eq('fase_id', fase.id)
        .not('vencedor_id', 'is', null)

      if (!confrontos) continue

      for (const confronto of confrontos) {
        const { data: aposta } = await supabase
          .from('apostas_confrontos')
          .select('selecao_vencedor_id, placar_a, placar_b')
          .eq('user_id', userId)
          .eq('confronto_id', confronto.id)
          .single()

        if (!aposta) continue

        const { pontos, acertou } = calcularPontosMataMata(
          aposta,
          { vencedor_id: confronto.vencedor_id!, placar_a: confronto.placar_a, placar_b: confronto.placar_b },
          fase.nome as NomeFase
        )

        if (acertou) acertosTotal++

        switch (fase.nome as NomeFase) {
          case 'oitavas': pontosOitavas += pontos; break
          case 'quartas': pontosQuartas += pontos; break
          case 'semifinal':
            pontosSemifinal += pontos
            if (acertou) acertosSemifinal++
            break
          case 'semi': pontosSemi += pontos; break
          case 'final':
            pontosFinal += pontos
            if (acertou) acertosFinal++
            break
        }
      }
    }
  }

  // ── Pontos Artilheiro + Craque + Goleiro ──────────────────
  const [apostaDo, resultadoOficial] = await Promise.all([
    supabase.from('apostas_artilheiro')
      .select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
      .eq('user_id', userId)
      .eq('edicao_id', edicaoId)
      .single(),
    supabase.from('artilheiros')
      .select('jogador_nome, craque_nome, goleiro_nome, campea_nome')
      .eq('edicao_id', edicaoId)
      .single(),
  ])

  if (apostaDo.data && resultadoOficial.data) {
    const ad = apostaDo.data as any
    const ro = resultadoOficial.data as any
    if (ad.jogador_nome && ro.jogador_nome)
      pontosArtilheiro += calcularPontosArtilheiro(ad.jogador_nome, ro.jogador_nome)
    if (ad.craque_nome && ro.craque_nome)
      pontosArtilheiro += calcularPontosArtilheiro(ad.craque_nome, ro.craque_nome)
    if (ad.goleiro_nome && ro.goleiro_nome)
      pontosArtilheiro += calcularPontosArtilheiro(ad.goleiro_nome, ro.goleiro_nome)
    if (ad.campea_nome && ro.campea_nome)
      pontosArtilheiro += calcularPontosArtilheiro(ad.campea_nome, ro.campea_nome)
  }

  const pontosTotal =
    pontosGrupos + pontosOitavas + pontosQuartas +
    pontosSemifinal + pontosSemi + pontosFinal + pontosArtilheiro

  // Upsert na tabela de pontuações
  await supabase.from('pontuacoes').upsert({
    user_id: userId,
    edicao_id: edicaoId,
    pontos_grupos: pontosGrupos,
    pontos_oitavas: pontosOitavas,
    pontos_quartas: pontosQuartas,
    pontos_semifinal: pontosSemifinal,
    pontos_semi: pontosSemi,
    pontos_final: pontosFinal,
    pontos_artilheiro: pontosArtilheiro,
    pontos_total: pontosTotal,
    acertos_total: acertosTotal,
    acertos_final: acertosFinal,
    acertos_semifinal: acertosSemifinal,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'user_id,edicao_id' })
}
