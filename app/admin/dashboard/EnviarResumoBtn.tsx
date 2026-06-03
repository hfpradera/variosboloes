'use client'

import { useState, useTransition } from 'react'
import { Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export function EnviarResumoBtn() {
  const [resultado, setResultado] = useState<{ enviados?: number; total?: number; erros?: string[] } | null>(null)
  const [erro, setErro] = useState('')
  const [saving, start] = useTransition()

  async function enviar() {
    if (!confirm('Enviar email de resumo para todos os participantes com apostas?')) return
    setErro('')
    setResultado(null)

    start(async () => {
      try {
        const res = await fetch('/api/admin/enviar-resumo', { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          setResultado(data)
        } else {
          setErro(data.error ?? 'Erro ao enviar emails')
        }
      } catch {
        setErro('Erro de conexão')
      }
    })
  }

  return (
    <div className="card-copa p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Mail size={18} className="text-primary" />
        <h3 className="font-semibold">Enviar Resumo Final</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Dispara um email para cada participante com o resumo completo de todas as apostas registradas.
        Use após o encerramento das apostas.
      </p>

      {resultado && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <div>{resultado.enviados} de {resultado.total} emails enviados com sucesso.</div>
            {resultado.erros && resultado.erros.length > 0 && (
              <div className="mt-1 text-xs text-red-400">
                {resultado.erros.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={14} />
          {erro}
        </div>
      )}

      <button
        onClick={enviar}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
        {saving ? 'Enviando...' : 'Enviar emails de resumo'}
      </button>
    </div>
  )
}
