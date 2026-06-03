-- Migration 009: garante que todas as tabelas têm RLS ativado
-- (segurança contra tabelas criadas sem RLS ou com RLS desativado)

-- Ativar RLS em todas as tabelas do projeto (idempotente)
ALTER TABLE IF EXISTS perfis               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS edicoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS selecoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grupos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grupos_selecoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resultados_grupos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS confrontos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artilheiros          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS apostas_grupos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS apostas_artilheiro   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS apostas_confrontos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pontuacoes           ENABLE ROW LEVEL SECURITY;

-- Verificar quais tabelas ficaram sem política de leitura pública
-- e garantir as políticas mínimas (CREATE OR REPLACE não existe em policy,
-- então usamos DROP IF EXISTS + CREATE)

-- Estrutura do torneio: leitura pública
DROP POLICY IF EXISTS "edicoes_read"          ON edicoes;
DROP POLICY IF EXISTS "selecoes_read"         ON selecoes;
DROP POLICY IF EXISTS "grupos_read"           ON grupos;
DROP POLICY IF EXISTS "grupos_selecoes_read"  ON grupos_selecoes;
DROP POLICY IF EXISTS "resultados_grupos_read" ON resultados_grupos;
DROP POLICY IF EXISTS "fases_read"            ON fases;
DROP POLICY IF EXISTS "confrontos_read"       ON confrontos;
DROP POLICY IF EXISTS "artilheiros_read"      ON artilheiros;
DROP POLICY IF EXISTS "pontuacoes_select"     ON pontuacoes;

CREATE POLICY "edicoes_read"          ON edicoes          FOR SELECT USING (TRUE);
CREATE POLICY "selecoes_read"         ON selecoes         FOR SELECT USING (TRUE);
CREATE POLICY "grupos_read"           ON grupos           FOR SELECT USING (TRUE);
CREATE POLICY "grupos_selecoes_read"  ON grupos_selecoes  FOR SELECT USING (TRUE);
CREATE POLICY "resultados_grupos_read" ON resultados_grupos FOR SELECT USING (TRUE);
CREATE POLICY "fases_read"            ON fases            FOR SELECT USING (TRUE);
CREATE POLICY "confrontos_read"       ON confrontos       FOR SELECT USING (TRUE);
CREATE POLICY "artilheiros_read"      ON artilheiros      FOR SELECT USING (TRUE);
CREATE POLICY "pontuacoes_select"     ON pontuacoes       FOR SELECT USING (TRUE);
