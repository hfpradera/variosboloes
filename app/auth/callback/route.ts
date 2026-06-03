import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user?.email) {
      // Auto-aprovar se o email estiver na lista de pré-aprovados
      const admin = createAdminClient()
      const { data: preAprovado } = await admin
        .from('emails_pre_aprovados')
        .select('email')
        .eq('email', user.email.toLowerCase())
        .maybeSingle()
      if (preAprovado) {
        await admin
          .from('perfis')
          .update({ aprovado: true })
          .eq('id', user.id)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
