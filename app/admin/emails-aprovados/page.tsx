import { createAdminClient } from '@/lib/supabase/admin'
import { EmailsAprovadosManager } from './EmailsAprovadosManager'

export default async function EmailsAprovadosPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('emails_pre_aprovados')
    .select('email, criado_em')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">E-mails pré-aprovados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quem cadastrar com estes e-mails entra direto, sem precisar de aprovação manual.
        </p>
      </div>
      <EmailsAprovadosManager inicial={data ?? []} />
    </div>
  )
}
