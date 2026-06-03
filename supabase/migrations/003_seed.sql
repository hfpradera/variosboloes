-- ============================================================
-- SEED — Copa do Mundo 2026 (EUA, Canadá, México)
-- 48 seleções — grupos A a L (formato ampliado)
-- Ajuste os grupos/datas conforme sorteio oficial
-- ============================================================

-- Seleções participantes
INSERT INTO selecoes (nome, codigo_iso) VALUES
  ('Argentina', 'ARG'),
  ('Austrália', 'AUS'),
  ('Áustria', 'AUT'),
  ('Bélgica', 'BEL'),
  ('Brasil', 'BRA'),
  ('Camarões', 'CMR'),
  ('Canadá', 'CAN'),
  ('Chile', 'CHL'),
  ('Colômbia', 'COL'),
  ('Costa Rica', 'CRC'),
  ('Costa do Marfim', 'CIV'),
  ('Croácia', 'CRO'),
  ('Dinamarca', 'DEN'),
  ('Egito', 'EGY'),
  ('Equador', 'ECU'),
  ('Espanha', 'ESP'),
  ('EUA', 'USA'),
  ('França', 'FRA'),
  ('Gana', 'GHA'),
  ('Inglaterra', 'ENG'),
  ('Irã', 'IRN'),
  ('Japão', 'JPN'),
  ('Marrocos', 'MAR'),
  ('México', 'MEX'),
  ('Nigéria', 'NGA'),
  ('Holanda', 'NED'),
  ('Polônia', 'POL'),
  ('Portugal', 'POR'),
  ('República Checa', 'CZE'),
  ('Romênia', 'ROU'),
  ('Senegal', 'SEN'),
  ('Sérvia', 'SRB'),
  ('Suíça', 'SUI'),
  ('Turquia', 'TUR'),
  ('Ucrânia', 'UKR'),
  ('Uruguai', 'URU'),
  ('Venezuela', 'VEN'),
  ('África do Sul', 'RSA'),
  ('Arábia Saudita', 'KSA'),
  ('Coreia do Sul', 'KOR'),
  ('Alemanha', 'GER'),
  ('Itália', 'ITA'),
  ('Grécia', 'GRE'),
  ('Panamá', 'PAN'),
  ('Peru', 'PER'),
  ('Iraque', 'IRQ'),
  ('Argélia', 'ALG'),
  ('Nova Zelândia', 'NZL')
ON CONFLICT (codigo_iso) DO NOTHING;

-- Edição Copa 2026
INSERT INTO edicoes (nome, ano, valor_bolao, status)
VALUES ('Copa do Mundo FIFA 2026', 2026, 50.00, 'configurando')
ON CONFLICT DO NOTHING;
