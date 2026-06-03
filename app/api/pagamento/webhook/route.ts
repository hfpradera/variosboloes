import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // MP envia action + data.id
    const paymentId = body?.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Verificar status real no MP
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    })
    const mp = await res.json()

    if (mp.status !== 'approved') return NextResponse.json({ ok: true })

    // Dar baixa no pagamento
    const admin = createAdminClient()
    await admin
      .from('perfis')
      .update({ pagamento_confirmado: true, mp_payment_status: 'approved' })
      .eq('mp_payment_id', String(paymentId))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
