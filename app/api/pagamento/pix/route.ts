import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const MP_URL = 'https://api.mercadopago.com/v1/payments'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  // Buscar perfil e edição ativa
  const [{ data: perfil }, { data: edicao }] = await Promise.all([
    admin.from('perfis').select('nome, mp_payment_id, mp_pix_qr, mp_pix_qr_base64, mp_payment_status, pagamento_confirmado').eq('id', user.id).single() as any,
    admin.from('edicoes').select('id, valor_bolao, nome').in('status', ['aberto', 'em_andamento']).order('created_at', { ascending: false }).limit(1).single() as any,
  ])

  if (!edicao) return NextResponse.json({ error: 'Nenhuma edição ativa' }, { status: 404 })
  if (perfil?.pagamento_confirmado) return NextResponse.json({ status: 'approved' })

  // Se já tem pagamento pendente, verificar status no MP
  if (perfil?.mp_payment_id) {
    const check = await fetch(`${MP_URL}/${perfil.mp_payment_id}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    })
    const mp = await check.json()

    if (mp.status === 'approved') {
      await admin.from('perfis').update({ pagamento_confirmado: true, mp_payment_status: 'approved' }).eq('id', user.id)
      return NextResponse.json({ status: 'approved' })
    }

    if (mp.status === 'pending') {
      return NextResponse.json({
        status: 'pending',
        qr_code: perfil.mp_pix_qr,
        qr_code_base64: perfil.mp_pix_qr_base64,
        payment_id: perfil.mp_payment_id,
        valor: edicao.valor_bolao,
      })
    }
    // Se expirou ou cancelado, cria novo abaixo
  }

  // Criar novo pagamento PIX
  const nome = (perfil?.nome ?? user.email ?? 'Participante').split(' ')
  const res = await fetch(MP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `bolao-${user.id}-${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(edicao.valor_bolao),
      payment_method_id: 'pix',
      description: `Bolão Copa do Mundo 2026 — ${edicao.nome}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
      payer: {
        email: user.email,
        first_name: nome[0] ?? 'Participante',
        last_name: nome.slice(1).join(' ') || 'Bolão',
      },
    }),
  })

  const mp = await res.json()
  if (!res.ok || !mp.point_of_interaction?.transaction_data?.qr_code) {
    return NextResponse.json({ error: 'Erro ao gerar PIX', detail: mp }, { status: 500 })
  }

  const qr_code = mp.point_of_interaction.transaction_data.qr_code
  const qr_code_base64 = mp.point_of_interaction.transaction_data.qr_code_base64

  await admin.from('perfis').update({
    mp_payment_id: String(mp.id),
    mp_pix_qr: qr_code,
    mp_pix_qr_base64: qr_code_base64,
    mp_payment_status: 'pending',
  }).eq('id', user.id)

  return NextResponse.json({
    status: 'pending',
    qr_code,
    qr_code_base64,
    payment_id: String(mp.id),
    valor: edicao.valor_bolao,
  })
}
