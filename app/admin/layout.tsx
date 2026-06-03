import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, Target, Shield, MailCheck } from 'lucide-react'

const navAdmin = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/grupos', label: 'Grupos', icon: Target },
  { href: '/admin/fases', label: 'Mata-Mata', icon: Shield },
  { href: '/admin/resultados', label: 'Resultados', icon: Trophy },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/emails-aprovados', label: 'Pré-aprovados', icon: MailCheck },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('is_admin, nome')
    .eq('id', user.id)
    .single()

  if (!perfil?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="text-lg font-black">
            <span className="text-primary">Admin</span>{' '}
            <span className="text-secondary">⚽</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{perfil.nome}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navAdmin.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            ← Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
