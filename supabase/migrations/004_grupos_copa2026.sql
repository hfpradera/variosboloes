-- ============================================================
-- Copa do Mundo 2026 — Grupos completos
-- Fonte: nbcsports.com / FIFA (sorteio 05/12/2024)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1) Ampliar constraint de grupos para A-L
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_nome_check;
ALTER TABLE grupos ADD CONSTRAINT grupos_nome_check
  CHECK (nome IN ('A','B','C','D','E','F','G','H','I','J','K','L'));

-- 2) Inserir seleções que não estavam no seed inicial
INSERT INTO selecoes (nome, codigo_iso) VALUES
  ('Qatar',             'QAT'),
  ('Bósnia',            'BIH'),
  ('Escócia',           'SCO'),
  ('Haiti',             'HAI'),
  ('Paraguai',          'PAR'),
  ('Curaçao',           'CUW'),
  ('Tunísia',           'TUN'),
  ('Suécia',            'SWE'),
  ('Cabo Verde',        'CPV'),
  ('Noruega',           'NOR'),
  ('Jordânia',          'JOR'),
  ('Uzbequistão',       'UZB'),
  ('Congo DR',          'COD')
ON CONFLICT (codigo_iso) DO NOTHING;

-- 3) Criar os 12 grupos e associar seleções
DO $$
DECLARE
  v_edicao UUID;
  v_grupo  UUID;
BEGIN
  SELECT id INTO v_edicao FROM edicoes WHERE ano = 2026 LIMIT 1;

  IF v_edicao IS NULL THEN
    RAISE EXCEPTION 'Edição 2026 não encontrada. Execute o 003_seed.sql primeiro.';
  END IF;

  -- ── GRUPO A: México, Coreia do Sul, África do Sul, Rep. Checa
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'A')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'A';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('MEX','KOR','RSA','CZE')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO B: Canadá, Suíça, Qatar, Bósnia
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'B')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'B';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('CAN','SUI','QAT','BIH')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO C: Brasil, Marrocos, Escócia, Haiti
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'C')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'C';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('BRA','MAR','SCO','HAI')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO D: EUA, Paraguai, Austrália, Turquia
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'D')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'D';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('USA','PAR','AUS','TUR')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO E: Alemanha, Equador, Costa do Marfim, Curaçao
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'E')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'E';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('GER','ECU','CIV','CUW')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO F: Holanda, Japão, Tunísia, Suécia
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'F')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'F';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('NED','JPN','TUN','SWE')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO G: Bélgica, Irã, Egito, Nova Zelândia
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'G')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'G';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('BEL','IRN','EGY','NZL')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO H: Espanha, Uruguai, Arábia Saudita, Cabo Verde
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'H')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'H';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('ESP','URU','KSA','CPV')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO I: França, Senegal, Noruega, Iraque
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'I')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'I';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('FRA','SEN','NOR','IRQ')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO J: Argentina, Áustria, Argélia, Jordânia
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'J')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'J';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('ARG','AUT','ALG','JOR')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO K: Portugal, Colômbia, Uzbequistão, Congo DR
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'K')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'K';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('POR','COL','UZB','COD')
    ON CONFLICT DO NOTHING;

  -- ── GRUPO L: Inglaterra, Croácia, Panamá, Gana
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao, 'L')
    ON CONFLICT (edicao_id, nome) DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id = v_edicao AND nome = 'L';
  INSERT INTO grupos_selecoes (grupo_id, selecao_id)
    SELECT v_grupo, id FROM selecoes WHERE codigo_iso IN ('ENG','CRO','PAN','GHA')
    ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Grupos A-L criados com sucesso para a Copa 2026!';
END $$;

-- 4) Verificação: deve retornar 12 grupos com 4 seleções cada
SELECT g.nome AS grupo,
       string_agg(s.nome, ', ' ORDER BY s.nome) AS selecoes,
       count(*) AS total
FROM grupos g
JOIN grupos_selecoes gs ON gs.grupo_id = g.id
JOIN selecoes s ON s.id = gs.selecao_id
JOIN edicoes e ON e.id = g.edicao_id
WHERE e.ano = 2026
GROUP BY g.nome
ORDER BY g.nome;
