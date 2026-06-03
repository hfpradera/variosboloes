-- Migration 010: sistema multi-bolão (NÃO-DESTRUTIVA)
-- ✅ Apostas existentes continuam funcionando (bolao_id nullable)
-- ✅ Políticas RLS existentes NÃO são alteradas
-- ✅ Constraints únicos existentes NÃO são alterados
-- ✅ Novos bolões coexistem com o sistema atual

-- ============================================================
-- 1. Tabela boloes
-- ============================================================
CREATE TABLE boloes (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT    NOT NULL,
  descricao   TEXT,
  edicao_id   UUID    NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Membros de cada bolão
-- ============================================================
CREATE TABLE bolao_membros (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id             UUID    NOT NULL REFERENCES boloes(id) ON DELETE CASCADE,
  user_id              UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin             BOOLEAN NOT NULL DEFAULT FALSE,
  aprovado             BOOLEAN NOT NULL DEFAULT FALSE,
  pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado            BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bolao_id, user_id)
);

-- ============================================================
-- 3. Adicionar bolao_id como NULLABLE nas tabelas de apostas
--    (não altera constraints existentes — apostas sem bolão continuam ok)
-- ============================================================

ALTER TABLE apostas_grupos
  ADD COLUMN IF NOT EXISTS bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE;

ALTER TABLE apostas_confrontos
  ADD COLUMN IF NOT EXISTS bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE;

ALTER TABLE apostas_artilheiro
  ADD COLUMN IF NOT EXISTS bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE;

ALTER TABLE pontuacoes
  ADD COLUMN IF NOT EXISTS bolao_id UUID REFERENCES boloes(id) ON DELETE CASCADE;

-- ============================================================
-- 4. Novos constraints únicos PARCIAIS para apostas COM bolão
--    (não conflitam com apostas sem bolão — NULL é ignorado pelo UNIQUE)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS apostas_grupos_user_grupo_bolao_idx
  ON apostas_grupos (user_id, grupo_id, bolao_id)
  WHERE bolao_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS apostas_confrontos_user_confronto_bolao_idx
  ON apostas_confrontos (user_id, confronto_id, bolao_id)
  WHERE bolao_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS apostas_artilheiro_user_bolao_idx
  ON apostas_artilheiro (user_id, bolao_id)
  WHERE bolao_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pontuacoes_user_bolao_idx
  ON pontuacoes (user_id, bolao_id)
  WHERE bolao_id IS NOT NULL;

-- ============================================================
-- 5. RLS nas novas tabelas
-- ============================================================
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_membros ENABLE ROW LEVEL SECURITY;

-- Bolões ativos: qualquer um pode ver (para a landing page)
CREATE POLICY "boloes_read" ON boloes
  FOR SELECT USING (ativo = TRUE);

-- Membros: usuário vê seu próprio registro + membros do mesmo bolão (se aprovado)
CREATE POLICY "bolao_membros_select" ON bolao_membros
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM bolao_membros bm
      WHERE bm.bolao_id = bolao_membros.bolao_id
        AND bm.user_id  = auth.uid()
        AND bm.aprovado = TRUE
    )
  );

-- Usuário pode solicitar entrada (INSERT do próprio registro, sem admin)
CREATE POLICY "bolao_membros_insert" ON bolao_membros
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_admin = FALSE
    AND aprovado = FALSE
  );

-- ============================================================
-- NOTA: As políticas RLS de apostas_grupos, apostas_confrontos,
-- apostas_artilheiro e apostas_confrontos NÃO foram alteradas.
-- As apostas existentes (bolao_id NULL) continuam funcionando
-- com as políticas da migration 002 e 006.
-- Quando o sistema multi-bolão estiver em uso, as novas apostas
-- terão bolao_id preenchido e serão verificadas via bolao_membros
-- na camada de aplicação (API routes).
-- ============================================================
