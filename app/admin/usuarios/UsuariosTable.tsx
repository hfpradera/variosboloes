'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, Loader2, Clock, KeyRound, Mail, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Usuario {
  id: string
  nome: string
  pagamento_confirmado: boolean
  bloqueado: boolean
  is_admin: boolean
  aprovado: boolean
  criado_em: string
  grupos_apostados: number
  apostou_especiais: boolean
}

export function UsuariosTable({ usuarios, totalGrupos }: { usuarios: Usuario[]; totalGrupos: number }) {
  const pendentes = usuarios.filter(u => !u.aprovado && !u.is_admin)
  const aprovados = usuarios.filter(u => u.aprovado || u.is_admin)

  return (
    <div className="space-y-6">
      {pendentes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
            <Clock size={14} /> Aguardando aprovação ({pendentes.length})
          </h2>
          <div className="card-copa overflow-hidden border-yellow-500/30">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-center p-4">Cadastro</th>
                    <th className="text-center p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map(u => (
                    <UsuarioRow key={u.id} usuario={u} totalGrupos={totalGrupos} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {pendentes.length > 0 && (
          <h2 className="text-sm font-semibold text-muted-foreground">Participantes aprovados ({aprovados.length})</h2>
        )}
        <div className="card-copa overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                  <th className="text-left p-4">Nome</th>
                  <th className="text-center p-4">Pagamento</th>
                  <th className="text-center p-4">Apostas</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {aprovados.map(u => (
                  <UsuarioRow key={u.id} usuario={u} totalGrupos={totalGrupos} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsuarioRow({ usuario, totalGrupos }: { usuario: Usuario; totalGrupos: number }) {
  const [pagamento, setPagamento] = useState(usuario.pagamento_confirmado)
  const [bloqueado, setBloqueado] = useState(usuario.bloqueado)
  const [aprovado, setAprovado] = useState(usuario.aprovado)
  const [resetEnviado, setResetEnviado] = useState(false)
  const [espelhoEnviado, setEspelhoEnviado] = useState(false)
  const [loading, start] = useTransition()

  const gruposCompletos = usuario.grupos_apostados >= totalGrupos
  const tudoFeito = gruposCompletos && usuario.apostou_especiais

  async function toggle(campo: 'pagamento_confirmado' | 'bloqueado' | 'aprovado', valor: boolean) {
    start(async () => {
      await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: usuario.id, campo, valor }),
      })
      if (campo === 'pagamento_confirmado') setPagamento(valor)
      if (campo === 'bloqueado') setBloqueado(valor)
      if (campo === 'aprovado') setAprovado(valor)
    })
  }

  async function enviarResetSenha() {
    start(async () => {
      await fetch('/api/admin/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: usuario.id }),
      })
      setResetEnviado(true)
      setTimeout(() => setResetEnviado(false), 4000)
    })
  }

  async function enviarEspelho() {
    start(async () => {
      await fetch('/api/admin/enviar-resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: usuario.id }),
      })
      setEspelhoEnviado(true)
      setTimeout(() => setEspelhoEnviado(false), 4000)
    })
  }

  const membro_desde = new Date(usuario.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  if (!aprovado && !usuario.is_admin) {
    return (
      <tr className="border-b border-border last:border-0 bg-yellow-500/5">
        <td className="p-4">
          <div className="font-medium">{usuario.nome}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Cadastro em {membro_desde}</div>
        </td>
        <td className="p-4 text-center">
          <span className="text-xs text-yellow-400">{membro_desde}</span>
        </td>
        <td className="p-4">
          <div className="flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            ) : (
              <>
                <button onClick={() => toggle('aprovado', true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                  ✓ Aprovar
                </button>
                <button onClick={() => toggle('bloqueado', true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={cn('border-b border-border last:border-0', bloqueado && 'opacity-50')}>
      <td className="p-4">
        <div className="font-medium">{usuario.nome}</div>
        {usuario.is_admin && <span className="text-xs text-secondary">Admin</span>}
      </td>

      {/* Pagamento */}
      <td className="p-4 text-center">
        {pagamento ? (
          <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
            <CheckCircle size={14} /> Confirmado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-yellow-500 text-xs">
            <XCircle size={14} /> Pendente
          </span>
        )}
      </td>

      {/* Apostas */}
      <td className="p-4 text-center">
        {usuario.is_admin ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="space-y-1">
            {/* Grupos */}
            <div className={cn(
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              gruposCompletos
                ? 'bg-green-500/15 text-green-400'
                : 'bg-yellow-500/15 text-yellow-400'
            )}>
              {gruposCompletos
                ? <CheckCircle size={11} />
                : <AlertTriangle size={11} />
              }
              {usuario.grupos_apostados}/{totalGrupos} grupos
            </div>

            {/* Especiais */}
            <div className={cn(
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              usuario.apostou_especiais
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'
            )}>
              {usuario.apostou_especiais
                ? <><CheckCircle size={11} /> Especiais</>
                : <><XCircle size={11} /> Sem especiais</>
              }
            </div>
          </div>
        )}
      </td>

      {/* Status */}
      <td className="p-4 text-center">
        {bloqueado ? (
          <span className="text-xs text-red-400 font-medium">Bloqueado</span>
        ) : (
          <span className="text-xs text-green-400">Ativo</span>
        )}
      </td>

      {/* Ações */}
      <td className="p-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <>
              {!usuario.is_admin && (
                <button
                  onClick={() => toggle('pagamento_confirmado', !pagamento)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    pagamento
                      ? 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  )}
                >
                  {pagamento ? 'Cancelar pgto' : 'Confirmar pgto'}
                </button>
              )}
              {!usuario.is_admin && (
                <button
                  onClick={() => toggle('bloqueado', !bloqueado)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    bloqueado
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  )}
                >
                  {bloqueado ? 'Desbloquear' : 'Bloquear'}
                </button>
              )}

              {/* Enviar espelho */}
              {!usuario.is_admin && (
                <button
                  onClick={enviarEspelho}
                  disabled={espelhoEnviado}
                  title="Enviar espelho das apostas por email"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                    tudoFeito
                      ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
                    espelhoEnviado && 'opacity-60'
                  )}
                >
                  <Mail size={12} />
                  {espelhoEnviado ? 'Enviado!' : 'Espelho'}
                </button>
              )}

              <button
                onClick={enviarResetSenha}
                disabled={resetEnviado}
                title="Enviar link de redefinição de senha"
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-60 flex items-center gap-1"
              >
                <KeyRound size={12} />
                {resetEnviado ? 'Enviado!' : 'Reset senha'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
