-- 1) jogador_nome pode ser nulo (campos especiais são todos opcionais)
ALTER TABLE apostas_artilheiro
  ALTER COLUMN jogador_nome DROP NOT NULL;

-- 2) Política de INSERT para apostas_artilheiro (estava faltando)
DROP POLICY IF EXISTS "apostas_artilheiro_insert" ON apostas_artilheiro;
CREATE POLICY "apostas_artilheiro_insert" ON apostas_artilheiro
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM edicoes e
      WHERE e.id = edicao_id
        AND e.status IN ('aberto', 'em_andamento')
    )
  );

-- 3) Política de UPDATE — aceitar aberto e em_andamento
DROP POLICY IF EXISTS "apostas_artilheiro_update" ON apostas_artilheiro;
CREATE POLICY "apostas_artilheiro_update" ON apostas_artilheiro
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM edicoes e
      WHERE e.id = edicao_id
        AND e.status IN ('aberto', 'em_andamento')
    )
  );
