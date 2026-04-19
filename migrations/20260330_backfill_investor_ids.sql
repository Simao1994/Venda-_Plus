-- Backfill sequential IDs for existing investors
WITH numbered AS (
  SELECT id, row_number() OVER (PARTITION BY company_id ORDER BY created_at ASC) as seq
  FROM investidores
  WHERE numero_sequencial IS NULL
)
UPDATE investidores
SET numero_sequencial = numbered.seq
FROM numbered
WHERE investidores.id = numbered.id;
