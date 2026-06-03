-- Migration 008: adiciona fase 'semi' (semifinal com 2 jogos, 25pts)
-- e adiciona coluna pontos_semi na tabela pontuacoes

-- 1. Atualizar CHECK constraint da tabela fases para permitir 'semi'
ALTER TABLE fases DROP CONSTRAINT IF EXISTS fases_nome_check;
ALTER TABLE fases ADD CONSTRAINT fases_nome_check
  CHECK (nome IN ('oitavas', 'quartas', 'semifinal', 'semi', 'final'));

-- 2. Adicionar coluna pontos_semi na tabela pontuacoes
ALTER TABLE pontuacoes
  ADD COLUMN IF NOT EXISTS pontos_semi INTEGER NOT NULL DEFAULT 0;
