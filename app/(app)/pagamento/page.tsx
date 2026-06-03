'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, Copy, Loader2, RefreshCw, QrCode } from 'lucide-react'
import Image from 'next/image'

type Estado = 'carregando' | 'pendente' | 'aprovado' | 'erro'

export default function PagamentoPage() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [qr, setQr] = useState('')
  const [qrBase64, setQrBase64] = useState('')
  const [valor, setValor] = useState(0)
  const [copiado, setCopiado] = useState(false)
  const [verificando, setVerificando] = useState(false)

  const carregar = useCallback(async () => {
    setEstado('carregando')
    try {
      const res = await fetch('/api/pagamento/pix', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'approved') {
        setEstado('aprovado')
      } else if (data.status === 'pending') {
        setQr(data.qr_code)
        setQrBase64(data.qr_code_base64 ?? '')
        setValor(data.valor)
        setEstado('pendente')
      } else {
        setEstado('erro')
      }
    } catch {
      setEstado('erro')
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function copiar() {
    await navigator.clipboard.writeText(qr)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  async function verificarPagamento() {
    setVerificando(true)
    await carregar()
    setVerificando(false)
  }

  if (estado === 'carregando') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (estado === 'aprovado') {
    return (
      <div className="animate-fade-in max-w-md mx-auto text-center space-y-4 py-10">
        <CheckCircle size={64} className="text-green-500 mx-auto" />
        <h1 className="text-2xl font-black">Pagamento confirmado!</h1>
        <p className="text-muted-foreground">Sua participação no Bolão Copa 2026 está garantida. Boas apostas!</p>
      </div>
    )
  }

  if (estado === 'erro') {
    return (
      <div className="animate-fade-in max-w-md mx-auto text-center space-y-4 py-10">
        <p className="text-muted-foreground">Não foi possível gerar o PIX. Tente novamente.</p>
        <button onClick={carregar} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <QrCode className="text-primary" size={28} />
          Pagar com PIX
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Valor: <strong className="text-foreground text-lg">R$ {Number(valor).toFixed(2).replace('.', ',')}</strong>
        </p>
      </div>

      <div className="card-copa p-6 space-y-5 text-center">
        {/* QR Code */}
        {qrBase64 ? (
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl inline-block">
              <Image
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR Code PIX"
                width={200}
                height={200}
              />
            </div>
          </div>
        ) : (
          <div className="w-[200px] h-[200px] mx-auto bg-muted rounded-xl flex items-center justify-center">
            <QrCode size={48} className="text-muted-foreground" />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Escaneie o QR code <strong className="text-foreground">ou</strong> copie o código abaixo
        </p>

        {/* Copia e Cola */}
        <div className="space-y-2">
          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground break-all text-left font-mono max-h-24 overflow-y-auto">
            {qr}
          </div>
          <button
            onClick={copiar}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <Copy size={16} />
            {copiado ? 'Código copiado!' : 'Copiar código PIX'}
          </button>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Após pagar, clique no botão abaixo para confirmar.</p>
          <button
            onClick={verificarPagamento}
            disabled={verificando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {verificando
              ? <><Loader2 size={14} className="animate-spin" /> Verificando...</>
              : <><RefreshCw size={14} /> Já paguei — verificar</>
            }
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        O pagamento é processado pelo Mercado Pago. A confirmação é automática em até 1 minuto.
      </p>
    </div>
  )
}
