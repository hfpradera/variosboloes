CREATE TABLE IF NOT EXISTS emails_pre_aprovados (
  email text PRIMARY KEY,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emails_pre_aprovados ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler/escrever (acesso via admin client)
CREATE POLICY "service_role_only" ON emails_pre_aprovados
  USING (false);
