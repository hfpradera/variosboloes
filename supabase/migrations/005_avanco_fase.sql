-- ============================================================
-- Copa 2026 — Suporte a 3º colocado e fase de oitavas
-- ============================================================

-- Adiciona 3º colocado nos resultados de grupo
-- (Copa 2026: 8 melhores 3ºs de 12 grupos classificam)
ALTER TABLE resultados_grupos
  ADD COLUMN IF NOT EXISTS terceiro_id UUID REFERENCES selecoes(id);

-- Permite atualizar times de um confronto (para melhores terceiros)
-- Já existem as colunas selecao_a_id / selecao_b_id na tabela confrontos
-- Nenhuma alteração extra necessária.
