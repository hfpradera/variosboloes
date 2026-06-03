-- Adiciona campo seleção campeã nas apostas especiais e na tabela de resultados
ALTER TABLE apostas_artilheiro
  ADD COLUMN IF NOT EXISTS campea_nome TEXT;

ALTER TABLE artilheiros
  ADD COLUMN IF NOT EXISTS campea_nome TEXT;
