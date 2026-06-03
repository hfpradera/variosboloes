export type NomeFase = 'oitavas' | 'quartas' | 'semifinal' | 'semi' | 'final'

const PONTOS_POR_FASE: Record<NomeFase, number> = {
  oitavas: 10,
  quartas: 15,
  semifinal: 20,
  semi: 25,
  final: 30,
}

export interface ResultadoConfronro {
  vencedor_id: string
  placar_a?: number | null
  placar_b?: number | null
}

export interface ApostaConfronro {
  selecao_vencedor_id: string
  placar_a?: number | null
  placar_b?: number | null
}

export function calcularPontosMataMata(
  aposta: ApostaConfronro,
  resultado: ResultadoConfronro,
  fase: NomeFase
): { pontos: number; acertou: boolean } {
  if (aposta.selecao_vencedor_id !== resultado.vencedor_id) {
    return { pontos: 0, acertou: false }
  }

  let pontos = PONTOS_POR_FASE[fase]

  if (
    fase === 'final' &&
    aposta.placar_a != null && aposta.placar_b != null &&
    resultado.placar_a != null && resultado.placar_b != null &&
    aposta.placar_a === resultado.placar_a &&
    aposta.placar_b === resultado.placar_b
  ) {
    pontos += 10
  }

  return { pontos, acertou: true }
}

export function calcularPontosArtilheiro(
  jogadorAposta: string,
  jogadorOficial: string
): number {
  return jogadorAposta.trim().toLowerCase() === jogadorOficial.trim().toLowerCase() ? 10 : 0
}
