'use client'

import { useState } from 'react'
import { Calculator, RotateCcw, Trophy, Shield, Star, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react'

// ── Pontuação por fase ────────────────────────────────────────────────────────
const FASE_PTS: Record<string, number> = {
  avos: 10, oitavas: 15, quartas: 20, semifinal: 25, final: 30,
}

const FASES = [
  { id: 'avos',      label: '16 Avos de Final',   pts: 10 },
  { id: 'oitavas',   label: 'Oitavas de Final',    pts: 15 },
  { id: 'quartas',   label: 'Quartas de Final',     pts: 20 },
  { id: 'semifinal', label: 'Semifinais',           pts: 25 },
  { id: 'final',     label: 'Final',                pts: 30 },
]

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// ── Lógica de pontuação ───────────────────────────────────────────────────────
function calcularGrupo(
  aposta: { p1: string; p2: string; p3: string },
  resultado: { p1: string; p2: string; p3: string; p3av: boolean },
) {
  const norm = (s: string) => s.trim().toLowerCase()
  const av = new Set([norm(resultado.p1), norm(resultado.p2)])
  if (norm(resultado.p3) && resultado.p3av) av.add(norm(resultado.p3))

  const detalhe: { time: string; posApostada: string; avancou: boolean; posExata: boolean; pts: number }[] = []

  function avaliar(nome: string, posApostada: string, posReal: string, terceiro_classificou?: boolean) {
    const n = norm(nome)
    if (!n) return
    const avancou = av.has(n)
    const posExata = (() => {
      if (!avancou) return false
      if (posApostada === '1º') return n === norm(resultado.p1)
      if (posApostada === '2º') return n === norm(resultado.p2)
      if (posApostada === '3º') return n === norm(resultado.p3) && (terceiro_classificou ?? false)
      return false
    })()
    const pts = avancou ? (5 + (posExata ? 5 : 0)) : 0
    detalhe.push({ time: nome.trim(), posApostada, avancou, posExata, pts })
  }

  avaliar(aposta.p1, '1º', resultado.p1)
  avaliar(aposta.p2, '2º', resultado.p2)
  if (aposta.p3.trim()) avaliar(aposta.p3, '3º', resultado.p3, resultado.p3av)

  return { total: detalhe.reduce((s, d) => s + d.pts, 0), detalhe }
}

function calcularMataMata(vencedorAp: string, vencedorReal: string, placAp: string, placApB: string, placRealA: string, placRealB: string, fase: string) {
  const norm = (s: string) => s.trim().toLowerCase()
  const acertouVencedor = norm(vencedorAp) === norm(vencedorReal) && norm(vencedorAp) !== ''
  const ehFinal = fase === 'final'
  const acertouPlacar = ehFinal && acertouVencedor &&
    placAp.trim() === placRealA.trim() && placApB.trim() === placRealB.trim() &&
    placAp.trim() !== '' && placRealA.trim() !== ''
  const pts = (acertouVencedor ? (FASE_PTS[fase] ?? 10) : 0) + (acertouPlacar ? 10 : 0)
  return { acertouVencedor, acertouPlacar, pts }
}

function calcularEspecial(apostado: string, real: string) {
  const norm = (s: string) => s.trim().toLowerCase()
  return norm(apostado) !== '' && norm(real) !== '' && norm(apostado) === norm(real)
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm'

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  )
}

function StatusIcon({ ok, neutro }: { ok: boolean; neutro?: boolean }) {
  if (neutro) return <MinusCircle size={16} className="text-muted-foreground shrink-0" />
  return ok
    ? <CheckCircle size={16} className="text-green-400 shrink-0" />
    : <XCircle size={16} className="text-red-400 shrink-0" />
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = 'grupos' | 'mata' | 'especiais'

// ── Simulador de um grupo ─────────────────────────────────────────────────────
function SimularGrupo({ grupoNome }: { grupoNome: string }) {
  const [aberto, setAberto] = useState(false)
  const [ap1, setAp1] = useState(''); const [ap2, setAp2] = useState(''); const [ap3, setAp3] = useState('')
  const [rp1, setRp1] = useState(''); const [rp2, setRp2] = useState(''); const [rp3, setRp3] = useState(''); const [rp3av, setRp3av] = useState(false)

  const temDados = ap1.trim() && ap2.trim() && rp1.trim() && rp2.trim()
  const res = temDados ? calcularGrupo({ p1: ap1, p2: ap2, p3: ap3 }, { p1: rp1, p2: rp2, p3: rp3, p3av: rp3av }) : null

  return (
    <div className="card-copa overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-sm">
            {grupoNome}
          </span>
          <span className="font-semibold text-sm">Grupo {grupoNome}</span>
        </div>
        <div className="flex items-center gap-3">
          {res && (
            <span className={`text-sm font-black ${res.total > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>
              {res.total} pts
            </span>
          )}
          {aberto ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {aberto && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-3">
              <div className="text-xs font-black text-primary uppercase tracking-wide">Sua Aposta</div>
              <Campo label="🥇 1º lugar" value={ap1} onChange={setAp1} placeholder="Ex: Brasil" />
              <Campo label="🥈 2º lugar" value={ap2} onChange={setAp2} placeholder="Ex: Argentina" />
              <Campo label="🥉 3º lugar" value={ap3} onChange={setAp3} placeholder="Ex: México" />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-black text-secondary uppercase tracking-wide">Resultado Real</div>
              <Campo label="🥇 1º lugar" value={rp1} onChange={setRp1} placeholder="Ex: Argentina" />
              <Campo label="🥈 2º lugar" value={rp2} onChange={setRp2} placeholder="Ex: Brasil" />
              <Campo label="🥉 3º lugar" value={rp3} onChange={setRp3} placeholder="Ex: México" />
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={rp3av} onChange={e => setRp3av(e.target.checked)} className="accent-primary w-4 h-4" />
                3º foi melhor terceiro?
              </label>
            </div>
          </div>

          {res ? (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              {res.detalhe.map(d => (
                <div key={d.time} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={d.avancou} />
                    <div>
                      <span className="font-semibold text-sm">{d.time}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{d.posApostada}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-black ${d.pts > 0 ? 'text-secondary' : 'text-muted-foreground'}`}>{d.pts} pts</span>
                    <div className="text-xs text-muted-foreground">
                      {!d.avancou && 'não avançou'}
                      {d.avancou && !d.posExata && '+ posição errada'}
                      {d.avancou && d.posExata && '+ posição certa ✓'}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-sm">Total Grupo {grupoNome}</span>
                <span className="text-xl font-black text-secondary">{res.total} pts</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Preencha 1º e 2º de ambos os lados para calcular.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SimularPage() {
  const [tab, setTab] = useState<Tab>('grupos')

  // Mata-mata
  const [fase, setFase] = useState('avos')
  const [mVenc, setMVenc] = useState(''); const [mPa, setMPa] = useState(''); const [mPb, setMPb] = useState('')
  const [mVencR, setMVencR] = useState(''); const [mPaR, setMPaR] = useState(''); const [mPbR, setMPbR] = useState('')
  const mataRes = mVenc.trim() && mVencR.trim()
    ? calcularMataMata(mVenc, mVencR, mPa, mPb, mPaR, mPbR, fase)
    : null

  // Especiais
  const [eArt, setEArt] = useState(''); const [eCrq, setECrq] = useState('')
  const [eGol, setEGol] = useState(''); const [eCamp, setECamp] = useState('')
  const [eArtR, setEArtR] = useState(''); const [eCrqR, setECrqR] = useState('')
  const [eGolR, setEGolR] = useState(''); const [eCampR, setECampR] = useState('')
  const espec = [
    { label: '⚡ Artilheiro', ap: eArt, real: eArtR },
    { label: '🌟 Craque', ap: eCrq, real: eCrqR },
    { label: '🧤 Melhor Goleiro', ap: eGol, real: eGolR },
    { label: '🏆 Seleção Campeã', ap: eCamp, real: eCampR },
  ]
  const especTotal = espec.filter(e => calcularEspecial(e.ap, e.real)).length * 10

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'grupos',   label: 'Grupos (A–L)',  icon: <Trophy size={14} /> },
    { id: 'mata',     label: 'Mata-Mata',     icon: <Shield size={14} /> },
    { id: 'especiais',label: 'Pré-Copa',      icon: <Star size={14} /> },
  ]

  const faseAtual = FASES.find(f => f.id === fase)!

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-black mb-3 uppercase tracking-wide">
          <Calculator size={13} />
          Simulador de Pontuação
        </div>
        <h1 className="text-2xl font-black">Simule sua Pontuação</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha aposta e resultado hipotético para ver os pontos.{' '}
          <strong className="text-foreground">Não afeta suas apostas reais.</strong>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── GRUPOS A-L ── */}
      {tab === 'grupos' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Clique em um grupo para expandir e simular a pontuação. Máximo de 30 pts por grupo (5 pts por avanço + 5 pts por posição × 3 times).
          </p>
          {GRUPOS.map(g => <SimularGrupo key={g} grupoNome={g} />)}
        </div>
      )}

      {/* ── MATA-MATA ── */}
      {tab === 'mata' && (
        <div className="space-y-4">
          {/* Seletor de fase */}
          <div className="card-copa p-4 space-y-2">
            <div className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-2">Fase</div>
            <div className="flex flex-wrap gap-2">
              {FASES.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFase(f.id); setMVenc(''); setMPa(''); setMPb(''); setMVencR(''); setMPaR(''); setMPbR('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    fase === f.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-70">{f.pts} pts</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-copa p-4 space-y-3">
              <div className="text-xs font-black text-primary uppercase tracking-wide">Sua Aposta</div>
              <Campo label="🏆 Vencedor apostado" value={mVenc} onChange={setMVenc} placeholder="Ex: Brasil" />
              {fase === 'final' && (
                <>
                  <div className="text-xs text-muted-foreground font-semibold">Placar apostado</div>
                  <div className="flex gap-2 items-center">
                    <input value={mPa} onChange={e => setMPa(e.target.value)} placeholder="0" className={inputCls + ' text-center'} maxLength={2} />
                    <span className="font-black text-muted-foreground">×</span>
                    <input value={mPb} onChange={e => setMPb(e.target.value)} placeholder="0" className={inputCls + ' text-center'} maxLength={2} />
                  </div>
                </>
              )}
            </div>
            <div className="card-copa p-4 space-y-3">
              <div className="text-xs font-black text-secondary uppercase tracking-wide">Resultado Real</div>
              <Campo label="🏆 Vencedor real" value={mVencR} onChange={setMVencR} placeholder="Ex: Argentina" />
              {fase === 'final' && (
                <>
                  <div className="text-xs text-muted-foreground font-semibold">Placar real</div>
                  <div className="flex gap-2 items-center">
                    <input value={mPaR} onChange={e => setMPaR(e.target.value)} placeholder="0" className={inputCls + ' text-center'} maxLength={2} />
                    <span className="font-black text-muted-foreground">×</span>
                    <input value={mPbR} onChange={e => setMPbR(e.target.value)} placeholder="0" className={inputCls + ' text-center'} maxLength={2} />
                  </div>
                </>
              )}
            </div>
          </div>

          {mataRes ? (
            <div className="card-copa p-5 space-y-3">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-wide">{faseAtual.label}</div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <StatusIcon ok={mataRes.acertouVencedor} />
                  <span className="text-sm">Acertou o vencedor</span>
                </div>
                <span className={`font-black text-lg ${mataRes.acertouVencedor ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {mataRes.acertouVencedor ? faseAtual.pts : 0} pts
                </span>
              </div>
              {fase === 'final' && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={mataRes.acertouPlacar} neutro={!mataRes.acertouVencedor} />
                    <span className="text-sm">Acertou o placar exato</span>
                  </div>
                  <span className={`font-black text-lg ${mataRes.acertouPlacar ? 'text-secondary' : 'text-muted-foreground'}`}>
                    {mataRes.acertouPlacar ? '+10' : '0'} pts
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black text-secondary">{mataRes.pts} pts</span>
              </div>
            </div>
          ) : (
            <div className="card-copa p-6 text-center text-muted-foreground text-sm">
              Preencha o vencedor apostado e o resultado real para simular.
            </div>
          )}

          {/* Tabela de pontos por fase */}
          <div className="card-copa p-4">
            <div className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Pontos por fase</div>
            <div className="space-y-1.5">
              {FASES.map(f => (
                <div key={f.id} className={`flex justify-between items-center text-sm py-1 ${f.id === fase ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  <span>{f.label}</span>
                  <span>{f.pts} pts{f.id === 'final' ? ' +10 (placar)' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ESPECIAIS ── */}
      {tab === 'especiais' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card-copa p-4 space-y-3">
              <div className="text-xs font-black text-primary uppercase tracking-wide">Sua Aposta</div>
              <Campo label="⚡ Artilheiro" value={eArt} onChange={setEArt} placeholder="Ex: Mbappé" />
              <Campo label="🌟 Craque" value={eCrq} onChange={setECrq} placeholder="Ex: Vinicius Jr." />
              <Campo label="🧤 Melhor Goleiro" value={eGol} onChange={setEGol} placeholder="Ex: Alisson" />
              <Campo label="🏆 Seleção Campeã" value={eCamp} onChange={setECamp} placeholder="Ex: Brasil" />
            </div>
            <div className="card-copa p-4 space-y-3">
              <div className="text-xs font-black text-secondary uppercase tracking-wide">Resultado Real</div>
              <Campo label="⚡ Artilheiro" value={eArtR} onChange={setEArtR} placeholder="Ex: Mbappé" />
              <Campo label="🌟 Craque" value={eCrqR} onChange={setECrqR} placeholder="Ex: Vinicius Jr." />
              <Campo label="🧤 Melhor Goleiro" value={eGolR} onChange={setEGolR} placeholder="Ex: Alisson" />
              <Campo label="🏆 Seleção Campeã" value={eCampR} onChange={setECampR} placeholder="Ex: Brasil" />
            </div>
          </div>

          <div className="card-copa p-5 space-y-3">
            <div className="text-xs font-black text-muted-foreground uppercase tracking-wide">Resultado</div>
            {espec.map(e => {
              const temDados = e.ap.trim() && e.real.trim()
              const acertou = temDados && calcularEspecial(e.ap, e.real)
              return (
                <div key={e.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusIcon ok={!!acertou} neutro={!temDados} />
                    <span className="text-sm">{e.label}</span>
                  </div>
                  <span className={`font-black text-lg ${acertou ? 'text-secondary' : 'text-muted-foreground'}`}>
                    {acertou ? '10' : temDados ? '0' : '—'} pts
                  </span>
                </div>
              )
            })}
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold">Total Pré-Copa</span>
              <span className="text-2xl font-black text-secondary">{especTotal} pts</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setMVenc(''); setMPa(''); setMPb(''); setMVencR(''); setMPaR(''); setMPbR('')
          setEArt(''); setECrq(''); setEGol(''); setECamp('')
          setEArtR(''); setECrqR(''); setEGolR(''); setECampR('')
        }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <RotateCcw size={14} />
        Limpar simulação
      </button>

      <p className="text-xs text-center text-muted-foreground pb-4">
        Ferramenta de consulta — suas apostas reais não são alteradas.
      </p>
    </div>
  )
}
