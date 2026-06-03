'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Trophy, Menu, X, LogOut, User, BarChart3, Target, BookOpen, Star, Shield, Calculator } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Início', icon: Trophy },
  { href: '/apostas/grupos', label: 'Grupos', icon: Target },
  { href: '/apostas/especiais', label: 'Pré-Copa', icon: Star },
  { href: '/apostas/mata-mata', label: 'Mata-mata', icon: Shield },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
  { href: '/simular', label: 'Simular', icon: Calculator },
  { href: '/regras', label: 'Regras', icon: BookOpen },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function Header({ nomeUsuario }: { nomeUsuario?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuAberto, setMenuAberto] = useState(false)
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">⚽</span>
          <span className="text-primary">Bolão</span>
          <span className="text-secondary font-black">2026</span>
        </Link>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Çes */}
        <div className="flex items-center gap-2">
          {nomeUsuario && (
            <span className="hidden md:block text-sm text-muted-foreground">
              Olá, <strong className="text-foreground">{nomeUsuario.split(' ')[0]}</strong>
            </span>
          )}
          <button
            onClick={sair}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>

          {/* Menu mobile */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile aberto */}
      {menuAberto && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuAberto(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button
            onClick={sair}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      )}
    </header>
  )
}
