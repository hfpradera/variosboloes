-- ============================================================
-- MIGRATIONS COMBINADAS — Bolão Copa 2026
-- Cole tudo isso no SQL Editor do Supabase e clique Run
-- ============================================================

-- === 001_schema.sql ===
CREATE TABLE edicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano INT NOT NULL,
  valor_bolao DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  status TEXT NOT NULL DEFAULT 'configurando'
    CHECK (status IN ('configurando','aberto','em_andamento','encerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE selecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_iso CHAR(3) NOT NULL UNIQUE,
  bandeira_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  nome CHAR(1) NOT NULL CHECK (nome IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  inicio_em TIMESTAMPTZ,
  encerrado BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (edicao_id, nome)
);

CREATE TABLE grupos_selecoes (
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  selecao_id UUID NOT NULL REFERENCES selecoes(id),
  PRIMARY KEY (grupo_id, selecao_id)
);

CREATE TABLE resultados_grupos (
  grupo_id UUID PRIMARY KEY REFERENCES grupos(id) ON DELETE CASCADE,
  primeiro_id UUID NOT NULL REFERENCES selecoes(id),
  segundo_id UUID NOT NULL REFERENCES selecoes(id),
  terceiro_id UUID REFERENCES selecoes(id),
  terceiro_classificou BOOLEAN DEFAULT FALSE,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL CHECK (nome IN ('oitavas','quartas','semifinal','semi','final')),
  inicio_em TIMESTAMPTZ,
  prazo_apostas_em TIMESTAMPTZ,
  apostas_liberadas BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (edicao_id, nome)
);

CREATE TABLE confrontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id UUID NOT NULL REFERENCES fases(id) ON DELETE CASCADE,
  posicao INT NOT NULL,
  selecao_a_id UUID REFERENCES selecoes(id),
  selecao_b_id UUID REFERENCES selecoes(id),
  vencedor_id UUID REFERENCES selecoes(id),
  placar_a INT,
  placar_b INT,
  inicio_em TIMESTAMPTZ,
  UNIQUE (fase_id, posicao)
);

CREATE TABLE artilheiros (
  edicao_id UUID PRIMARY KEY REFERENCES edicoes(id) ON DELETE CASCADE,
  selecao_id UUID REFERENCES selecoes(id),
  jogador_nome TEXT NOT NULL,
  craque_nome TEXT,
  goleiro_nome TEXT,
  campea_nome TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apostas_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  primeiro_id UUID NOT NULL REFERENCES selecoes(id),
  segundo_id UUID NOT NULL REFERENCES selecoes(id),
  terceiro_id UUID REFERENCES selecoes(id),
  bolao_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, grupo_id)
);

CREATE TABLE apostas_artilheiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  jogador_nome TEXT,
  craque_nome TEXT,
  goleiro_nome TEXT,
  campea_nome TEXT,
  bolao_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, edicao_id)
);

CREATE TABLE apostas_confrontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confronto_id UUID NOT NULL REFERENCES confrontos(id) ON DELETE CASCADE,
  selecao_vencedor_id UUID NOT NULL REFERENCES selecoes(id),
  placar_a INT,
  placar_b INT,
  bolao_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, confronto_id)
);

CREATE TABLE pontuacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  bolao_id UUID,
  pontos_grupos INT NOT NULL DEFAULT 0,
  pontos_oitavas INT NOT NULL DEFAULT 0,
  pontos_quartas INT NOT NULL DEFAULT 0,
  pontos_semifinal INT NOT NULL DEFAULT 0,
  pontos_semi INT NOT NULL DEFAULT 0,
  pontos_final INT NOT NULL DEFAULT 0,
  pontos_artilheiro INT NOT NULL DEFAULT 0,
  pontos_total INT NOT NULL DEFAULT 0,
  acertos_total INT NOT NULL DEFAULT 0,
  acertos_final INT NOT NULL DEFAULT 0,
  acertos_semifinal INT NOT NULL DEFAULT 0,
  primeira_aposta_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, edicao_id)
);

CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  aprovado BOOLEAN NOT NULL DEFAULT FALSE,
  pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  mp_payment_id TEXT,
  mp_pix_qr TEXT,
  mp_pix_qr_base64 TEXT,
  mp_payment_status TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE boloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bolao_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id UUID NOT NULL REFERENCES boloes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  aprovado BOOLEAN NOT NULL DEFAULT FALSE,
  pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bolao_id, user_id)
);

CREATE TABLE emails_fase_log (
  fase_nome TEXT PRIMARY KEY,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_enviados INT NOT NULL DEFAULT 0
);

CREATE TABLE emails_pre_aprovados (
  email TEXT PRIMARY KEY,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_apostas_grupos_user ON apostas_grupos(user_id);
CREATE INDEX idx_apostas_confrontos_user ON apostas_confrontos(user_id);
CREATE INDEX idx_pontuacoes_total ON pontuacoes(edicao_id, pontos_total DESC);
CREATE INDEX idx_confrontos_fase ON confrontos(fase_id);

-- Índices parciais multi-bolão
CREATE UNIQUE INDEX IF NOT EXISTS apostas_grupos_user_grupo_bolao_idx
  ON apostas_grupos (user_id, grupo_id, bolao_id) WHERE bolao_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS apostas_confrontos_user_confronto_bolao_idx
  ON apostas_confrontos (user_id, confronto_id, bolao_id) WHERE bolao_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS apostas_artilheiro_user_bolao_idx
  ON apostas_artilheiro (user_id, bolao_id) WHERE bolao_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pontuacoes_user_bolao_idx
  ON pontuacoes (user_id, bolao_id) WHERE bolao_id IS NOT NULL;

-- === TRIGGERS ===
CREATE OR REPLACE FUNCTION criar_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION criar_perfil_usuario();

CREATE OR REPLACE FUNCTION atualizar_primeira_aposta()
RETURNS TRIGGER AS $$
DECLARE
  v_edicao_id UUID;
BEGIN
  SELECT g.edicao_id INTO v_edicao_id FROM grupos g WHERE g.id = NEW.grupo_id;
  INSERT INTO pontuacoes (user_id, edicao_id, primeira_aposta_em)
  VALUES (NEW.user_id, v_edicao_id, NEW.criado_em)
  ON CONFLICT (user_id, edicao_id) DO UPDATE
    SET primeira_aposta_em = LEAST(pontuacoes.primeira_aposta_em, NEW.criado_em);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_aposta_grupo_criada
  AFTER INSERT ON apostas_grupos
  FOR EACH ROW EXECUTE FUNCTION atualizar_primeira_aposta();

-- === RLS ===
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_confrontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas_artilheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontuacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE selecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_selecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE confrontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE artilheiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolao_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_fase_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_pre_aprovados ENABLE ROW LEVEL SECURITY;

-- Políticas públicas
CREATE POLICY "edicoes_read" ON edicoes FOR SELECT USING (TRUE);
CREATE POLICY "selecoes_read" ON selecoes FOR SELECT USING (TRUE);
CREATE POLICY "grupos_read" ON grupos FOR SELECT USING (TRUE);
CREATE POLICY "grupos_selecoes_read" ON grupos_selecoes FOR SELECT USING (TRUE);
CREATE POLICY "resultados_grupos_read" ON resultados_grupos FOR SELECT USING (TRUE);
CREATE POLICY "fases_read" ON fases FOR SELECT USING (TRUE);
CREATE POLICY "confrontos_read" ON confrontos FOR SELECT USING (TRUE);
CREATE POLICY "artilheiros_read" ON artilheiros FOR SELECT USING (TRUE);
CREATE POLICY "pontuacoes_select" ON pontuacoes FOR SELECT USING (TRUE);
CREATE POLICY "boloes_read" ON boloes FOR SELECT USING (ativo = TRUE);

CREATE POLICY "perfis_select_own" ON perfis FOR SELECT USING (TRUE);
CREATE POLICY "perfis_update_own" ON perfis
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = FALSE);

CREATE POLICY "apostas_grupos_select" ON apostas_grupos
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM grupos g WHERE g.id = grupo_id AND g.encerrado = TRUE)
  );

CREATE POLICY "apostas_grupos_insert" ON apostas_grupos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );

CREATE POLICY "apostas_grupos_update" ON apostas_grupos
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = grupo_id
        AND (g.inicio_em IS NULL OR g.inicio_em > NOW())
        AND g.encerrado = FALSE
    )
  );

CREATE POLICY "apostas_artilheiro_select" ON apostas_artilheiro
  FOR SELECT USING (
    auth.uid() = user_id
    OR NOW() >= '2026-06-11 03:00:00+00'::timestamptz
  );

CREATE POLICY "apostas_artilheiro_insert" ON apostas_artilheiro
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (SELECT 1 FROM edicoes e WHERE e.id = edicao_id AND e.status IN ('aberto','em_andamento'))
  );

CREATE POLICY "apostas_artilheiro_update" ON apostas_artilheiro
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < '2026-06-11 03:00:00+00'::timestamptz
    AND EXISTS (SELECT 1 FROM edicoes e WHERE e.id = edicao_id AND e.status IN ('aberto','em_andamento'))
  );

CREATE POLICY "apostas_confrontos_select" ON apostas_confrontos
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM confrontos c
      JOIN fases f ON c.fase_id = f.id
      WHERE c.id = confronto_id AND f.apostas_liberadas = TRUE
    )
  );

CREATE POLICY "apostas_confrontos_insert" ON apostas_confrontos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM confrontos c
      WHERE c.id = confronto_id
        AND (c.inicio_em IS NULL OR c.inicio_em > NOW())
        AND c.vencedor_id IS NULL
    )
  );

CREATE POLICY "apostas_confrontos_update" ON apostas_confrontos
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM confrontos c
      WHERE c.id = confronto_id
        AND (c.inicio_em IS NULL OR c.inicio_em > NOW())
        AND c.vencedor_id IS NULL
    )
  );

CREATE POLICY "bolao_membros_select" ON bolao_membros
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM bolao_membros bm
      WHERE bm.bolao_id = bolao_membros.bolao_id
        AND bm.user_id = auth.uid()
        AND bm.aprovado = TRUE
    )
  );

CREATE POLICY "bolao_membros_insert" ON bolao_membros
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND is_admin = FALSE AND aprovado = FALSE
  );

CREATE POLICY "service_role_only" ON emails_pre_aprovados USING (false);

-- === 003_seed.sql — Seleções e edição ===
INSERT INTO selecoes (nome, codigo_iso) VALUES
  ('Argentina','ARG'),('Austrália','AUS'),('Áustria','AUT'),
  ('Bélgica','BEL'),('Brasil','BRA'),('Camarões','CMR'),
  ('Canadá','CAN'),('Chile','CHL'),('Colômbia','COL'),
  ('Costa Rica','CRC'),('Costa do Marfim','CIV'),('Croácia','CRO'),
  ('Dinamarca','DEN'),('Egito','EGY'),('Equador','ECU'),
  ('Espanha','ESP'),('EUA','USA'),('França','FRA'),
  ('Gana','GHA'),('Inglaterra','ENG'),('Irã','IRN'),
  ('Japão','JPN'),('Marrocos','MAR'),('México','MEX'),
  ('Nigéria','NGA'),('Holanda','NED'),('Polônia','POL'),
  ('Portugal','POR'),('República Checa','CZE'),('Romênia','ROU'),
  ('Senegal','SEN'),('Sérvia','SRB'),('Suíça','SUI'),
  ('Turquia','TUR'),('Ucrânia','UKR'),('Uruguai','URU'),
  ('Venezuela','VEN'),('África do Sul','RSA'),('Arábia Saudita','KSA'),
  ('Coreia do Sul','KOR'),('Alemanha','GER'),('Itália','ITA'),
  ('Grécia','GRE'),('Panamá','PAN'),('Peru','PER'),
  ('Iraque','IRQ'),('Argélia','ALG'),('Nova Zelândia','NZL'),
  ('Qatar','QAT'),('Bósnia','BIH'),('Escócia','SCO'),
  ('Haiti','HAI'),('Paraguai','PAR'),('Curaçao','CUW'),
  ('Tunísia','TUN'),('Suécia','SWE'),('Cabo Verde','CPV'),
  ('Noruega','NOR'),('Jordânia','JOR'),('Uzbequistão','UZB'),
  ('Congo DR','COD')
ON CONFLICT (codigo_iso) DO NOTHING;

INSERT INTO edicoes (nome, ano, valor_bolao, status)
VALUES ('Copa do Mundo FIFA 2026', 2026, 50.00, 'aberto')
ON CONFLICT DO NOTHING;

-- === 004_grupos_copa2026.sql — 12 grupos ===
DO $$
DECLARE
  v_edicao UUID;
  v_grupo  UUID;
BEGIN
  SELECT id INTO v_edicao FROM edicoes WHERE ano = 2026 LIMIT 1;

  -- GRUPO A
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'A') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='A';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('MEX','KOR','RSA','CZE') ON CONFLICT DO NOTHING;

  -- GRUPO B
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'B') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='B';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('CAN','SUI','QAT','BIH') ON CONFLICT DO NOTHING;

  -- GRUPO C
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'C') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='C';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('BRA','MAR','SCO','HAI') ON CONFLICT DO NOTHING;

  -- GRUPO D
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'D') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='D';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('USA','PAR','AUS','TUR') ON CONFLICT DO NOTHING;

  -- GRUPO E
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'E') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='E';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('GER','ECU','CIV','CUW') ON CONFLICT DO NOTHING;

  -- GRUPO F
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'F') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='F';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('NED','JPN','TUN','SWE') ON CONFLICT DO NOTHING;

  -- GRUPO G
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'G') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='G';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('BEL','IRN','EGY','NZL') ON CONFLICT DO NOTHING;

  -- GRUPO H
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'H') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='H';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('ESP','URU','KSA','CPV') ON CONFLICT DO NOTHING;

  -- GRUPO I
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'I') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='I';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('FRA','SEN','NOR','IRQ') ON CONFLICT DO NOTHING;

  -- GRUPO J
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'J') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='J';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('ARG','AUT','ALG','JOR') ON CONFLICT DO NOTHING;

  -- GRUPO K
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'K') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='K';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('POR','COL','UZB','COD') ON CONFLICT DO NOTHING;

  -- GRUPO L
  INSERT INTO grupos (edicao_id, nome) VALUES (v_edicao,'L') ON CONFLICT DO NOTHING;
  SELECT id INTO v_grupo FROM grupos WHERE edicao_id=v_edicao AND nome='L';
  INSERT INTO grupos_selecoes (grupo_id,selecao_id) SELECT v_grupo,id FROM selecoes WHERE codigo_iso IN ('ENG','CRO','PAN','GHA') ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Grupos A-L criados com sucesso!';
END $$;
