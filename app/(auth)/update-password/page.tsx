'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarSenha: z.string(),
}).refine(d => d.senha === d.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
})

type FormData = z.infer<typeof schema>

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="card-copa p-8 animate-pulse h-64" />}>
      <UpdatePasswordForm />
    </Suspense>
  )
}

function UpdatePasswordForm() {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)
  const [semSessao, setSemSessao] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const supabase = createClient()

    // Fluxo implícito: token vem no hash da URL (#access_token=...&type=recovery)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token') ?? ''
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setSemSessao(true)
          setPronto(true)
        })
      return
    }

    // Fluxo PKCE: sessão já foi trocada pelo /auth/callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setSemSessao(true)
      setPronto(true)
    })
  }, [])

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    setErro('')
    const { error } = await supabase.auth.updateUser({ password: data.senha })
    if (error) {
      setErro('Erro ao atualizar senha. Tente novamente.')
      return
    }
    setSucesso(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (!pronto) {
    return (
      <div className="card-copa p-8 text-center">
        <Loader2 size={32} className="animate-spin text-primary mx-auto" />
      </div>
    )
  }

  if (semSessao) {
    return (
      <div className="card-copa p-8 text-center animate-fade-in">
        <p className="text-red-400 text-sm mb-4">Link inválido ou expirado. Solicite um novo link de redefinição.</p>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="card-copa p-8 text-center animate-fade-in">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Senha atualizada!</h2>
        <p className="text-muted-foreground text-sm">Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="card-copa p-8 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-center">Nova Senha</h2>

      {erro && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nova senha</label>
          <div className="relative">
            <input
              {...register('senha')}
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
          <div className="relative">
            <input
              {...register('confirmarSenha')}
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Repita a senha"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {errors.confirmarSenha && <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          Salvar nova senha
        </button>
      </form>
    </div>
  )
}
