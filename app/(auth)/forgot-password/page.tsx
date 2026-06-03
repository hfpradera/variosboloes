'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [enviado, setEnviado] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    })
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="card-copa p-8 text-center animate-fade-in">
        <Mail size={48} className="text-secondary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Verifique seu e-mail</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
        </p>
        <Link href="/login" className="text-secondary font-semibold hover:underline text-sm">
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="card-copa p-8 animate-fade-in">
      <h2 className="text-xl font-bold mb-2 text-center">Recuperar Senha</h2>
      <p className="text-muted-foreground text-sm text-center mb-6">
        Digite seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          Enviar link
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          ← Voltar ao login
        </Link>
      </p>
    </div>
  )
}
