import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Lock, ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const FASE_INFO: Record<string, { nome: string; pts: number; jogos: number }> = {
  oitavas:   { nome: '16 Avos de Final',  pts: 10, jogos: 16 },
  quartas:   { nome: 'Oitavas de Final',  pts: 15, jogos: 8  },
  semifinal: { nome: 'Quartas de Final',  pts: 20, jogos: 4  },
  semi:      { nome: 'Semifinais',        pts: 25, jogos: 2  },
  final:     { nome: 'Final',             pts: 30, jogos: 1  },
}

const ORDEM = ['oitavas', 'quartas', 'semifinal', 'semi', 'final']

export const revalidate = 60

export default async function MataMataHubPage() {
  const supabase = await createClient()

  const { data: edicao } = await supabase
    .from('edicoes')
    .select('id, nome')
    .in('status', ['aberto', 'em_andamento'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as any

  if (!edicao) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Nenhuma edição ativa no momento.</p>
      </div>
    )
  }

  const { data: fases } = await supabase
    .from('fases')
    .select('id, nome, apostas_liberadas, prazo_apostas_em')
    .eq('edicao_id', edicao.id) as any

  const fasesMap = new Map((fases ?? []).map((f: any) => [f.nome, f]))
  const agora = new Date()

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Shield className="text-primary" size={28} />
          Apostas Mata-mata
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          As apostas de cada fase são liberadas pelo administrador. Cada fase tem seu próprio prazo.
        </p>
      </div>

      <div className="space-y-3">
        {ORDEM.map(nomeFase => {
          const info = FASE_INFO[nomeFase]
          const fase = fasesMap.get(nomeFase)
          const liberada = fase?.apostas_liberadas === true
          const prazoPassou = fase?.prazo_apostas_em && new Date(fase.prazo_apostas_em) <= agora
          const aberta = liberada && !prazoPassou

          return (
            <div
              key={nomeFase}
              className={cn(
                'card-copa p-5 flex items-center justify-between gap-4',
                !liberada && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[3rem]">
                  <div className="text-2xl font-black text-secondary">{info.pts}</div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
                <div>
                  <div className="font-bold">{info.nome}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {info.jogos} {info.jogos === 1 ? 'jogo' : 'jogos'}
                    {nomeFase === 'final' && ' · +10 pts por placar exato'}
                  </div>
                  {fase?.prazo_apostas_em && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock size={11} />
                      Prazo: {new Date(fase.prazo_apostas_em).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {!liberada ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Lock size={12} /> Em breve
                  </span>
                ) : prazoPassou ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Lock size={12} /> Encerrado
                  </span>
                ) : (
                  <Link
                    href={`/apostas/mata-mata/${nomeFase}`}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                  >
                    Apostar <ChevronRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
