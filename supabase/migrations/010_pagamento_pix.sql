-- Campos para rastrear pagamento PIX via Mercado Pago
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_pix_qr TEXT,
  ADD COLUMN IF NOT EXISTS mp_pix_qr_base64 TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_status TEXT;
