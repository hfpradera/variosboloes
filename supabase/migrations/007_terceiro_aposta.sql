-- ============================================================
-- Copa 2026 — Aposta no 3º colocado de cada grupo
-- ============================================================

-- Adiciona 3º apostado pelo usuário
ALTER TABLE apostas_grupos
  ADD COLUMN IF NOT EXISTS terceiro_id UUID REFERENCES selecoes(id);

-- Adiciona flag se o 3º avançou como melhor 3º (admin marca)
ALTER TABLE resultados_grupos
  ADD COLUMN IF NOT EXISTS terceiro_classificou BOOLEAN DEFAULT FALSE;

-- RLS: allow terceiro_id no insert/update (políticas já existem, sem mudança necessária)
