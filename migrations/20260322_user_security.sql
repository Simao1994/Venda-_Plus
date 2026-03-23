-- Migration: AGT User Security Policy
-- Adiciona campos para controlo de expiração de passwords e bloqueio de contas

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Comentários para auditoria
COMMENT ON COLUMN users.password_updated_at IS 'Data da última alteração de password. Usado para expiração de 90 dias (AGT).';
COMMENT ON COLUMN users.failed_attempts IS 'Número de tentativas de login falhadas consecutivas.';
COMMENT ON COLUMN users.locked_until IS 'Data/Hora até a qual a conta está bloqueada após exceder tentativas.';
