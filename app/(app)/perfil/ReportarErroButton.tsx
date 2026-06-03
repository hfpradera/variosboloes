'use client'
import { useState } from 'react'
import { AlertTriangle, Send, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

export function ReportarErroButton() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')

  async function enviar() {
    if (!mensagem.trim()) return
    setEstado('loading')
    try {
      const res = await fetch('/api/me/reportar-erro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem }),
      })
      if (res.ok) {
        setEstado('ok')
        setMensagem('')
        setTimeout(() => { setEstado('idle'); setAberto(false) }, 3000)
      } else {
        setEstado('erro')
      }
    } catch {
      setEstado('erro')
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle size={15} />
          Reportar um problema
        </span>
        {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {aberto && (
        <div className="space-y-2 px-1">
          <textarea
            value={mensagem}
            onChange={e => { setMensagem(e.target.value); if (estado !== 'idle') setEstado('idle') }}
            placeholder="Descreva o problema que encontrou..."
            rows={3}
            maxLength={1000}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{mensagem.length}/1000</span>
            <button
              onClick={enviar}
              disabled={!mensagem.trim() || estado === 'loading' || estado === 'ok'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {estado === 'ok' ? (
                <><CheckCircle size={13} /> Enviado!</>
              ) : (
                <><Send size={13} /> {estado === 'loading' ? 'Enviando...' : 'Enviar'}</>
              )}
            </button>
          </div>
          {estado === 'erro' && (
            <p className="text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
          )}
        </div>
      )}
    </div>
  )
}
