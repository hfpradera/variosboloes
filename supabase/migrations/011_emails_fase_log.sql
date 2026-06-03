-- Tabela de controle de envio de emails por fase
-- Garante que cada fase só receba o email de resumo uma vez.
CREATE TABLE IF NOT EXISTS emails_fase_log (
  fase_nome      TEXT        PRIMARY KEY,   -- 'grupos' | 'oitavas' | 'quartas' | 'semifinal' | 'final'
  enviado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_enviados INT         NOT NULL DEFAULT 0
);
