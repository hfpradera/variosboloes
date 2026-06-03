'use client'
import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

export function EnviarEspelhoButton() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')

  async function enviar() {
    setEstado('loading')
    try {
      const res = await fetch('/api/me/enviar-espelho', { method: 'POST' })
      setEstado(res.ok ? 'ok' : 'erro')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <button
      onClick={enviar}
      disabled={estado === 'loading' || estado === 'ok'}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {estado === 'ok' ? (
        <CheckCircle size={15} className="text-green-400" />
      ) : estado === 'erro' ? (
        <AlertCircle size={15} className="text-red-400" />
      ) : (
        <Send size={15} />
      )}
      {estado === 'loading'
        ? 'Enviando...'
        : estado === 'ok'
        ? 'Email enviado com sucesso!'
        : estado === 'erro'
        ? 'Erro ao enviar — tente novamente'
        : 'Receber minhas apostas por email'}
    </button>
  )
}
