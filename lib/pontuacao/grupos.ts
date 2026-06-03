export interface ApostaGrupo {
  primeiro_id: string
  segundo_id: string
  terceiro_id: string
}

export interface ResultadoGrupo {
  primeiro_id: string
  segundo_id: string
  terceiro_id?: string | null
  terceiro_classificou?: boolean | null
}

/**
 * Regras:
 * - Cada seleção apostada é avaliada independentemente.
 * - Se a seleção apostada avançou de fase → +5
 * - Se avançou E ficou na posição exata apostada → +5 bônus
 * - Para 3º: "avançou" significa ter sido uma das melhores 3ªs (terceiro_classificou=true)
 * - Se ficou em 3º mas não avançou → 0 pontos (regra 4)
 * - Se foi apostada em 3º mas avançou em 1º ou 2º → +5 apenas, sem bônus (regra 5)
 * - O bônus de posição nunca é concedido se a seleção não avançou (regra 6)
 */
export function calcularPontosGrupo(
  aposta: ApostaGrupo,
  resultado: ResultadoGrupo
): number {
  const avancaram = new Set([resultado.primeiro_id, resultado.segundo_id])
  if (resultado.terceiro_id && resultado.terceiro_classificou) {
    avancaram.add(resultado.terceiro_id)
  }

  let pontos = 0

  // Seleção apostada em 1º
  if (avancaram.has(aposta.primeiro_id)) {
    pontos += 5
    if (aposta.primeiro_id === resultado.primeiro_id) pontos += 5
  }

  // Seleção apostada em 2º
  if (avancaram.has(aposta.segundo_id)) {
    pontos += 5
    if (aposta.segundo_id === resultado.segundo_id) pontos += 5
  }

  // Seleção apostada em 3º
  if (avancaram.has(aposta.terceiro_id)) {
    pontos += 5
    // Bônus somente se ficou EXATAMENTE em 3º e avançou como melhor 3ª (regras 4, 5, 6)
    if (
      aposta.terceiro_id === resultado.terceiro_id &&
      resultado.terceiro_classificou === true
    ) {
      pontos += 5
    }
  }
  // Ficou em 3º mas não avançou → 0 (regra 4, já tratado pelo avancaram.has)

  return pontos
}
