-- ============================================================
-- Copa 2026 — Craque, Goleiro e Anti-cópia ampliado
-- ============================================================

-- 1) Adicionar craque e goleiro nas apostas e resultados
ALTER TABLE apostas_artilheiro
  ADD COLUMN IF NOT EXISTS craque_nome TEXT,
  ADD COLUMN IF NOT EXISTS goleiro_nome TEXT;

ALTER TABLE artilheiros
  ADD COLUMN IF NOT EXISTS craque_nome TEXT,
  ADD COLUMN IF NOT EXISTS goleiro_nome TEXT;

-- 2) Anti-cópia: apostas de grupos ficam ocultas até o grupo ser encerrado
DROP POLICY IF EXISTS "apostas_grupos_select_own" ON apostas_grupos;
CREATE POLICY "apostas_grupos_select" ON apostas_grupos
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id AND g.encerrado = TRUE
    )
  );

-- 3) Anti-cópia: artilheiro/craque/goleiro ficam ocultos até 14/06/2026 (03:00 UTC = meia-noite Brasília)
DROP POLICY IF EXISTS "apostas_artilheiro_select_own" ON apostas_artilheiro;
CREATE POLICY "apostas_artilheiro_select" ON apostas_artilheiro
  FOR SELECT USING (
    auth.uid() = user_id
    OR NOW() >= '2026-06-15 03:00:00+00'::timestamptz
  );

-- 4) Política de update para apostas_artilheiro (estava faltando)
DROP POLICY IF EXISTS "apostas_artilheiro_update" ON apostas_artilheiro;
CREATE POLICY "apostas_artilheiro_update" ON apostas_artilheiro
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < '2026-06-15 03:00:00+00'::timestamptz
    AND EXISTS (SELECT 1 FROM edicoes e WHERE e.id = edicao_id AND e.status = 'aberto')
  );

-- 5) Deadline global 14/06/2026 nas políticas de INSERT/UPDATE de apostas_grupos
DROP POLICY IF EXISTS "apostas_grupos_insert" ON apostas_grupos;
CREATE POLICY "apostas_grupos_insert" ON apostas_grupos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < '2026-06-15 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );

DROP POLICY IF EXISTS "apostas_grupos_update" ON apostas_grupos;
CREATE POLICY "apostas_grupos_update" ON apostas_grupos
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < '2026-06-15 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );
