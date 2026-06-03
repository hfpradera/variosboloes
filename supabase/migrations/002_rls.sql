-- ============================================================
-- Row Level Security — Bolão Copa do Mundo
-- ============================================================

-- Habilitar RLS em todas as tabelas de usuário
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_confrontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_artilheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacoes ENABLE ROW LEVEL SECURITY;

-- Tabelas públicas de leitura (estrutura do torneio)
ALTER TABLE edicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE selecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_selecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE confrontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE artilheiros ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Perfis
-- ============================================================
CREATE POLICY "perfis_select_own" ON perfis
  FOR SELECT USING (TRUE); -- qualquer um pode ver nomes/avatares no ranking

CREATE POLICY "perfis_update_own" ON perfis
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = FALSE); -- não pode se tornar admin

-- ============================================================
-- Estrutura do torneio (somente leitura para todos)
-- ============================================================
CREATE POLICY "edicoes_read" ON edicoes FOR SELECT USING (TRUE);
CREATE POLICY "selecoes_read" ON selecoes FOR SELECT USING (TRUE);
CREATE POLICY "grupos_read" ON grupos FOR SELECT USING (TRUE);
CREATE POLICY "grupos_selecoes_read" ON grupos_selecoes FOR SELECT USING (TRUE);
CREATE POLICY "resultados_grupos_read" ON resultados_grupos FOR SELECT USING (TRUE);
CREATE POLICY "fases_read" ON fases FOR SELECT USING (TRUE);
CREATE POLICY "confrontos_read" ON confrontos FOR SELECT USING (TRUE);
CREATE POLICY "artilheiros_read" ON artilheiros FOR SELECT USING (TRUE);

-- ============================================================
-- Apostas de Grupos
-- ============================================================
CREATE POLICY "apostas_grupos_select_own" ON apostas_grupos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "apostas_grupos_insert" ON apostas_grupos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Prazo: grupo ainda não começou
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );

CREATE POLICY "apostas_grupos_update" ON apostas_grupos
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );

-- ============================================================
-- Apostas Artilheiro
-- ============================================================
CREATE POLICY "apostas_artilheiro_select_own" ON apostas_artilheiro
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "apostas_artilheiro_insert" ON apostas_artilheiro
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Mesmo prazo da fase de grupos (antes do primeiro jogo)
    EXISTS (
      SELECT 1 FROM edicoes e
      WHERE e.id = edicao_id AND e.status = 'aberto'
    )
  );

-- ============================================================
-- Apostas Confrontos (mata-mata) — ANTI-CÓPIA
-- ============================================================
CREATE POLICY "apostas_confrontos_select" ON apostas_confrontos
  FOR SELECT USING (
    -- Pode ver suas próprias apostas sempre
    auth.uid() = user_id
    OR
    -- Pode ver apostas alheias apenas após a fase ser liberada
    EXISTS (
      SELECT 1 FROM confrontos c
      JOIN fases f ON c.fase_id = f.id
      WHERE c.id = confronto_id AND f.apostas_liberadas = TRUE
    )
  );

CREATE POLICY "apostas_confrontos_insert" ON apostas_confrontos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Confronto ainda não começou
    EXISTS (
      SELECT 1 FROM confrontos c
      WHERE c.id = confronto_id
        AND (c.inicio_em IS NULL OR c.inicio_em > NOW())
        AND c.vencedor_id IS NULL
    )
  );

CREATE POLICY "apostas_confrontos_update" ON apostas_confrontos
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM confrontos c
      WHERE c.id = confronto_id
        AND (c.inicio_em IS NULL OR c.inicio_em > NOW())
        AND c.vencedor_id IS NULL
    )
  );

-- ============================================================
-- Pontuações (leitura pública para o ranking)
-- ============================================================
CREATE POLICY "pontuacoes_select" ON pontuacoes
  FOR SELECT USING (TRUE);

-- ============================================================
-- Funções admin (service_role bypassa RLS)
-- As operações de admin usam SUPABASE_SERVICE_ROLE_KEY no backend
-- ============================================================
