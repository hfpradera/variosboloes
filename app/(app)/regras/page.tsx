import { Trophy, Target, Star, Clock, Shield, Gift, Zap, Calculator } from 'lucide-react'
import Link from 'next/link'

export default function RegrasPage() {
  return (
    <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Trophy className="text-secondary" size={28} />
          Regras e Pontuação
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bolão Copa do Mundo 2026 — EUA · Canadá · México
        </p>
        <Link
          href="/simular"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Calculator size={15} />
          Simular pontuação
        </Link>
      </div>

      {/* Fase de Grupos */}
      <section className="card-copa p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Target size={20} className="text-primary" />
          Fase de Grupos
        </h2>

        <p className="text-sm text-muted-foreground">
          Antes do início do grupo, você escolhe quem fica em <strong className="text-foreground">1º, 2º e 3º lugar</strong> (todos obrigatórios).
          Cada time apostado vale pontos independentemente dos outros.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
            <div className="text-2xl font-black text-primary min-w-[3rem] text-center">5</div>
            <div>
              <div className="font-semibold text-sm">Por cada seleção classificada que você apostou</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Se o time que você apostou em 1º, 2º ou 3º se classificar para a 16ª de final (em qualquer posição), você ganha 5 pts por ele.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
            <div className="text-2xl font-black text-secondary min-w-[3rem] text-center">+5</div>
            <div>
              <div className="font-semibold text-sm">Bônus por acertar a posição exata (1º, 2º ou 3º)</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                +5 pts extras se o time apostado em 1º ficou em 1º. Outros +5 se o apostado em 2º ficou em 2º. Outros +5 se o apostado em 3º ficou em 3º — desde que tenha sido um dos 8 melhores terceiros e avançado.
              </div>
            </div>
          </div>

        </div>

        {/* Exemplos */}
        <div className="space-y-3">
          <div className="font-semibold text-sm text-primary flex items-center gap-2">
            <Calculator size={14} />
            Exemplos — Grupo do Brasil
          </div>

          {/* Exemplo 1 */}
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
              <span className="font-bold text-green-400">Exemplo 1 — Acerto total</span>
              <span className="font-black text-green-400">30 pts</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Sua aposta</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Resultado</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos <span className="text-green-400">(avançou)</span></p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { time: 'Brasil', linhas: ['+5 posição correta', '+5 classificou'], total: 10 },
                  { time: 'Escócia', linhas: ['+5 posição correta', '+5 classificou'], total: 10 },
                  { time: 'Marrocos', linhas: ['+5 posição correta', '+5 avançou como melhor 3º'], total: 10 },
                ].map(({ time, linhas, total }) => (
                  <div key={time} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-foreground">{time}: </span>
                      <span className="text-muted-foreground">{linhas.join(' · ')}</span>
                    </div>
                    <span className="font-bold text-green-400 shrink-0">= {total} pts</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-2">Todos ficaram exatamente na posição apostada e o 3º avançou.</p>
            </div>
          </div>

          {/* Exemplo 2 */}
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-between">
              <span className="font-bold text-yellow-400">Exemplo 2 — 2º apostado terminou em 3º (avançou)</span>
              <span className="font-black text-yellow-400">20 pts</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Sua aposta</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Resultado</p>
                  <p>🥇 Brasil</p><p>🥈 Marrocos</p><p>🥉 Escócia <span className="text-green-400">(avançou)</span></p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Brasil: </span><span className="text-muted-foreground">+5 posição correta · +5 classificou</span></div>
                  <span className="font-bold text-green-400 shrink-0">= 10 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Marrocos: </span><span className="text-muted-foreground">+5 classificou (posição errada, sem bônus)</span></div>
                  <span className="font-bold text-yellow-400 shrink-0">= 5 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Escócia: </span><span className="text-muted-foreground">+5 avançou como melhor 3º (apostada em 2º, sem bônus de posição)</span></div>
                  <span className="font-bold text-yellow-400 shrink-0">= 5 pts</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-2">Escócia e Marrocos classificaram mas não ficaram na posição apostada — apenas 5 pts cada.</p>
            </div>
          </div>

          {/* Exemplo 3 */}
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between">
              <span className="font-bold text-orange-400">Exemplo 3 — Acertou o 3º, mas ele foi eliminado</span>
              <span className="font-black text-orange-400">20 pts</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Sua aposta</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Resultado</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos <span className="text-red-400">(eliminado)</span></p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Brasil: </span><span className="text-muted-foreground">+5 posição correta · +5 classificou</span></div>
                  <span className="font-bold text-green-400 shrink-0">= 10 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Escócia: </span><span className="text-muted-foreground">+5 posição correta · +5 classificou</span></div>
                  <span className="font-bold text-green-400 shrink-0">= 10 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Marrocos: </span><span className="text-muted-foreground">posição correta, mas não avançou — 0 pts</span></div>
                  <span className="font-bold text-red-400 shrink-0">= 0 pts</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-0.5">
                <p>O 3º colocado só pontua se for um dos 8 melhores terceiros da fase de grupos.</p>
                <p>Acertar a posição não basta — ele precisa avançar para gerar pontos.</p>
              </div>
            </div>
          </div>

          {/* Exemplo 4 */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
              <span className="font-bold text-red-400">Exemplo 4 — 1º apostado terminou em 2º</span>
              <span className="font-black text-red-400">5 pts</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Sua aposta</p>
                  <p>🥇 Brasil</p><p>🥈 Escócia</p><p>🥉 Marrocos</p>
                </div>
                <div className="bg-black/20 rounded-lg p-2.5">
                  <p className="text-muted-foreground mb-1 font-semibold uppercase tracking-wide" style={{fontSize:'10px'}}>Resultado</p>
                  <p>🥇 Croácia</p><p>🥈 Brasil</p><p>🥉 Portugal <span className="text-green-400">(avançou)</span></p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Brasil: </span><span className="text-muted-foreground">+5 classificou (apostado em 1º, terminou em 2º — sem bônus de posição)</span></div>
                  <span className="font-bold text-yellow-400 shrink-0">= 5 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Escócia: </span><span className="text-muted-foreground">eliminada</span></div>
                  <span className="font-bold text-red-400 shrink-0">= 0 pts</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div><span className="font-semibold text-foreground">Marrocos: </span><span className="text-muted-foreground">eliminado</span></div>
                  <span className="font-bold text-red-400 shrink-0">= 0 pts</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-2">Brasil classificou mas não na posição apostada — vale apenas os 5 pts de classificação.</p>
            </div>
          </div>

        </div>

        <div className="text-center p-3 rounded-xl bg-secondary/10 text-secondary font-black text-lg">
          Máximo por grupo: 30 pts
        </div>
      </section>

      {/* Mata-mata */}
      <section className="card-copa p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Shield size={20} className="text-primary" />
          Mata-mata
        </h2>

        <p className="text-sm text-muted-foreground">
          A cada fase, você aposta em quem avança. As apostas devem ser feitas <strong className="text-foreground">antes do início de cada fase</strong>.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { fase: '16 Avos de Final', pts: 10, jogos: 16, cor: 'border-blue-500/30 bg-blue-500/5' },
            { fase: 'Oitavas de Final', pts: 15, jogos: 8, cor: 'border-purple-500/30 bg-purple-500/5' },
            { fase: 'Quartas de Final', pts: 20, jogos: 4, cor: 'border-orange-500/30 bg-orange-500/5' },
            { fase: 'Semifinais', pts: 25, jogos: 2, cor: 'border-red-500/30 bg-red-500/5' },
            { fase: 'Final', pts: 30, jogos: 1, cor: 'border-secondary/30 bg-secondary/5' },
          ].map(({ fase, pts, jogos, cor }) => (
            <div key={fase} className={`p-4 rounded-xl border text-center ${cor}`}>
              <div className="text-2xl font-black text-foreground">{pts}</div>
              <div className="text-xs text-muted-foreground">pts por acerto</div>
              <div className="font-semibold text-sm mt-2">{fase}</div>
              <div className="text-xs text-muted-foreground">{jogos} {jogos === 1 ? 'jogo' : 'jogos'}</div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-secondary/30 bg-secondary/5">
          <div className="text-2xl font-black text-secondary min-w-[3rem] text-center">+10</div>
          <div>
            <div className="font-semibold text-sm">Bônus por acertar o placar da Final</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Além do campeão, você chuta o placar (incluindo eventual prorrogação). Se acertar exatamente, ganha +10 pontos extras.
            </div>
          </div>
        </div>
      </section>

      {/* Pré-Copa */}
      <section className="card-copa p-6 space-y-3">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Star size={20} className="text-secondary" />
          Pré-Copa
        </h2>
        <p className="text-sm text-muted-foreground">
          Antes do início da Copa, você indica quatro apostas especiais. Cada acerto vale <strong className="text-foreground">10 pontos</strong>.
        </p>
        <div className="space-y-2">
          {[
            { icon: <Zap size={14} className="text-secondary" />, label: 'Artilheiro da Copa', desc: 'Jogador com mais gols no torneio' },
            { icon: <Star size={14} className="text-secondary" />, label: 'Craque da Copa', desc: 'Melhor jogador (Bola de Ouro)' },
            { icon: <Shield size={14} className="text-secondary" />, label: 'Melhor Goleiro', desc: 'Luva de Ouro da Copa' },
            { icon: <Trophy size={14} className="text-secondary" />, label: 'Seleção Campeã', desc: 'País vencedor da Copa do Mundo 2026' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="text-2xl font-black text-secondary min-w-[3rem] text-center">10</div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5">{icon}{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prazos */}
      <section className="card-copa p-6 space-y-3">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Prazos
        </h2>
        <div className="space-y-2 text-sm">
          {[
            { prazo: 'Grupos + Pré-Copa', regra: 'Até 10/06/2026 às 23h59. Após essa data nenhuma aposta pode ser alterada.' },
            { prazo: '16 Avos de Final', regra: 'Até 27/06/2026 às 23h59.' },
            { prazo: 'Oitavas de Final', regra: 'Até 03/07/2026 às 23h59.' },
            { prazo: 'Quartas de Final', regra: 'Até 08/07/2026 às 23h59.' },
            { prazo: 'Semifinais', regra: 'Até 13/07/2026 às 23h59.' },
            { prazo: 'Final + Placar', regra: 'Até 18/07/2026 às 23h59.' },
          ].map(({ prazo, regra }) => (
            <div key={prazo} className="flex gap-3 p-3 rounded-lg bg-muted">
              <div className="font-semibold text-primary min-w-[9rem] shrink-0">{prazo}</div>
              <div className="text-muted-foreground">{regra}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠ Não é possível apostar após o prazo. O sistema bloqueia automaticamente.
        </p>
      </section>

      {/* Anti-cópia */}
      <section className="card-copa p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Shield size={20} className="text-red-400" />
          Sistema Anti-Cópia
        </h2>

        <p className="text-sm text-muted-foreground">
          As apostas permanecem <strong className="text-foreground">ocultas apenas até o encerramento do prazo</strong> de alteração da respectiva fase.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-border bg-muted space-y-1.5">
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <span className="text-yellow-400">🔒</span> Prazo aberto
            </div>
            <p className="text-xs text-muted-foreground">
              Somente você vê as suas apostas. As apostas dos outros participantes ficam ocultas.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 space-y-1.5">
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <span className="text-green-400">🔓</span> Após o prazo encerrar
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as apostas daquela fase tornam-se públicas automaticamente. Todos podem ver as apostas de todos.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted text-sm space-y-1.5">
          <div className="font-semibold text-foreground mb-2">Aplica-se a todas as fases:</div>
          {[
            'Fase de Grupos',
            'Pré-Copa',
            '16 Avos de Final',
            'Oitavas de Final',
            'Quartas de Final',
            'Semifinais',
            'Final',
          ].map(fase => (
            <p key={fase} className="text-muted-foreground text-xs">• {fase}</p>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Após o encerramento do prazo, os participantes podem acompanhar as apostas de todos, as pontuações individuais e a disputa do ranking em tempo real.
        </p>
      </section>

      {/* Premiação */}
      <section className="card-copa p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Gift size={20} className="text-secondary" />
          Premiação
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-secondary/30 bg-secondary/5 text-center">
            <div className="text-3xl mb-1">🥇</div>
            <div className="text-2xl font-black text-secondary">70%</div>
            <div className="text-sm text-muted-foreground">do valor arrecadado</div>
            <div className="font-semibold mt-1">1º lugar</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted text-center">
            <div className="text-3xl mb-1">🥈</div>
            <div className="text-2xl font-black">30%</div>
            <div className="text-sm text-muted-foreground">do valor arrecadado</div>
            <div className="font-semibold mt-1">2º lugar</div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Empate de pontuação</p>
          <p><strong className="text-foreground">Empate na 1ª colocação:</strong> Se dois ou mais participantes terminarem com a mesma pontuação na primeira colocação, o prêmio total (70% + 30%) é dividido igualmente entre eles. Nesse caso, não haverá prêmio separado para a 2ª colocação.</p>
          <p><strong className="text-foreground">Empate na 2ª colocação:</strong> Não havendo empate na 1ª colocação, se dois ou mais participantes terminarem com a mesma pontuação na segunda colocação, o prêmio da 2ª colocação (30%) é dividido igualmente entre eles.</p>
          <p>Não há critério de desempate.</p>
        </div>
      </section>

      {/* Resumo de pontos */}
      <section className="card-copa p-6 space-y-3">
        <h2 className="font-black text-lg">Resumo de Pontuação</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left pb-2">Fase</th>
                <th className="text-right pb-2">Pontos</th>
                <th className="text-right pb-2">Máximo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { fase: 'Grupos (12 grupos)', pts: '5–30 por grupo', max: '360 pts' },
                { fase: 'Artilheiro da Copa', pts: '10', max: '10 pts' },
                { fase: 'Craque da Copa', pts: '10', max: '10 pts' },
                { fase: 'Melhor Goleiro', pts: '10', max: '10 pts' },
                { fase: 'Seleção Campeã', pts: '10', max: '10 pts' },
                { fase: '16 Avos de Final (16 jogos)', pts: '10 por acerto', max: '160 pts' },
                { fase: 'Oitavas de Final (8 jogos)', pts: '15 por acerto', max: '120 pts' },
                { fase: 'Quartas de Final (4 jogos)', pts: '20 por acerto', max: '80 pts' },
                { fase: 'Semifinais (2 jogos)', pts: '25 por acerto', max: '50 pts' },
                { fase: 'Final — campeão', pts: '30', max: '30 pts' },
                { fase: 'Final — placar exato', pts: '+10', max: '10 pts' },
              ].map(({ fase, pts, max }) => (
                <tr key={fase}>
                  <td className="py-2.5 text-muted-foreground">{fase}</td>
                  <td className="py-2.5 text-right font-medium">{pts}</td>
                  <td className="py-2.5 text-right text-secondary font-bold">{max}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-black">
                <td className="pt-3">Total máximo teórico</td>
                <td></td>
                <td className="pt-3 text-right text-secondary text-lg">850 pts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
