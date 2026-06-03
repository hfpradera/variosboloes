'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(60, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarSenha: z.string(),
}).refine(d => d.senha === d.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setErro('')

    const res = await fetch('/api/auth/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: data.nome, email: data.email, senha: data.senha }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErro(json.error ?? 'Erro ao criar conta.')
      return
    }

    // Notificar admin (fire-and-forget)
    void fetch('/api/auth/notificar-cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: data.nome, email: data.email }),
    }).catch(() => {})

    // Login automático
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    })

    if (loginError) {
      setSucesso(true)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (sucesso) {
    return (
      <div className="card-copa p-8 text-center animate-fade-in">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Cadastro realizado!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Sua conta foi criada. Aguarde a aprovação do administrador para acessar o bolão.
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="card-copa p-8 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 text-center">Criar Conta</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome completo</label>
          <input
            {...register('nome')}
            type="text"
            placeholder="Seu nome"
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
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
          <label className="block text-sm font-medium mb-1">Confirmar senha</label>
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

        {erro && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          Criar conta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="text-secondary font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
