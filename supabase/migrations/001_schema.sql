-- ============================================================
-- BOLÃO COPA DO MUNDO — Schema Principal
-- ============================================================

-- Edições da Copa
CREATE TABLE edicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano INT NOT NULL,
  valor_bolao DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  status TEXT NOT NULL DEFAULT 'configurando'
    CHECK (status IN ('configurando','aberto','em_andamento','encerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seleções / Países
CREATE TABLE selecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_iso CHAR(3) NOT NULL UNIQUE,
  bandeira_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grupos da fase de grupos
CREATE TABLE grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  nome CHAR(1) NOT NULL CHECK (nome IN ('A','B','C','D','E','F','G','H')),
  inicio_em TIMESTAMPTZ,
  encerrado BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (edicao_id, nome)
);

-- Seleções em cada grupo (4 por grupo)
CREATE TABLE grupos_selecoes (
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  selecao_id UUID NOT NULL REFERENCES selecoes(id),
  PRIMARY KEY (grupo_id, selecao_id)
);

-- Resultados oficiais dos grupos (preenchido pelo admin)
CREATE TABLE resultados_grupos (
  grupo_id UUID PRIMARY KEY REFERENCES grupos(id) ON DELETE CASCADE,
  primeiro_id UUID NOT NULL REFERENCES selecoes(id),
  segundo_id UUID NOT NULL REFERENCES selecoes(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fases do mata-mata
CREATE TABLE fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL CHECK (nome IN ('oitavas','quartas','semifinal','final')),
  inicio_em TIMESTAMPTZ,
  prazo_apostas_em TIMESTAMPTZ,
  apostas_liberadas BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (edicao_id, nome)
);

-- Confrontos do mata-mata
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

-- Artilheiro oficial
CREATE TABLE artilheiros (
  edicao_id UUID PRIMARY KEY REFERENCES edicoes(id) ON DELETE CASCADE,
  selecao_id UUID REFERENCES selecoes(id),
  jogador_nome TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Apostas dos participantes
-- ============================================================

-- Apostas na fase de grupos
CREATE TABLE apostas_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  primeiro_id UUID NOT NULL REFERENCES selecoes(id),
  segundo_id UUID NOT NULL REFERENCES selecoes(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, grupo_id)
);

-- Apostas artilheiro
CREATE TABLE apostas_artilheiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  jogador_nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, edicao_id)
);

-- Apostas mata-mata
CREATE TABLE apostas_confrontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confronto_id UUID NOT NULL REFERENCES confrontos(id) ON DELETE CASCADE,
  selecao_vencedor_id UUID NOT NULL REFERENCES selecoes(id),
  placar_a INT,
  placar_b INT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, confronto_id)
);

-- ============================================================
-- Pontuação (cache calculado pelo servidor)
-- ============================================================

CREATE TABLE pontuacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edicao_id UUID NOT NULL REFERENCES edicoes(id) ON DELETE CASCADE,
  pontos_grupos INT NOT NULL DEFAULT 0,
  pontos_oitavas INT NOT NULL DEFAULT 0,
  pontos_quartas INT NOT NULL DEFAULT 0,
  pontos_semifinal INT NOT NULL DEFAULT 0,
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

-- ============================================================
-- Perfis de usuário (extensão do auth.users)
-- ============================================================

CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Trigger: cria perfil automaticamente ao registrar usuário
-- ============================================================

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

-- ============================================================
-- Trigger: atualiza pontuacoes.primeira_aposta_em
-- ============================================================

CREATE OR REPLACE FUNCTION atualizar_primeira_aposta()
RETURNS TRIGGER AS $$
DECLARE
  v_edicao_id UUID;
BEGIN
  -- Descobrir edicao_id a partir do grupo
  SELECT g.edicao_id INTO v_edicao_id
  FROM grupos g WHERE g.id = NEW.grupo_id;

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

-- Índices para performance
CREATE INDEX idx_apostas_grupos_user ON apostas_grupos(user_id);
CREATE INDEX idx_apostas_confrontos_user ON apostas_confrontos(user_id);
CREATE INDEX idx_pontuacoes_total ON pontuacoes(edicao_id, pontos_total DESC);
CREATE INDEX idx_confrontos_fase ON confrontos(fase_id);
