-- Migration: AGT Mandatory Phrases & Cert Number
-- Adiciona o número de certificação à configuração AGT para exibição em documentos

ALTER TABLE agt_configs ADD COLUMN IF NOT EXISTS cert_number TEXT DEFAULT '0000/AGT/2026';

-- Comentário para auditoria
COMMENT ON COLUMN agt_configs.cert_number IS 'Número de certificação oficial atribuído pela AGT após homologação';
