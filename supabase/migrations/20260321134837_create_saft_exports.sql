CREATE TABLE IF NOT EXISTS saft_exports (
  id SERIAL PRIMARY KEY,
  empresa_id INT,
  periodo_inicio DATE,
  periodo_fim DATE,
  data_exportacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_faturas INT,
  total_valor NUMERIC,
  status VARCHAR(20),
  ficheiro TEXT
);
