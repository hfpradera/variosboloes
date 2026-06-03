'use client'

import { useState, useTransition } from 'react'
import { Trash2, Plus, Loader2, CheckCircle } from 'lucide-react'

interface EmailEntry {
  email: string
  criado_em: string
}

export function EmailsAprovadosManager({ inicial }: { inicial: EmailEntry[] }) {
  const [lista, setLista] = useState(inicial)
  const [novoEmail, setNovoEmail] = useState('')
  const [erro, setErro] = useState('')
  const [loading, start] = useTransition()

  async function adicionar() {
    const email = novoEmail.trim().toLowerCase()
    if (!email.includes('@')) {
      setErro('E-mail inválido')
      return
    }
    setErro('')
    start(async () => {
      const res = await fetch('/api/admin/emails-aprovados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setLista(prev => [{ email, criado_em: new Date().toISOString() }, ...prev.filter(e => e.email !== email)])
        setNovoEmail('')
      } else {
        const data = await res.json()
        setErro(data.error ?? 'Erro ao adicionar')
      }
    })
  }

  async function remover(email: string) {
    start(async () => {
      const res = await fetch('/api/admin/emails-aprovados', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setLista(prev => prev.filter(e => e.email !== email))
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Formulário */}
      <div className="card-copa p-4 space-y-3">
        <label className="text-sm font-medium">Adicionar e-mail pré-aprovado</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={novoEmail}
            onChange={e => { setNovoEmail(e.target.value); setErro('') }}
            onKeyDown={e => e.key === 'Enter' && adicionar()}
            placeholder="amigo@exemplo.com"
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={adicionar}
            disabled={loading || !novoEmail.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar
          </button>
        </div>
        {erro && <p className="text-xs text-red-400">{erro}</p>}
        <p className="text-xs text-muted-foreground">
          E-mails nesta lista entram diretamente após confirmar o cadastro, sem precisar de aprovação manual.
          Se o usuário já estiver cadastrado, ele é aprovado imediatamente.
        </p>
      </div>

      {/* Lista */}
      <div className="card-copa overflow-hidden">
        {lista.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum e-mail pré-aprovado ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left p-4">E-mail</th>
                <th className="text-center p-4">Adicionado em</th>
                <th className="text-center p-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(entry => (
                <tr key={entry.email} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400 shrink-0" />
                      <span className="font-medium">{entry.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">
                    {new Date(entry.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => remover(entry.email)}
                      disabled={loading}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
