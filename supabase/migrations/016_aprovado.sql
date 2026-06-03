-- Coluna de aprovação pelo admin (separada do pagamento)
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS aprovado boolean NOT NULL DEFAULT false;

-- Admins já existentes ficam aprovados automaticamente
UPDATE perfis SET aprovado = true WHERE is_admin = true;
